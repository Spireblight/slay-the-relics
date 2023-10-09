package str_exporter.config;

import com.evacipated.cardcrawl.modthespire.lib.SpireConfig;
import com.google.gson.Gson;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.Properties;

public class Config {
    private static final String API_URL_SETTINGS = "api_url";
    private static final String DELAY_SETTINGS = "delay";
    private static final String OAUTH_SETTINGS = "oauth";
    private static final String USER_SETTINGS = "user";
    public final Gson gson = new Gson();
    private final SpireConfig config;

    public Config() throws IOException {
        Properties strDefaultSettings = new Properties();
        strDefaultSettings.setProperty(DELAY_SETTINGS, "150");
        strDefaultSettings.setProperty(API_URL_SETTINGS, "https://str.otonokizaka.moe");

        config = new SpireConfig("slayTheRelics", "slayTheRelicsExporterConfig", strDefaultSettings);
        config.load();
    }

    public int getDelay() {
        return config.getInt(DELAY_SETTINGS);
    }

    public void setDelay(int delay) throws IOException {
        config.setInt(DELAY_SETTINGS, delay);
        config.save();
    }

    public URL getApiUrl() throws MalformedURLException {
        return new URL(config.getString(API_URL_SETTINGS));
    }

    public String getOathToken() {
        return config.getString(OAUTH_SETTINGS);
    }

    public void setOathToken(String oathToken) throws IOException {
        config.setString(OAUTH_SETTINGS, oathToken);
        config.save();
    }

    public String getUser() {
        return config.getString(USER_SETTINGS);
    }

    public void setUser(String user) throws IOException {
        config.setString(USER_SETTINGS, user);
        config.save();
    }

    public boolean areCredentialsValid() {
        String token = getOathToken();
        String user = getUser();
        return token != null && user != null && !token.isEmpty() && !user.isEmpty();
    }
}
