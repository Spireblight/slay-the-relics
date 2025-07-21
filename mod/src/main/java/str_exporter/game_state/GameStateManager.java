package str_exporter.game_state;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import str_exporter.client.EBSClient;
import str_exporter.config.Config;

import java.io.IOException;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingDeque;
import java.util.concurrent.atomic.AtomicLong;

import static basemod.BaseMod.gson;

public class GameStateManager extends Thread {
    public static final Logger logger = LogManager.getLogger(GameStateManager.class.getName());

    private GameState gameState;
    private final EBSClient ebsClient;
    private final Config config;

    private final BlockingQueue<String> queue;
    private AtomicLong lastPolled = new AtomicLong(0);

    private static int INTERVAL = 1000; // Default interval in milliseconds

    public GameStateManager(EBSClient ebsClient, Config config) {
        this.ebsClient = ebsClient;
        this.config = config;
        this.queue = new LinkedBlockingDeque<>();
    }

    public void setGameState(GameState gameState) {
        this.gameState = gameState;
    }


    private void submit(String message) {
        try {
            this.queue.put(message);
        } catch (InterruptedException e) {
            logger.error("Failed to submit message to queue", e);
        }
    }

    public void postRender() {
        if (this.gameState != null) {
            long currentTime = System.currentTimeMillis();
            long lastPolled = this.lastPolled.get();
            if (currentTime - lastPolled < INTERVAL && lastPolled != 0) {
                return; // Skip if the delay has not passed
            }
            this.gameState.poll();
            this.lastPolled.set(currentTime);
            this.submit(gson.toJson(this.gameState));
        }
    }

    @Override
    public void run() {
        logger.info("Starting GameStateManager");
        while (!Thread.currentThread().isInterrupted()) {
            if (!this.config.areCredentialsValid()) {
                continue;
            }

            String msg = "";
            try {
                msg = this.queue.take();
            } catch (InterruptedException e) {
                logger.error("GameStateManager thread interrupted", e);
                return;
            }

            try {
                this.ebsClient.postGameState(msg);
            } catch (IOException e) {
                logger.error(e);
            }
        }
        logger.info("GameStateManager thread exited");
    }
}
