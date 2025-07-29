package str_exporter.config;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import str_exporter.client.EBSClient;
import str_exporter.client.User;

import java.awt.*;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.concurrent.atomic.AtomicBoolean;

public class AuthManager {
    public static final Logger logger = LogManager.getLogger(AuthManager.class.getName());
    private static final SecureRandom secureRandom = new SecureRandom();
    private static final Base64.Encoder base64Encoder = Base64.getUrlEncoder();
    public final AtomicBoolean healthy = new AtomicBoolean(false);
    public final AtomicBoolean inProgress = new AtomicBoolean(false);
    private final EBSClient ebsClient;
    private final Config config;

    public AuthManager(EBSClient ebsClient, Config config) {
        this.ebsClient = ebsClient;
        this.config = config;
    }

    private static String generateNewToken() {
        byte[] randomBytes = new byte[24];
        secureRandom.nextBytes(randomBytes);
        return base64Encoder.encodeToString(randomBytes);
    }

    public void updateAuth(Runnable callback) {
        Thread worker = new Thread(() -> {
            if (this.inProgress.get()) {
                return;
            }
            this.inProgress.set(true);
            try {
                String state = generateNewToken();
                User user = verifyUser(state);
                config.setUser(user.user);
                config.setOathToken(user.token);
                callback.run();
            } catch (IOException | URISyntaxException | InterruptedException e) {
                logger.error(e);
            } finally {
                this.inProgress.set(false);
            }
        });
        worker.start();
    }

    private User verifyUser(String state) throws IOException, URISyntaxException, InterruptedException {
        AuthHttpServer serv = new AuthHttpServer(state);
        serv.start();

        logger.info("Desktop.isDesktopSupported(): " + Desktop.isDesktopSupported());
        logger.info("Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)): " +
                Desktop.getDesktop().isSupported(Desktop.Action.BROWSE));

        Desktop.getDesktop().browse(new URI("http://localhost:49000"));
//        if (Desktop.isDesktopSupported() && Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
//            Desktop.getDesktop().browse(new URI("http://localhost:49000"));
//        }

        String token = "";
        while (token.isEmpty()) {
            token = serv.getToken();
            Thread.sleep(50);
        }
        serv.stop();
        return ebsClient.verifyCredentials(token);
    }
}
