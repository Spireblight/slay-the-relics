package str_exporter;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.locks.ReentrantLock;

public class BackendBroadcaster {

    public static final Logger logger = LogManager.getLogger(BackendBroadcaster.class.getName());

    public static final String DELAY_PLACEHOLDER = "&&&DELAY&&&";

    private String message;
    private String lastMessage;
    private long messageTimestamp;
    private ReentrantLock queueLock;
    private Thread worker;
    private long checkQueuePeriodMillis;
    private boolean sendDuplicates;

    public BackendBroadcaster(long checkQueuePeriodMillis, boolean sendDuplicates) {
        this.checkQueuePeriodMillis = checkQueuePeriodMillis;
        this.sendDuplicates = sendDuplicates;
        message = null;
        lastMessage = null;
        queueLock = new ReentrantLock();

        worker = new Thread(() -> {
            while (true) {
                readQueue();

                try {
                    Thread.sleep(checkQueuePeriodMillis);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        });

        worker.start();
    }

    public void queueMessage(String msg) {
        // queues only if the new message differs from the last one
        queueLock.lock();
        try {
            if (message == null || !message.equals(msg)) {
                message = msg;
                messageTimestamp = System.currentTimeMillis();
            }
        } finally {
            queueLock.unlock();
        }
    }

    private void readQueue() {
        String msg = "";
        long ts = 0;
        queueLock.lock();
        try {
            if (message != null && (sendDuplicates || !message.equals(lastMessage))) {
                lastMessage = message;
                msg = message;
                ts = messageTimestamp;
                message = null;
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            queueLock.unlock();
            if (!msg.isEmpty()) {
                long msgDelay = ts - System.currentTimeMillis() + SlayTheRelicsExporter.delay;
                msg = injectDelayToMessage(msg, msgDelay);
                broadcastMessage(msg);
            }
        }
    }

    private static String injectDelayToMessage(String msg, long delay) {
        return msg.replace(DELAY_PLACEHOLDER, Long.toString(delay));
    }

    private void broadcastMessage(String msg) {
        try (BufferedReader br = makeRequest(msg)) {
            StringBuilder response = new StringBuilder();
            String responseLine;
            while ((responseLine = br.readLine()) != null) {
                response.append(responseLine.trim());
            }
            if (!response.toString().equals("Success")) {
                logger.info("message not broadcast successfully, response: " + response);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static BufferedReader makeRequest(String msg) throws IOException {
        URL url = new URL(SlayTheRelicsExporter.getApiUrl());
        HttpURLConnection con = (HttpURLConnection) url.openConnection();
        con.setRequestMethod("POST");
        con.setRequestProperty("Content-Type", "application/json");  //; utf-8
        con.setRequestProperty("Accept", "application/json");
        con.setDoOutput(true);

        OutputStream os = con.getOutputStream();
        byte[] input = msg.getBytes(StandardCharsets.UTF_8);
        os.write(input, 0, input.length);

        return new BufferedReader(new InputStreamReader(con.getInputStream(), StandardCharsets.UTF_8));
    }
}
