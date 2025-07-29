package str_exporter.config;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.files.FileHandle;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.File;
import java.io.IOException;
import java.net.InetSocketAddress;

public class AuthHttpServer implements HttpHandler {
    private final String state;
    private final String index;
    private final String success;
    private String token = "";
    private HttpServer server;

    public AuthHttpServer(String state) {
        FileHandle fd = Gdx.files.internal("SlayTheRelicsExporter" + File.separator + "index.html");
        this.state = state;
        index = fd.readString().replaceFirst("STATE", state);

        fd = Gdx.files.internal("SlayTheRelicsExporter" + File.separator + "success.html");
        this.success = fd.readString();
    }

    public void start() throws IOException {
        int port = 49000;
        server = HttpServer.create(new InetSocketAddress(port), 0);
        server.createContext("/", this);
        server.setExecutor(null);
        server.start();
    }

    public void stop() {
        server.stop(0);
    }

    @Override
    public void handle(HttpExchange httpExchange) throws IOException {
        String method = httpExchange.getRequestMethod();
        String path = httpExchange.getRequestURI().getPath();

        if (!method.equals("GET")) {
            httpExchange.sendResponseHeaders(404, -1);
            return;
        }
        if (!path.equals("/")) {
            httpExchange.sendResponseHeaders(404, -1);
            return;
        }

        String query = httpExchange.getRequestURI().getQuery();
        if (query == null || query.isEmpty()) {
            httpExchange.sendResponseHeaders(200, index.length());
            httpExchange.getResponseBody().write(index.getBytes());
            return;
        }

        String[] params = query.split("&");
        String code = "";
        String state = "";
        for (String param : params) {
            if (param.startsWith("code=")) {
                code = param.split("=")[1].trim();
            } else if (param.startsWith("state=")) {
                state = param.split("=")[1];
            }
        }
        if (!state.equals(this.state)) {
            httpExchange.sendResponseHeaders(404, -1);
            return;
        }

        setToken(code);
        httpExchange.sendResponseHeaders(200, success.length());
        httpExchange.getResponseBody().write(success.getBytes());
    }

    public synchronized String getToken() {
        return token;
    }

    private synchronized void setToken(String token) {
        this.token = token;
    }
}
