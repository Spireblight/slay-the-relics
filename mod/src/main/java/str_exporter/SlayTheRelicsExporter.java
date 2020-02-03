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
import java.nio.charset.StandardCharsets;
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

//    private static final String EBS_URL = "https://localhost:8080";
    private static final String EBS_URL = "https://slaytherelics.xyz:8080";
    private static final int MAX_RELICS = 25;

    private long lastBroadcast = System.currentTimeMillis();
    private String lastBroadcastJson = "";
    private static final long MIN_SAME_BROADCAST_PERIOD_MILLIS = 10 * 1000;
    private static final long MAX_BROADCAST_PERIOD_MILLIS = 30 * 1000;
    public static SlayTheRelicsExporter instance = null;

    public SlayTheRelicsExporter()
    {
        logger.info("Slay The Relics Exporter initialized!");
        BaseMod.subscribe(this);
    }

    public static void initialize()
    {
        logger.info("initialize() called!");
        instance = new SlayTheRelicsExporter();

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

    public void relicPageChanged() {
        logger.info("Relic Page Changed");
        check();
    }


    public void receiveGameExitting() {
        logger.info("Game is Exitting");
        check();
    }

    @Override
    public void receiveRelicGet(AbstractRelic abstractRelic) {
        logger.info("Relic Acquired");
        check(abstractRelic);
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
        check(null);
    }

    private void check(AbstractRelic receivedRelic) {
//        checkIfRunInProgress();
        broadcastRelics(receivedRelic);
//        logger.info("login " + login);
//        logger.info("secret " + secret);
    }

    private void broadcastRelics(AbstractRelic receivedRelic) {
        logger.info("broadcasting relics");

        int pageId = AbstractRelic.relicPage; // send over relic page ID
        ArrayList<AbstractRelic> relics = new ArrayList<>(); // send over relics

        if (CardCrawlGame.isInARun() && CardCrawlGame.dungeon != null && CardCrawlGame.dungeon.player != null) {
            relics = (ArrayList<AbstractRelic>) CardCrawlGame.dungeon.player.relics.clone();
            if (receivedRelic != null) {
                relics.add(receivedRelic);
            }
        }

        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"msg_type\": \"set_relics\", ");
        sb.append("\"streamer\": {\"login\": \"" + login + "\", \"secret\": \"" + secret + "\"}, ");
        sb.append("\"relics\": [");

        int first_index = pageId * MAX_RELICS;
        int last_index = Math.min((pageId + 1) * MAX_RELICS, relics.size());

        for (int i = first_index; i < last_index; i++) {
            AbstractRelic relic = relics.get(i);
            sb.append("{\"name\": \"" + relic.name + "\", \"description\": \"" + relic.description + "\"}");

            if (i < last_index - 1)
                sb.append(", ");
        }
        sb.append("], ");
        sb.append("\"is_relics_multipage\": \"" + (relics.size() > MAX_RELICS) + "\"");
        sb.append("}");

        logger.info(sb.toString());
        broadcastJson(sb.toString());
    }


    private void broadcastJson(String json) {

        // prevent rapid repeated broadcasts
        if (System.currentTimeMillis() - lastBroadcast < MIN_SAME_BROADCAST_PERIOD_MILLIS && json.equals(lastBroadcastJson)) {
            return;
        }

        lastBroadcast = System.currentTimeMillis();
        lastBroadcastJson = json;

        (new Thread(() -> {
            try {

                URL url = new URL(EBS_URL);
                HttpURLConnection con = (HttpURLConnection) url.openConnection();
                con.setRequestMethod("POST");
                con.setRequestProperty("Content-Type", "application/json");  //; utf-8
                con.setRequestProperty("Accept", "application/json");
                con.setDoOutput(true);

                OutputStream os = con.getOutputStream();
                byte[] input = json.getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);

                BufferedReader br = new BufferedReader(new InputStreamReader(con.getInputStream(), StandardCharsets.UTF_8));
                StringBuilder response = new StringBuilder();
                String responseLine;
                while ((responseLine = br.readLine()) != null) {
                    response.append(responseLine.trim());
                }
                logger.info("response: " + response.toString());

            } catch (Exception e) {
                e.printStackTrace();
            }
        })).start();
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
        if (System.currentTimeMillis() - lastBroadcast > MAX_BROADCAST_PERIOD_MILLIS) {
            check();
        }
    }
}