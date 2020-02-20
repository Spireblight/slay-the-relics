package str_exporter;

import basemod.BaseMod;
import basemod.ModPanel;
import basemod.interfaces.*;
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

import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;

@SpireInitializer
public class SlayTheRelicsExporter implements
        RelicGetSubscriber,
        PotionGetSubscriber,
        StartGameSubscriber,
        PostCreateStartingRelicsSubscriber,
        PostInitializeSubscriber,
        PostUpdateSubscriber,
        OnPowersModifiedSubscriber,
        PostPowerApplySubscriber
{

    public static final Logger logger = LogManager.getLogger(SlayTheRelicsExporter.class.getName());
    public static final String MODID = "SlayTheRelicsExporter";

    private static String login = null;
    private static String secret = null;
    private static String version = "";

    private long lastBroadcast = System.currentTimeMillis();
    private long lastCheck = System.currentTimeMillis();
    private String lastBroadcastJson = "";
    private boolean checkNextUpdate = false;
    private JSONMessageBuilder json_builder;

//    private static final long MAX_BROADCAST_PERIOD_MILLIS = 250;
    private static final long MAX_CHECK_PERIOD_MILLIS = 250;
    public static SlayTheRelicsExporter instance = null;

    public SlayTheRelicsExporter()
    {
        json_builder = new JSONMessageBuilder(login, secret, version);
        BackendBroadcaster.start();

        logger.info("Slay The Relics Exporter initialized!");
        BaseMod.subscribe(this);
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

            String data = new String(Files.readAllBytes(Paths.get("slaytherelics_config.txt")));

            String[] lines = data.split("\r\n");

            login = lines[0].split(":")[1];
            secret = lines[1].split(":")[1];

            logger.info("loaded login " + login + " and secret " + secret);
        } catch (Exception e) {
            e.printStackTrace();
        }

        if (!areCredentialsValid()) {
            logger.info("slaytherelics_config.txt wasn't loaded, check if it exists.");
        }

        instance = new SlayTheRelicsExporter();
    }

    private void queue_check() {
        checkNextUpdate = true;
    }

    private void check() {
        if (areCredentialsValid()) {
            broadcast();
        } else {
            logger.info("Either your secret or your login are null. The config file has probably not loaded properly");
        }
    }

    private void broadcast() {

        long start = System.nanoTime();
        String json = json_builder.buildJson();
        long end = System.nanoTime();

        long start_equals = System.nanoTime();
//        if (System.currentTimeMillis() - lastBroadcast > MAX_BROADCAST_PERIOD_MILLIS || !json.equals(lastBroadcastJson)) {
        long end_equals = System.nanoTime();
        lastBroadcast = System.currentTimeMillis();
        lastBroadcastJson = json;

        long start_broadcast = System.nanoTime();
        BackendBroadcaster.queueMessage(json);
        long end_broadcast = System.nanoTime();
//        logger.info("broadcasting relics");
        logger.info("json builder took " + (end - start) / 1e6 + " milliseconds");
        logger.info("json string comparison took " + (end_equals - start_equals) / 1e6 + " milliseconds");
        logger.info("adding to broadcast queue took " + (end_broadcast - start_broadcast) / 1e6 + " milliseconds");
        logger.info(removeSecret(json));
//        } else {
////            logger.info("Aborting rapidly repeated broadcast");
//        }
    }

    @Override
    public void receivePostInitialize() {
        ModPanel settingsPanel = new ModPanel();

        BaseMod.registerModBadge(ImageMaster.loadImage(
                "SlayTheRelicsExporterResources/img/ink_bottle.png"),
                "Slay the Relics Exporter",
                "LordAddy",
                "This mod exports data to Slay the Relics Twitch extension. See the extension config on Twitch for setup instructions.",
                settingsPanel);
    }

    @Override
    public void receivePostUpdate() { //System.currentTimeMillis() - lastBroadcast > MAX_BROADCAST_PERIOD_MILLIS
        if (checkNextUpdate || System.currentTimeMillis() - lastCheck > MAX_CHECK_PERIOD_MILLIS) {

            lastCheck = System.currentTimeMillis();
            check();

            checkNextUpdate = false;
        }
    }

    public void relicPageChanged() {
        logger.info("Relic Page Changed");
        queue_check();
    }

    @Override
    public void receiveRelicGet(AbstractRelic abstractRelic) {
        logger.info("Relic Acquired");
        queue_check();
    }

    @Override
    public void receivePotionGet(AbstractPotion abstractPotion) {
        logger.info("Potion Acquired");
        queue_check();
    }

    @Override
    public void receiveStartGame() {
        logger.info("StartGame received");
        queue_check();
    }

    @Override
    public void receivePostCreateStartingRelics(AbstractPlayer.PlayerClass playerClass, ArrayList<String> arrayList) {
        logger.info("PostCreateStartingRelics received");
        queue_check();
    }

    @Override
    public void receivePowersModified() {
        logger.info("Powers modified");
        queue_check();
    }

    @Override
    public void receivePostPowerApplySubscriber(AbstractPower abstractPower, AbstractCreature abstractCreature, AbstractCreature abstractCreature1) {
        logger.info("PostPowerApply received");
        queue_check();
    }

    private static String removeSecret(String str) {
        String pattern = "\"secret\": \"[a-z0-9]*\"";
        return str.replaceAll(pattern, "\"secret\": \"********************\"");
    }
}