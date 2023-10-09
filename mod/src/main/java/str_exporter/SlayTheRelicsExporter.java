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
import str_exporter.client.User;
import str_exporter.config.AuthHttpServer;
import str_exporter.config.Config;

import java.awt.*;
import java.io.IOException;
import java.net.URI;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Base64;
import java.util.concurrent.atomic.AtomicBoolean;

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
    private static final SecureRandom secureRandom = new SecureRandom();
    private static final Base64.Encoder base64Encoder = Base64.getUrlEncoder();
    public static SlayTheRelicsExporter instance = null;
    private static String version = "";
    private static long lastOkayBroadcast = 0;
    private final AtomicBoolean healthy = new AtomicBoolean(false);
    private final AtomicBoolean inProgress = new AtomicBoolean(false);
    Config config;
    EBSClient ebsClient;
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

    private static String generateNewToken() {
        byte[] randomBytes = new byte[24];
        secureRandom.nextBytes(randomBytes);
        return base64Encoder.encodeToString(randomBytes);
    }

    private void queue_check() {
        checkTipsNextUpdate = true;
        checkDeckNextUpdate = true;
    }

    private void broadcastTips() {
        String tips_json = tipsJsonBuilder.buildJson();
        tipsBroadcaster.queueMessage(tips_json);
    }

    private void broadcastDeck() {
        String deck_json = deckJsonBuilder.buildJson();
        deckBroadcaster.queueMessage(deck_json);
    }

    private User getOauthToken(String state) {
        AuthHttpServer serv = new AuthHttpServer(state);
        try {
            serv.start();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        if (Desktop.isDesktopSupported() && Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
            try {
                Desktop.getDesktop().browse(new URI("http://localhost:49000"));
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }

        String token = "";
        while (token.isEmpty()) {
            token = serv.getToken();
            try {
                Thread.sleep(50);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
        }
        serv.stop();

        try {
            return ebsClient.verifyCredentials(token);
        } catch (IOException e) {
            logger.error(e);
            return null;
        }
    }

    @Override
    public void receivePostInitialize() {
        tipsBroadcaster = new BackendBroadcaster(config, ebsClient, BROADCAST_CHECK_QUEUE_PERIOD_MILLIS, false);
        deckBroadcaster = new BackendBroadcaster(config, ebsClient, BROADCAST_CHECK_QUEUE_PERIOD_MILLIS, false);
        okayBroadcaster = new BackendBroadcaster(config, ebsClient, BROADCAST_CHECK_QUEUE_PERIOD_MILLIS, true);
        tipsJsonBuilder = new TipsJSONBuilder(config.getUser(), config.getOathToken(), version);
        deckJsonBuilder = new DeckJSONBuilder(config.getUser(), config.getOathToken(), version);
        okayJsonBuilder = new JSONMessageBuilder(config.getUser(), config.getOathToken(), version, 5);

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
            Thread worker = new Thread(() -> {
                if (this.inProgress.get()) {
                    return;
                }

                this.inProgress.set(true);
                try {
                    String state = generateNewToken();
                    User user = getOauthToken(state);
                    if (user == null) {
                        return;
                    }
                    try {
                        config.setUser(user.user);
                        config.setOathToken(user.token);
                    } catch (IOException e) {
                        throw new RuntimeException(e);
                    }
                    tipsJsonBuilder.setSecret(user.token);
                    tipsJsonBuilder.setLogin(user.user);
                    deckJsonBuilder.setSecret(user.token);
                    deckJsonBuilder.setLogin(user.user);
                    okayJsonBuilder.setSecret(user.token);
                    okayJsonBuilder.setLogin(user.user);
                } finally {
                    this.inProgress.set(false);
                }
            });
            worker.start();
        });

        ModStatusImage statusImage = new ModStatusImage(950f, 480f, healthy, inProgress);

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
            String okayMsg = okayJsonBuilder.buildJson();
            lastOkayBroadcast = System.currentTimeMillis();
            if (config.areCredentialsValid()) {
                okayBroadcaster.queueMessage(okayMsg);
            }
        }

        long lastSuccessAuth = EBSClient.lastSuccessRequest.get();
        long lastSuccessBroadcast = okayBroadcaster.lastSuccessBroadcast.get();
        long lastSuccess = Math.max(lastSuccessAuth, lastSuccessBroadcast);
        if (this.inProgress.get()) {
            this.healthy.set(true);
        } else {
            this.healthy.set(System.currentTimeMillis() - lastSuccess < 2000);
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