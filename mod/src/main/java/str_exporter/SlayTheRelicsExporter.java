package str_exporter;

import basemod.*;
import basemod.interfaces.PostInitializeSubscriber;
import basemod.interfaces.PostRenderSubscriber;
import basemod.interfaces.StartGameSubscriber;
import com.badlogic.gdx.graphics.g2d.SpriteBatch;
import com.evacipated.cardcrawl.modthespire.lib.SpireInitializer;
import com.megacrit.cardcrawl.helpers.ImageMaster;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import str_exporter.client.EBSClient;
import str_exporter.config.AuthManager;
import str_exporter.config.Config;
import str_exporter.game_state.GameState;
import str_exporter.game_state.GameStateManager;
import str_exporter.game_state.integrations.Integrations;

import java.io.IOException;

@SpireInitializer
public class SlayTheRelicsExporter implements StartGameSubscriber, PostInitializeSubscriber,
        PostRenderSubscriber {
    public static final Logger logger = LogManager.getLogger(SlayTheRelicsExporter.class.getName());
    public static SlayTheRelicsExporter instance = null;
    private final Config config;
    private final EBSClient ebsClient;
    private final AuthManager authManager;
    private int tmpDelay = 0;
    private GameState gameState;
    private final GameStateManager gameStateManager;
    private Integrations integrations;


    public SlayTheRelicsExporter() {
        logger.info("Slay The Relics Exporter initialized!");
        BaseMod.subscribe(this);
        try {
            config = new Config();
            tmpDelay = config.getDelay();
            ebsClient = new EBSClient(config);
            authManager = new AuthManager(ebsClient, config);
            gameStateManager = new GameStateManager(ebsClient, config);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public static void initialize() {
        logger.info("initialize() called!");
        instance = new SlayTheRelicsExporter();
        instance.makeNewGameState();
    }

    public void makeNewGameState() {
        String user = this.config.getUser();
        logger.info("makeNewGameState() called with user: {}", user);
        this.gameState = new GameState(user);
        this.gameStateManager.setGameState(this.gameState);
    }


    @Override
    public void receivePostInitialize() {
        ModPanel settingsPanel = new ModPanel();

        ModLabel
                label1 =
                new ModLabel("Use the slider below to set encoding delay of your PC.",
                        400.0f,
                        700.0f,
                        settingsPanel,
                        (me) -> {
                        });
        ModLabel
                label2 =
                new ModLabel("With this set to 0, the extension will be ahead of what the stream displays.",
                        400.0f,
                        650.0f,
                        settingsPanel,
                        (me) -> {
                        });
        ModSlider slider = new ModSlider("Delay", 500f, 600, 10000f, "ms", settingsPanel, (me) -> {
            tmpDelay = (int) (me.value * me.multiplier);
        });

        ModLabeledButton btn = new ModLabeledButton("Save", 400f, 480f, settingsPanel, (me) -> {
            try {
                config.setDelay(tmpDelay);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        });

        ModLabeledButton oauthBtn = new ModLabeledButton("Connect with Twitch", 575f, 480f, settingsPanel, (me) -> {
            authManager.updateAuth(this::makeNewGameState);
        });

        ModStatusImage statusImage = new ModStatusImage(950f, 480f, authManager.healthy, authManager.inProgress);

        settingsPanel.addUIElement(label1);
        settingsPanel.addUIElement(slider);
        settingsPanel.addUIElement(label2);
        settingsPanel.addUIElement(btn);
        settingsPanel.addUIElement(oauthBtn);
        settingsPanel.addUIElement(statusImage);

        slider.setValue(config.getDelay() * 1.0f / slider.multiplier);

        BaseMod.registerModBadge(ImageMaster.loadImage("SlayTheRelicsExporterResources/img/str_32x32.png"),
                "Slay the Relics Exporter",
                "vmService",
                "This mod exports data to Slay the Relics Twitch extension. See the extension config on Twitch for setup instructions.",
                settingsPanel);

        this.integrations = new Integrations();
        this.gameStateManager.start();
    }

    @Override
    public void receivePostRender(SpriteBatch spriteBatch) {
        long lastSuccessRequest = ebsClient.lastSuccessRequest.get();
        if (this.authManager.inProgress.get()) {
            this.authManager.healthy.set(true);
        } else {
            this.authManager.healthy.set(System.currentTimeMillis() - lastSuccessRequest < 2000);
        }
        this.gameStateManager.postRender();
    }

    @Override
    public void receiveStartGame() {
        this.gameState.resetState();
    }
}
