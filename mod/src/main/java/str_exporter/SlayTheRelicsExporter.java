package str_exporter;

import basemod.*;
import basemod.interfaces.*;
import com.badlogic.gdx.graphics.g2d.SpriteBatch;
import com.evacipated.cardcrawl.modthespire.Loader;
import com.evacipated.cardcrawl.modthespire.ModInfo;
import com.evacipated.cardcrawl.modthespire.lib.SpireInitializer;
import com.megacrit.cardcrawl.characters.AbstractPlayer;
import com.megacrit.cardcrawl.core.AbstractCreature;
import com.megacrit.cardcrawl.helpers.ImageMaster;
import com.megacrit.cardcrawl.potions.AbstractPotion;
import com.megacrit.cardcrawl.powers.AbstractPower;
import com.megacrit.cardcrawl.relics.AbstractRelic;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import str_exporter.builders.DeckJSONBuilder;
import str_exporter.builders.JSONMessageBuilder;
import str_exporter.builders.TipsJSONBuilder;
import str_exporter.client.BackendBroadcaster;
import str_exporter.client.EBSClient;
import str_exporter.client.Message;
import str_exporter.config.AuthManager;
import str_exporter.config.Config;

import java.io.IOException;
import java.util.ArrayList;

@SpireInitializer
public class SlayTheRelicsExporter implements RelicGetSubscriber,
        PotionGetSubscriber,
        StartGameSubscriber,
        PostCreateStartingRelicsSubscriber,
        PostInitializeSubscriber,
        OnPowersModifiedSubscriber,
        PostPowerApplySubscriber,
        PostRenderSubscriber {
    public static final Logger logger = LogManager.getLogger(SlayTheRelicsExporter.class.getName());
    public static final String MODID = "SlayTheRelicsExporter";
    private static final long MAX_CHECK_PERIOD_MILLIS = 1000;
    private static final long MIN_DECK_CHECK_PERIOD_MILLIS = 1000;
    private static final long MAX_DECK_CHECK_PERIOD_MILLIS = 2000;
    private static final long BROADCAST_CHECK_QUEUE_PERIOD_MILLIS = 100;
    private static final long MAX_OKAY_BROADCAST_PERIOD_MILLIS = 1000;
    public static SlayTheRelicsExporter instance = null;
    private static String version = "";
    private static long lastOkayBroadcast = 0;
    private final Config config;
    private final EBSClient ebsClient;
    private final AuthManager authManager;
    private long lastTipsCheck = System.currentTimeMillis();
    private long lastDeckCheck = System.currentTimeMillis();
    private boolean checkTipsNextUpdate = false;
    private boolean checkDeckNextUpdate = false;
    private TipsJSONBuilder tipsJsonBuilder;
    private DeckJSONBuilder deckJsonBuilder;
    private JSONMessageBuilder okayJsonBuilder;
    private BackendBroadcaster tipsBroadcaster;
    private BackendBroadcaster deckBroadcaster;
    private BackendBroadcaster okayBroadcaster;
    private int tmpDelay = 0;

    public SlayTheRelicsExporter() {
        logger.info("Slay The Relics Exporter initialized!");
        BaseMod.subscribe(this);
        try {
            config = new Config();
            tmpDelay = config.getDelay();
            ebsClient = new EBSClient(config);
            authManager = new AuthManager(ebsClient, config);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public static String getVersion() {
        for (ModInfo info : Loader.MODINFOS) {
            if (info.ID.equals(MODID)) {
                return info.ModVersion.toString();
            }
        }

        return "unkwnown";
    }

    public static void initialize() {
        logger.info("initialize() called!");
        version = getVersion();
        instance = new SlayTheRelicsExporter();
    }

    private void queue_check() {
        checkTipsNextUpdate = true;
        checkDeckNextUpdate = true;
    }

    private void broadcastTips() {
        Message tips_json = tipsJsonBuilder.buildMessage();
        tipsBroadcaster.queueMessage(config.gson.toJson(tips_json));
    }

    private void broadcastDeck() {
        Message deck_json = deckJsonBuilder.buildMessage();
        deckBroadcaster.queueMessage(config.gson.toJson(deck_json));
    }

    @Override
    public void receivePostInitialize() {
        tipsBroadcaster = new BackendBroadcaster(config, ebsClient, BROADCAST_CHECK_QUEUE_PERIOD_MILLIS, false);
        deckBroadcaster = new BackendBroadcaster(config, ebsClient, BROADCAST_CHECK_QUEUE_PERIOD_MILLIS, false);
        okayBroadcaster = new BackendBroadcaster(config, ebsClient, BROADCAST_CHECK_QUEUE_PERIOD_MILLIS, true);
        tipsJsonBuilder = new TipsJSONBuilder(config, version);
        deckJsonBuilder = new DeckJSONBuilder(config, version);
        okayJsonBuilder = new JSONMessageBuilder(config, version, 5);

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
            authManager.updateAuth();
        });

        ModStatusImage statusImage = new ModStatusImage(950f, 480f, authManager.healthy, authManager.inProgress);

        settingsPanel.addUIElement(label1);
        settingsPanel.addUIElement(slider);
        settingsPanel.addUIElement(label2);
        settingsPanel.addUIElement(btn);
        settingsPanel.addUIElement(oauthBtn);
        settingsPanel.addUIElement(statusImage);

        slider.setValue(config.getDelay() * 1.0f / slider.multiplier);

        BaseMod.registerModBadge(ImageMaster.loadImage("SlayTheRelicsExporterResources/img/akabeko-32.png"),
                "Slay the Relics Exporter",
                "LordAddy, vmService",
                "This mod exports data to Slay the Relics Twitch extension. See the extension config on Twitch for setup instructions.",
                settingsPanel);
    }

    @Override
    public void receivePostRender(SpriteBatch spriteBatch) {
        if (checkTipsNextUpdate || System.currentTimeMillis() - lastTipsCheck > MAX_CHECK_PERIOD_MILLIS) {
            lastTipsCheck = System.currentTimeMillis();
            if (config.areCredentialsValid()) {
                broadcastTips();
            }

            checkTipsNextUpdate = false;
        }

        if ((checkDeckNextUpdate && System.currentTimeMillis() - lastDeckCheck > MIN_DECK_CHECK_PERIOD_MILLIS) ||
                System.currentTimeMillis() - lastDeckCheck > MAX_DECK_CHECK_PERIOD_MILLIS) {

            lastDeckCheck = System.currentTimeMillis();
            if (config.areCredentialsValid()) {
                broadcastDeck();
            }

            checkDeckNextUpdate = false;
        }

        if (System.currentTimeMillis() - lastOkayBroadcast > MAX_OKAY_BROADCAST_PERIOD_MILLIS) {
            Message okayMsg = okayJsonBuilder.buildJson("");
            lastOkayBroadcast = System.currentTimeMillis();
            if (config.areCredentialsValid()) {
                okayBroadcaster.queueMessage(config.gson.toJson(okayMsg));
            }
        }

        long lastSuccessRequest = ebsClient.lastSuccessRequest.get();
        if (this.authManager.inProgress.get()) {
            this.authManager.healthy.set(true);
        } else {
            this.authManager.healthy.set(System.currentTimeMillis() - lastSuccessRequest < 2000);
        }
    }

    public void relicPageChanged() {
        queue_check();
    }

    @Override
    public void receiveRelicGet(AbstractRelic abstractRelic) {
        queue_check();
    }

    @Override
    public void receivePotionGet(AbstractPotion abstractPotion) {
        queue_check();
    }

    @Override
    public void receiveStartGame() {
        queue_check();
    }

    @Override
    public void receivePostCreateStartingRelics(AbstractPlayer.PlayerClass playerClass, ArrayList<String> arrayList) {
        queue_check();
    }

    @Override
    public void receivePowersModified() {
        queue_check();
    }

    @Override
    public void receivePostPowerApplySubscriber(AbstractPower abstractPower,
                                                AbstractCreature abstractCreature,
                                                AbstractCreature abstractCreature1) {
        queue_check();
    }
}