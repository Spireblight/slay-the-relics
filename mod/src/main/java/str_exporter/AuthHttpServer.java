package str_exporter;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.files.FileHandle;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.File;
import java.io.IOException;
import java.net.InetSocketAddress;

public class AuthHttpServer implements HttpHandler {
    private String state;

    private String index;

    private String token = "";

    private final int port = 49000;

    private HttpServer server;

    public AuthHttpServer(String state) {
        FileHandle fd = Gdx.files.internal("SlayTheRelicsExporter" + File.separator + "index.html");
        this.state = state;
        index = fd.readString().replaceFirst("STATE", state);
    }

    public void start() throws IOException {
        server = HttpServer.create(new InetSocketAddress(this.port), 0);
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
        System.out.println("Sending 200");
        httpExchange.sendResponseHeaders(200, -1);
    }

    public synchronized String getToken() {
        return token;
    }

    private synchronized void setToken(String token) {
        this.token = token;
    }
}
