package str_exporter.game_state;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import str_exporter.client.EBSClient;
import str_exporter.config.Config;

import java.io.IOException;

import static basemod.BaseMod.gson;

public class GameStateManager extends Thread {
    public static final Logger logger = LogManager.getLogger(GameStateManager.class.getName());

    private GameState gameState;
    private final EBSClient ebsClient;
    private final Config config;

    private boolean done = false;

    public GameStateManager(EBSClient ebsClient, Config config) {
        this.ebsClient = ebsClient;
        this.config = config;
    }

    public void setGameState(GameState gameState) {
        this.gameState = gameState;
    }

    public void setDone() {
        this.done = true;
    }

    @Override
    public void run() {
        logger.info("Starting GameStateManager");
        while (!done) {
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }

            if (this.gameState == null) {
                continue;
            }
            if (!this.config.areCredentialsValid()) {
                continue;
            }

            try {
                this.gameState.poll();
            } catch (Exception e) {
                logger.error("Failed to poll game state", e);
                continue;
            }

            try {
                this.ebsClient.postGameState(gson.toJson(this.gameState));
            } catch (IOException e) {
                logger.error(e);
            }
        }
        logger.info("GameStateManager thread exited");
    }
}
