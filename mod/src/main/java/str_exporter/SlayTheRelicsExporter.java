package str_exporter;

import basemod.BaseMod;
import basemod.ModLabel;
import basemod.ModPanel;
import basemod.ModSlider;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;

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

    private static String login = null;
    private static String secret = null;
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
    public static String oathToken = "";

    SpireConfig config;

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
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static boolean areCredentialsValid() {
        return login != null && secret != null;
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

            login = lines.get(0).split(":")[1].toLowerCase().trim();
            secret = lines.get(1).split(":")[1].trim();
            setApiUrl(lines);

            logger.info("slaytherelics_config.txt was succesfully loaded");
        } catch (Exception e) {
            e.printStackTrace();
        }

        if (!areCredentialsValid()) {
            logger.info("slaytherelics_config.txt wasn't loaded, check if it exists.");
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


    private String getOauthToken() {
        AuthHttpServer serv = new AuthHttpServer();
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
                Thread.sleep(500);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
        }
        serv.stop();

        // TODO: verify the token is valid
        return token;
    }

    @Override
    public void receivePostInitialize() {
        tipsBroadcaster = new BackendBroadcaster(BROADCAST_CHECK_QUEUE_PERIOD_MILLIS, false);
        deckBroadcaster = new BackendBroadcaster(BROADCAST_CHECK_QUEUE_PERIOD_MILLIS, false);
        okayBroadcaster = new BackendBroadcaster(BROADCAST_CHECK_QUEUE_PERIOD_MILLIS, true);
        tipsJsonBuilder = new TipsJSONBuilder(login, secret, version);
        deckJsonBuilder = new DeckJSONBuilder(login, secret, version);
        okayJsonBuilder = new JSONMessageBuilder(login, secret, version, 5);

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

        ModLabelButton oauthBtn = new ModLabelButton("Connect with Twitch", 800f, 480f, settingsPanel, (me) -> {
            oathToken = getOauthToken();
            config.setString(OAUTH_SETTINGS, oathToken);
            try {
                config.save();
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        });

        settingsPanel.addUIElement(label1);
        settingsPanel.addUIElement(slider);
        settingsPanel.addUIElement(label2);
        settingsPanel.addUIElement(btn);
        settingsPanel.addUIElement(oauthBtn);

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
            okayBroadcaster.queueMessage(okayMsg);
//            logger.info(okayMsg);

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