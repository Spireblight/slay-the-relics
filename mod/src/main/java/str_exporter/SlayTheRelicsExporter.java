package str_exporter;

import basemod.*;
import basemod.interfaces.*;
import com.badlogic.gdx.graphics.g2d.SpriteBatch;
import com.evacipated.cardcrawl.modthespire.Loader;
import com.evacipated.cardcrawl.modthespire.ModInfo;
import com.evacipated.cardcrawl.modthespire.lib.SpireConfig;
import com.evacipated.cardcrawl.modthespire.lib.SpireInitializer;
import com.megacrit.cardcrawl.characters.AbstractPlayer;
import com.megacrit.cardcrawl.core.AbstractCreature;
import com.megacrit.cardcrawl.helpers.ImageMaster;
import com.megacrit.cardcrawl.potions.AbstractPotion;
import com.megacrit.cardcrawl.powers.AbstractPower;
import com.megacrit.cardcrawl.relics.AbstractRelic;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.awt.*;
import java.io.IOException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Properties;
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

    private static String version = "";

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

    private static final long MAX_CHECK_PERIOD_MILLIS = 1000;
    private static final long MIN_DECK_CHECK_PERIOD_MILLIS = 1000;
    private static final long MAX_DECK_CHECK_PERIOD_MILLIS = 2000;
    private static final long BROADCAST_CHECK_QUEUE_PERIOD_MILLIS = 100;
    private static final long MAX_OKAY_BROADCAST_PERIOD_MILLIS = 1000;

    public static SlayTheRelicsExporter instance = null;

    public static Properties strDefaultSettings = new Properties();
    public static final String DELAY_SETTINGS = "delay";
    public static long delay = 0; // The boolean we'll be setting on/off (true/false)
    private static String apiUrl = "";
    private static long lastOkayBroadcast = 0;
    private static final String OAUTH_SETTINGS = "oauth";
    private static final String USER_SETTINGS = "user";

    public static String oathToken = "";
    public static String user = "";

    SpireConfig config;
    private static final SecureRandom secureRandom = new SecureRandom();
    private static final Base64.Encoder base64Encoder = Base64.getUrlEncoder();

    private AtomicBoolean healthy = new AtomicBoolean(false);
    private AtomicBoolean inProgress = new AtomicBoolean(false);


    public SlayTheRelicsExporter() {
        logger.info("Slay The Relics Exporter initialized!");
        BaseMod.subscribe(this);

        strDefaultSettings.setProperty(DELAY_SETTINGS, "150");
        try {
            config =
                    new SpireConfig("slayTheRelics",
                            "slayTheRelicsExporterConfig",
                            strDefaultSettings); // ...right here
            config.load();
            delay = config.getInt(DELAY_SETTINGS);
            oathToken = config.getString(OAUTH_SETTINGS);
            user = config.getString(USER_SETTINGS);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static boolean areCredentialsValid() {
        return user != null && !user.isEmpty() && oathToken != null && !oathToken.isEmpty();
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
        try {
            Path path = Paths.get("slaytherelics_config.txt");
            if (!Files.exists(path)) path = Paths.get("slaytherelics_config.txt.txt");

            String data = new String(Files.readAllBytes(path));
            List<String> lines = Files.readAllLines(path);

            setApiUrl(lines);

            logger.info("slaytherelics_config.txt was succesfully loaded");
        } catch (Exception e) {
            e.printStackTrace();
        }


        instance = new SlayTheRelicsExporter();
    }

    private static void setApiUrl(List<String> lines) {
        SlayTheRelicsExporter.apiUrl = "https://str.otonokizaka.moe";
        for (String line : lines) {
            if (line.startsWith("api_url:")) {
                SlayTheRelicsExporter.apiUrl = line.replaceFirst("api_url:", "").trim();
                break;
            }
        }
    }

    public static String getApiUrl() {
        return apiUrl;
    }

    private void queue_check() {
        checkTipsNextUpdate = true;
        checkDeckNextUpdate = true;
    }

    private void broadcastTips() {
        long start = System.nanoTime();
        String tips_json = tipsJsonBuilder.buildJson();
        long end = System.nanoTime();
//        logger.info("tips json builder took " + (end - start) / 1e6 + " milliseconds");
//        logger.info(tips_json);
        tipsBroadcaster.queueMessage(tips_json);
    }

    private void broadcastDeck() {
        long start = System.nanoTime();
        String deck_json = deckJsonBuilder.buildJson();
        long end = System.nanoTime();
//        logger.info("deck json builder took " + (end - start) / 1e6 + " milliseconds");
//        logger.info(deck_json);
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
            return EBSClient.verifyCredentials(token);
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
    }

    private static String generateNewToken() {
        byte[] randomBytes = new byte[24];
        secureRandom.nextBytes(randomBytes);
        return base64Encoder.encodeToString(randomBytes);
    }

    @Override
    public void receivePostInitialize() {
        tipsBroadcaster = new BackendBroadcaster(BROADCAST_CHECK_QUEUE_PERIOD_MILLIS, false);
        deckBroadcaster = new BackendBroadcaster(BROADCAST_CHECK_QUEUE_PERIOD_MILLIS, false);
        okayBroadcaster = new BackendBroadcaster(BROADCAST_CHECK_QUEUE_PERIOD_MILLIS, true);
        tipsJsonBuilder = new TipsJSONBuilder(user, oathToken, version);
        deckJsonBuilder = new DeckJSONBuilder(user, oathToken, version);
        okayJsonBuilder = new JSONMessageBuilder(user, oathToken, version, 5);

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
            logger.info("slider value: " + me.value);
            delay = (long) (me.value * me.multiplier);
        });

        ModLabelButton btn = new ModLabelButton("Save", 400f, 480f, settingsPanel, (me) -> {
            try {
                config.setInt(DELAY_SETTINGS, (int) delay);
                config.save();
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
                    oathToken = user.token;
                    SlayTheRelicsExporter.user = user.user;
                    config.setString(OAUTH_SETTINGS, oathToken);
                    config.setString(USER_SETTINGS, user.user);
                    tipsJsonBuilder.setSecret(oathToken);
                    tipsJsonBuilder.setLogin(user.user);
                    deckJsonBuilder.setSecret(oathToken);
                    deckJsonBuilder.setLogin(user.user);
                    okayJsonBuilder.setSecret(oathToken);
                    okayJsonBuilder.setLogin(user.user);
                    try {
                        config.save();
                    } catch (IOException e) {
                        throw new RuntimeException(e);
                    }
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

        slider.setValue(delay * 1.0f / slider.multiplier);

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
            if (areCredentialsValid()) {
                broadcastTips();
            }

            checkTipsNextUpdate = false;
        }

        if ((checkDeckNextUpdate && System.currentTimeMillis() - lastDeckCheck > MIN_DECK_CHECK_PERIOD_MILLIS) ||
                System.currentTimeMillis() - lastDeckCheck > MAX_DECK_CHECK_PERIOD_MILLIS) {

            lastDeckCheck = System.currentTimeMillis();
            if (areCredentialsValid()) {
                broadcastDeck();
            }

            checkDeckNextUpdate = false;
        }

        if (System.currentTimeMillis() - lastOkayBroadcast > MAX_OKAY_BROADCAST_PERIOD_MILLIS) {
            String okayMsg = okayJsonBuilder.buildJson();
            lastOkayBroadcast = System.currentTimeMillis();
            if (areCredentialsValid()) {
                okayBroadcaster.queueMessage(okayMsg);
            }
        }

        long lastSuccessAuth = EBSClient.lastSuccessAuth.get();
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

    public static String removeSecret(String str) {
        String pattern = "\"secret\": \"[a-z0-9]*\"";
        return str.replaceAll(pattern, "\"secret\": \"********************\"");
    }
}