package str_exporter;

import com.megacrit.cardcrawl.core.CardCrawlGame;
import com.megacrit.cardcrawl.helpers.PowerTip;
import com.megacrit.cardcrawl.potions.AbstractPotion;
import com.megacrit.cardcrawl.relics.AbstractRelic;

import java.util.ArrayList;

public class JSONMessageBuilder {

    private String login, secret, version;
    private ArrayList<String> powerTips;
    private static final int MAX_RELICS = 25;

    public JSONMessageBuilder(String login, String secret, String version) {
        this.login = login;
        this.secret = secret;
        this.version = version;
    }

    public String buildJson() {

        powerTips = new ArrayList<>();

        String character = "";

        if (CardCrawlGame.isInARun() && CardCrawlGame.dungeon != null && CardCrawlGame.dungeon.player != null) {
            character = CardCrawlGame.dungeon.player.getClass().getSimpleName();
        }

        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"msg_type\": \"set_content\", ");
        sb.append("\"streamer\": {\"login\": \"" + login + "\", \"secret\": \"" + secret + "\"}, ");
        sb.append("\"meta\": {\"version\": \"" + version + "\"}, ");
        sb.append("\"message\": {");

        sb.append("\"character\": \"" + character + "\", ");

        sb.append("\"potions\": ");
        buildPotions(sb);
        sb.append(", ");

        sb.append("\"relics\": ");
        buildRelics(sb);
        sb.append(", ");

        sb.append("\"power_tips\": ");
        buildPowerTips(sb);

        sb.append("}}");

        return sb.toString();
    }

    private void buildPotions(StringBuilder sb) {

        sb.append('[');
        if (CardCrawlGame.isInARun() && CardCrawlGame.dungeon != null && CardCrawlGame.dungeon.player != null) {
            ArrayList<AbstractPotion> potions = CardCrawlGame.dungeon.player.potions;

            for (int i = 0; i < potions.size(); i++) {
                buildPotion(sb, potions.get(i));

                if (i < potions.size() - 1)
                    sb.append(", ");
            }
        }
        sb.append(']');
    }

    private void buildPotion(StringBuilder sb, AbstractPotion potion) {
        sb.append('[');
        for (int i = 0; i < potion.tips.size(); i++) {
            PowerTip tip = potion.tips.get(i);

            sb.append(getPowerTipIndex(tip));

            if (i < potion.tips.size() - 1) {
                sb.append(", ");
            }
        }
        sb.append(']');
    }

    private void buildRelics(StringBuilder sb) {
        int pageId = AbstractRelic.relicPage;
        ArrayList<AbstractRelic> relics = new ArrayList<>();

        if (CardCrawlGame.isInARun() && CardCrawlGame.dungeon != null && CardCrawlGame.dungeon.player != null) {
            relics = CardCrawlGame.dungeon.player.relics; // send over relics
        }

        int first_index = pageId * MAX_RELICS;
        int last_index = Math.min((pageId + 1) * MAX_RELICS, relics.size());

        sb.append("{\"is_relics_multipage\": \"" + (relics.size() > MAX_RELICS) + "\", ");
        sb.append("\"items\": [");
        for (int i = first_index; i < last_index; i++) {
            buildRelic(sb, relics.get(i));

            if (i < last_index - 1)
                sb.append(", ");
        }
        sb.append("]}");
    }

    private void buildRelic(StringBuilder sb, AbstractRelic relic) {

        sb.append('[');
        for (int i = 0; i < relic.tips.size(); i++) {
            PowerTip tip = relic.tips.get(i);

            sb.append(getPowerTipIndex(tip));

            if (i < relic.tips.size() - 1) {
                sb.append(", ");
            }
        }
        sb.append(']');
    }

    private void buildPowerTips(StringBuilder sb) {
        sb.append('[');
        for (int i = 0; i < powerTips.size(); i++) {
            sb.append('"');
            sb.append(powerTips.get(i));
            sb.append('"');

            if (i < powerTips.size() - 1)
                sb.append(", ");
        }
        sb.append(']');
    }

    private int getPowerTipIndex(PowerTip tip) {
        String tipStr = "";
        if (tip.imgRegion != null) {
            tipStr = powerTipJson(tip.header, tip.body, tip.imgRegion.name);
        } else {
            tipStr = powerTipJson(tip.header, tip.body);
        }

        int index = powerTips.indexOf(tipStr);
        if (index == -1) { // not yet present
            index = powerTips.size();
            powerTips.add(tipStr);
        }

        return index;
    }

    private static String powerTipJson(String header, String body) {
        return String.format(
                "{\"name\": \"%s\", \"description\": \"%s\"}",
                sanitize(header),
                sanitize(body)
        );
    }

    private static String powerTipJson(String header, String body, String img) {
        return String.format(
                "{\"name\": \"%s\", \"description\": \"%s\", \"img\": \"%s\"}",
                sanitize(header),
                sanitize(body),
                sanitize(img)
                );
    }

    private static String sanitize(String str) {
        str = str.replace("\"", "\\\"");
        str = str.replace("[R]", "[E]");
        str = str.replace("[G]", "[E]");
        str = str.replace("[B]", "[E]");
        str = str.replace("[W]", "[E]");
        str = str.replace("NL", "<br>");

        return str;
    }


}
