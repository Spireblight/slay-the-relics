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

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Properties;

@SpireInitializer
public class SlayTheRelicsExporter implements
        RelicGetSubscriber,
        PotionGetSubscriber,
        StartGameSubscriber,
        PostCreateStartingRelicsSubscriber,
        PostInitializeSubscriber,
        OnPowersModifiedSubscriber,
        PostPowerApplySubscriber,
        PostRenderSubscriber
{

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


//    private static final long MAX_BROADCAST_PERIOD_MILLIS = 250;
    private static final long MAX_CHECK_PERIOD_MILLIS = 1000;
    private static final long MIN_DECK_CHECK_PERIOD_MILLIS = 1000;
    private static final long MAX_DECK_CHECK_PERIOD_MILLIS = 2000;
    private static final long BROADCAST_CHECK_QUEUE_PERIOD_MILLIS = 100;
    private static final long MAX_OKAY_BROADCAST_PERIOD_MILLIS = 1000;

    public static SlayTheRelicsExporter instance = null;

    public static Properties strDefaultSettings = new Properties();
    public static final String DELAY_SETTINGS = "delay";
    public static long delay = 0; // The boolean we'll be setting on/off (true/false)
    private static long lastOkayBroadcast = 0;

    public SlayTheRelicsExporter()
    {
        logger.info("Slay The Relics Exporter initialized!");
        BaseMod.subscribe(this);

        strDefaultSettings.setProperty(DELAY_SETTINGS, "150");
        try {
            SpireConfig config = new SpireConfig("slayTheRelics", "slayTheRelicsExporterConfig", strDefaultSettings); // ...right here
            config.load();
            delay = config.getInt(DELAY_SETTINGS);
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

    public static void initialize()
    {
        logger.info("initialize() called!");
        version = getVersion();
        try {

            Path path = Paths.get("slaytherelics_config.txt");
            if (!Files.exists(path))
                path = Paths.get("slaytherelics_config.txt.txt");

            String data = new String(Files.readAllBytes(path));

            String[] lines = data.split("\r\n");

            login = lines[0].split(":")[1];
            secret = lines[1].split(":")[1];

            logger.info("slaytherelics_config.txt was succesfully loaded");

//            logger.info("loaded login " + login + " and secret " + secret);
        } catch (Exception e) {
            e.printStackTrace();
        }

        if (!areCredentialsValid()) {
            logger.info("slaytherelics_config.txt wasn't loaded, check if it exists.");
        }

        instance = new SlayTheRelicsExporter();
    }

    private void queue_check() {
        checkTipsNextUpdate = true;
        checkDeckNextUpdate = true;
    }


    private void broadcastTips() {
        long start = System.nanoTime();
        String tips_json = tipsJsonBuilder.buildJson();
        long end = System.nanoTime();
        logger.info("tips json builder took " + (end - start) / 1e6 + " milliseconds");
//        logger.info(tips_json);
        tipsBroadcaster.queueMessage(tips_json);
    }

    private void broadcastDeck() {
        long start = System.nanoTime();
        String deck_json = deckJsonBuilder.buildJson();
        long end = System.nanoTime();
        logger.info("deck json builder took " + (end - start) / 1e6 + " milliseconds");
//        logger.info(deck_json);
        deckBroadcaster.queueMessage(deck_json);
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

        ModLabel label1 = new ModLabel("Use the slider below to set encoding delay of your PC.", 400.0f, 700.0f, settingsPanel, (me) -> {});
        ModLabel label2 = new ModLabel("With this set to 0, the extension will be ahead of what the stream displays.", 400.0f, 650.0f, settingsPanel, (me) -> {});
        ModSlider slider = new ModSlider("Delay", 500f, 600, 10000f, "ms", settingsPanel, (me) -> {
            logger.info("slider value: " + me.value);
            delay = (long) (me.value * me.multiplier);
        });
        ModLabelButton btn = new ModLabelButton("Save", 400f, 480f, settingsPanel, (me) -> {
            try {
                SpireConfig config = new SpireConfig("slayTheRelics", "slayTheRelicsExporterConfig", strDefaultSettings);
                config.setInt(DELAY_SETTINGS, (int) delay);
                config.save();
            } catch (IOException e) {
                e.printStackTrace();
            }
        });

        settingsPanel.addUIElement(label1);
        settingsPanel.addUIElement(slider);
        settingsPanel.addUIElement(label2);
        settingsPanel.addUIElement(btn);

        slider.setValue(delay * 1.0f / slider.multiplier);

        BaseMod.registerModBadge(ImageMaster.loadImage(
                "SlayTheRelicsExporterResources/img/ink_bottle.png"),
                "Slay the Relics Exporter",
                "LordAddy",
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
    public void receivePostPowerApplySubscriber(AbstractPower abstractPower, AbstractCreature abstractCreature, AbstractCreature abstractCreature1) {
        queue_check();
    }

    public static String removeSecret(String str) {
        String pattern = "\"secret\": \"[a-z0-9]*\"";
        return str.replaceAll(pattern, "\"secret\": \"********************\"");
    }
}