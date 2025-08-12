package str_exporter.client;


import com.google.gson.stream.JsonReader;
import str_exporter.config.Config;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.lang.reflect.Type;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

public class EBSClient {
    public final AtomicLong lastSuccessRequest = new AtomicLong(0);
    private final Config config;

    public EBSClient(Config config) {
        this.config = config;
    }

    public User verifyCredentials(String code) throws IOException {
        Map<String, String> body = new HashMap<>();
        body.put("code", code);
        return doRequest("POST", "/api/v1/auth", config.gson.toJson(body), User.class);
    }

    public void broadcastMessage(String message) throws IOException {
        doRequest("POST", "/api/v1/message", message, String.class);
    }

    public void postGameState(String gs) throws IOException {
        doRequest("POST", "/api/v2/game-state", gs, HashMap.class);
    }

    private <T> T doRequest(String method, String path, String body, Type outputType) throws IOException {
        URL url = new URL(config.getApiUrl() + path);
        HttpURLConnection con = (HttpURLConnection) url.openConnection();
        con.setRequestMethod(method);
        con.setRequestProperty("Content-Type", "application/json");
        con.setRequestProperty("Accept", "application/json");
        if (config.areCredentialsValid()) {
            con.setRequestProperty("Authorization", "Bearer " + config.getOathToken());
            con.setRequestProperty("User-ID", config.getUser());
        }

        if (body != null && !body.isEmpty()) {
            con.setDoOutput(true);
            try (OutputStream os = con.getOutputStream()) {
                os.write(body.getBytes(StandardCharsets.UTF_8));
            }
        }

        int code = con.getResponseCode();
        if (code >= 200 && code < 300) {
            try (BufferedReader br = new BufferedReader(new InputStreamReader(con.getInputStream(), StandardCharsets.UTF_8))) {
                JsonReader reader = new JsonReader(br);
                lastSuccessRequest.set(System.currentTimeMillis());
                return config.gson.fromJson(reader, outputType);
            }
        }

        String errBody = "";
        try {
            if (con.getErrorStream() != null) {
                try (BufferedReader br = new BufferedReader(new InputStreamReader(con.getErrorStream(), StandardCharsets.UTF_8))) {
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = br.readLine()) != null) sb.append(line).append('\n');
                    errBody = sb.toString();
                }
            }
        } catch (Exception ignore) {
        }

        throw new IOException(method + " " + path + " failed: HTTP " + code + (errBody.isEmpty() ? "" : ": " + errBody.trim()));
    }
}
