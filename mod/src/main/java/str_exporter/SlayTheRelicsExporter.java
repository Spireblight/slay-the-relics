package str_exporter;

import basemod.BaseMod;
import basemod.ModPanel;
import basemod.interfaces.*;
import com.evacipated.cardcrawl.modthespire.lib.SpireInitializer;
import com.megacrit.cardcrawl.characters.AbstractPlayer;
import com.megacrit.cardcrawl.core.CardCrawlGame;
import com.megacrit.cardcrawl.helpers.ImageMaster;
import com.megacrit.cardcrawl.relics.AbstractRelic;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;

@SpireInitializer
public class SlayTheRelicsExporter implements
        RelicGetSubscriber,
        StartGameSubscriber,
        PostCreateStartingRelicsSubscriber,
        PostInitializeSubscriber,
        PostUpdateSubscriber
{

    public static final Logger logger = LogManager.getLogger(SlayTheRelicsExporter.class.getName());

    private static String login = "";
    private static String secret = "";

    private static final String EBS_URL = "https://localhost:8080";

    private long lastBroadcast;
    private static final long MIN_BROADCAST_PERIOD_MILLIS = 30 * 1000;

    public SlayTheRelicsExporter()
    {
        logger.info("Slay The Relics Exporter initialized!");
        BaseMod.subscribe(this);
        // TODO: make an awesome mod!
    }

    public static void initialize()
    {
        logger.info("initialize() called!");
        new SlayTheRelicsExporter();

        try {

            String data = new String(Files.readAllBytes(Paths.get("slaytherelics_config.txt")));

            String[] lines = data.split("\r\n");

            login = lines[0].split(":")[1];
            secret = lines[1].split(":")[1];

            logger.info("loaded login " + login + " and secret " + secret);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void receiveRelicGet(AbstractRelic abstractRelic) {
        logger.info("Relic Acquired");
        check();
    }

    @Override
    public void receiveStartGame() {
        logger.info("Start Game received");
        check();
    }

    @Override
    public void receivePostCreateStartingRelics(AbstractPlayer.PlayerClass playerClass, ArrayList<String> arrayList) {
        check();
    }

    private void check() {
        checkIfRunInProgress();
        broadcastRelics();
        logger.info("login " + login);
        logger.info("secret " + secret);
    }

    private void broadcastRelics() {
        logger.info("broadcasting relics");

        ArrayList<AbstractRelic> relics = new ArrayList<>();

        if (CardCrawlGame.isInARun() && CardCrawlGame.dungeon != null && CardCrawlGame.dungeon.player != null) {
            relics = CardCrawlGame.dungeon.player.relics;
        }

        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"msg_type\": \"set_relics\", ");
        sb.append("\"streamer\": {\"login\": \"" + login + "\", \"secret\": \"" + secret + "\"}, ");
        sb.append("\"relics\": [");

        for (int i = 0; i < relics.size(); i++) {
            AbstractRelic relic = relics.get(i);
            sb.append("{\"name\": \"" + relic.name + "\", \"description\": \"" + relic.description + "\"}");

            if (i < relics.size() - 1)
                sb.append(", ");
        }
        sb.append("]}");

        logger.info(sb.toString());
        broadcastJson(sb.toString());
    }


    private void broadcastJson(String json) {

        lastBroadcast = System.currentTimeMillis();

        try {

            URL url = new URL(EBS_URL);
            HttpURLConnection con = (HttpURLConnection) url.openConnection();
            con.setRequestMethod("POST");
            con.setRequestProperty("Content-Type", "application/json");  //; utf-8
            con.setRequestProperty("Accept", "application/json");
            con.setDoOutput(true);

            OutputStream os = con.getOutputStream();
            byte[] input = json.getBytes("utf-8");
            os.write(input, 0, input.length);

            BufferedReader br = new BufferedReader(new InputStreamReader(con.getInputStream(), "utf-8"));
            StringBuilder response = new StringBuilder();
            String responseLine = null;
            while ((responseLine = br.readLine()) != null) {
                response.append(responseLine.trim());
            }
            logger.info("response: " + response.toString());

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void checkIfRunInProgress() {
        if (CardCrawlGame.isInARun()) {
            logger.info("Run in progress");
        } else {
            logger.info("Run not in progress");
        }
    }

    @Override
    public void receivePostInitialize() {
        logger.info("Minty Spire is active.");

        ModPanel settingsPanel = new ModPanel();

        BaseMod.registerModBadge(ImageMaster.loadImage("SlayTheRelicsExporterResources/img/modBadgeSmall.png"), "SlayTheRelics", "LordAddy", "TODO", settingsPanel);
    }

    @Override
    public void receivePostUpdate() {
        if (System.currentTimeMillis() - lastBroadcast > MIN_BROADCAST_PERIOD_MILLIS) {
            broadcastRelics();
        }
    }
}