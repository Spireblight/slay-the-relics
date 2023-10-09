package str_exporter.client;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import str_exporter.config.Config;

import java.io.IOException;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.locks.ReentrantLock;

public class BackendBroadcaster {

    public static final Logger logger = LogManager.getLogger(BackendBroadcaster.class.getName());

    public static final String DELAY_PLACEHOLDER = "&&&DELAY&&&";
    public AtomicLong lastSuccessBroadcast = new AtomicLong(0);
    private String message;
    private String lastMessage;
    private long messageTimestamp;
    private final ReentrantLock queueLock;
    private final Thread worker;
    private final boolean sendDuplicates;
    private final Config config;
    private final EBSClient client;

    public BackendBroadcaster(Config config, EBSClient client, long checkQueuePeriodMillis, boolean sendDuplicates) {
        this.sendDuplicates = sendDuplicates;
        this.config = config;
        this.client = client;
        message = null;
        lastMessage = null;
        queueLock = new ReentrantLock();

        worker = new Thread(() -> {
            while (true) {
                readQueue();

                try {
                    Thread.sleep(checkQueuePeriodMillis);
                } catch (InterruptedException e) {
                    logger.error(e);
                }
            }
        });

        worker.start();
    }

    private static String injectDelayToMessage(String msg, long delay) {
        return msg.replace(DELAY_PLACEHOLDER, Long.toString(delay));
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
            logger.error(e);
        } finally {
            queueLock.unlock();
            if (!msg.isEmpty()) {
                long msgDelay = ts - System.currentTimeMillis() + config.getDelay();
                msg = injectDelayToMessage(msg, msgDelay);
                try {
                    broadcastMessage(msg);
                } catch (Exception e) {
                    logger.error(e);
                }
            }
        }
    }

    private void broadcastMessage(String msg) throws IOException {
        this.client.broadcastMessage(msg);
    }
}
