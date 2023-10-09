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

    private <T> T doRequest(String method, String path, String body, Type outputType) throws IOException {
        URL url = new URL(config.getApiUrl() + path);
        HttpURLConnection con = (HttpURLConnection) url.openConnection();
        con.setRequestMethod(method);
        con.setRequestProperty("Content-Type", "application/json");
        con.setRequestProperty("Accept", "application/json");
        con.setDoOutput(true);

        OutputStream os = con.getOutputStream();
        if (body != null && !body.isEmpty()) {
            byte[] input = body.getBytes(StandardCharsets.UTF_8);
            os.write(input, 0, input.length);
        }

        try (BufferedReader br = new BufferedReader(new InputStreamReader(con.getInputStream(),
                StandardCharsets.UTF_8))) {
            if (con.getResponseCode() >= 200 && con.getResponseCode() < 300) {
                JsonReader reader = new JsonReader(br);
                lastSuccessRequest.set(System.currentTimeMillis());
                return config.gson.fromJson(reader, outputType);
            }
            throw new IOException(method + " " + path + " failed: HTTP error code: " + con.getResponseCode());
        }
    }
}
