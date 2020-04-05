package str_exporter;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.locks.ReentrantLock;

public class BackendBroadcaster {

    public static final Logger logger = LogManager.getLogger(BackendBroadcaster.class.getName());

//    private static final String EBS_URL = "https://localhost:8081";
    private static final String EBS_URL = "https://slaytherelics.xyz:8081";

    private static final long CHECK_QUEUE_PERIOD_MILLIS = 100;
    private static BackendBroadcaster instance = new BackendBroadcaster();

    private String message;
    private long messageTimestamp;
    private ReentrantLock queueLock;
    private Thread worker;

    private BackendBroadcaster() {
        message = null;
        queueLock = new ReentrantLock();

        worker = new Thread(() -> {
            while (true) {
                readQueue();

                try {
                    Thread.sleep(CHECK_QUEUE_PERIOD_MILLIS);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        });
    }

    public static void start() {
        instance.worker.start();
    }

    public static void queueMessage(String msg) {
        instance.queueLock.lock();
        try {
            if (instance.message == null || !instance.message.equals(msg)) {
                instance.message = msg;
                instance.messageTimestamp = System.currentTimeMillis();
            }
        } finally {
            instance.queueLock.unlock();
        }
    }

    private void readQueue() {
        String msg = "";
        long ts = 0;
        queueLock.lock();
        try {
            if (message != null) {
                msg = message;
                ts = messageTimestamp;
                message = null;
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            queueLock.unlock();
            if (!msg.isEmpty()) {
                broadcastMessage(msg, ts);

                try {
                    Thread.sleep(950);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }
    }

    private static String injectDelayToMessage(String msg, long delay) {
        return "{\"d\":" + delay + "," + msg.substring(1);
    }

    private static String compressPowerTips(String msg) {
        int index = msg.lastIndexOf("\"w\":\"");

        String comp_powertips = StringCompression.compress(msg.substring(index + 5, msg.length() - 3));
        return msg.substring(0, index + 5) + comp_powertips + "\"}}";
    }

    private void broadcastMessage(String msg, long msgTimestamp) {

        try {
            URL url = new URL(EBS_URL);
            HttpURLConnection con = (HttpURLConnection) url.openConnection();
            con.setRequestMethod("POST");
            con.setRequestProperty("Content-Type", "application/json");  //; utf-8
            con.setRequestProperty("Accept", "application/json");
            con.setDoOutput(true);

            msg = compressPowerTips(msg);
            long msgDelay = msgTimestamp - System.currentTimeMillis() + SlayTheRelicsExporter.delay;
            msg = injectDelayToMessage(msg, msgDelay);

            OutputStream os = con.getOutputStream();
            byte[] input = msg.getBytes(StandardCharsets.UTF_8);
            os.write(input, 0, input.length);

            BufferedReader br = new BufferedReader(new InputStreamReader(con.getInputStream(), StandardCharsets.UTF_8));
            StringBuilder response = new StringBuilder();
            String responseLine;
            while ((responseLine = br.readLine()) != null) {
                response.append(responseLine.trim());
            }

            if (!response.toString().equals("Success"))
                logger.info("message not broadcasted succesfully, response: " + response.toString());
//            logger.info("broadcasted message, response: " + response.toString());

        } catch (Exception e) {
            e.printStackTrace();
        } finally {
//            logger.info(SlayTheRelicsExporter.removeSecret(msg));
        }
    }
}
