package str_exporter;


import com.google.gson.Gson;
import com.google.gson.stream.JsonReader;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class EBSClient {
    public EBSClient() {
    }

    public static User verifyCredentials(String code) throws IOException {
        Gson gson = new Gson();

        URL url = new URL(SlayTheRelicsExporter.getApiUrl() + "/api/v1/auth");
        HttpURLConnection con = (HttpURLConnection) url.openConnection();
        con.setRequestMethod("POST");
        con.setRequestProperty("Content-Type", "application/json");  //; utf-8
        con.setRequestProperty("Accept", "application/json");
        con.setDoOutput(true);

        OutputStream os = con.getOutputStream();
        String msg = "{\"code\":\"" + code + "\"}";
        byte[] input = msg.getBytes(StandardCharsets.UTF_8);
        os.write(input, 0, input.length);

        try (BufferedReader br = new BufferedReader(new InputStreamReader(con.getInputStream(),
                StandardCharsets.UTF_8))) {
            if (con.getResponseCode() == 200) {
                JsonReader reader = new JsonReader(br);
                return gson.fromJson(reader, User.class);
            }
            throw new IOException("Failed : HTTP error code : " + con.getResponseCode());
        }
    }
}
