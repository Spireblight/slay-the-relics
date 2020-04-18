package str_exporter;

import basemod.BaseMod;
import basemod.abstracts.CustomCard;
import basemod.abstracts.DynamicVariable;
import com.megacrit.cardcrawl.cards.AbstractCard;
import com.megacrit.cardcrawl.cards.CardGroup;
import com.megacrit.cardcrawl.cards.DescriptionLine;
import com.megacrit.cardcrawl.core.CardCrawlGame;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Iterator;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class DeckJSONBuilder extends JSONMessageBuilder{

    private String[] TEXT;

    public static final Logger logger = LogManager.getLogger(TipsJSONBuilder.class.getName());


    public DeckJSONBuilder(String login, String secret, String version) {
        super(login, secret, version, 4);

        TEXT = CardCrawlGame.languagePack.getUIString("TipHelper").TEXT;
    }

    @Override
    protected void buildMessage(StringBuilder sb) {
        sb.append("{");

        StringBuilder sb_message = new StringBuilder();
        boolean nonempty = buildCards(sb_message);
        sb_message.append(nonempty ? ";": ";;;"); // ;;; delimits cards from keywords
        buildKeywords(sb_message);

        sb.append("\"k\":\""); // deck
        sb.append(sb_message.toString());
        sb.append("\"}");
    }

    private void buildKeywords(StringBuilder sb) {
        HashSet<String> keywords = new HashSet<>();

        if (CardCrawlGame.isInARun()) {
            CardGroup deck = CardCrawlGame.dungeon.player.masterDeck;

            for (int i = 0; i < deck.group.size(); i++) {
                for (String keyword : deck.group.get(i).keywords) {
                    keywords.add(keyword);
                }
            }
        }

        Iterator<String> iter = keywords.iterator();

        while(iter.hasNext()) {
            String word = iter.next();

            if (word.equals("[R]") || word.equals("[G]") || word.equals("[B]") || word.equals("[W]") || word.equals("[E]")) {
                sb.append(word);
                sb.append(' ');
                sb.append(TEXT[0]); // word Energy
            } else {
                sb.append(BaseMod.getKeywordTitle(word));
            }

            sb.append(";");
            sb.append(BaseMod.getKeywordDescription(word));

            if(iter.hasNext())
                sb.append(";;");
        }
    }

    private boolean buildCards(StringBuilder sb) {
        //returns true if deck has 1 or more cards

        int size = 0;

        if (CardCrawlGame.isInARun()) {
            CardGroup deck = CardCrawlGame.dungeon.player.masterDeck;
            for (int i = 0; i < deck.group.size(); i++) {
                buildCard(sb, deck.group.get(i));
                sb.append(";;");
            }

            size = deck.group.size();
        }

        return size > 0;
    }

    private void buildCard(StringBuilder sb, AbstractCard card) {

        String name = sanitize(card.name);
        String desc = parseDescription(card);
        int timesUpgraded = card.timesUpgraded;
        int cost = card.cost;

        if (timesUpgraded > 0) {
            name = colorizeString(name, "#g");
        }

        sb.append(name);
        sb.append(";");
        sb.append(cost);
        sb.append(';');
        sb.append(desc);
        sb.append(';');
        sb.append(getImgPath(card));
    }

    private String getImgPath(AbstractCard card) {
        if (card instanceof CustomCard) {
            String[] parts = ((CustomCard) card).textureImg.split("/");

            return parts[0] + "/" + parts[parts.length - 1];
        } else {
            // could remove text
            return card.assetUrl + ".png";
        }
    }

    private String sanitize(String s) {
        return s.replaceAll(";", ":")
                .replaceAll("\"", "\\\"")
                .replaceAll("\\[[A-Z]\\]", "[E]");
    }

    private String colorizeString(String s, String colorPrefix) {
        String[] parts = s.split(" ");
        StringBuilder sb = new StringBuilder();

        for (int i = 0; i < parts.length; i++) {
            sb.append(colorPrefix);
            sb.append(parts[i]);
            if (i < parts.length - 1)
                sb.append(' ');
        }

        return sb.toString();
    }

    private String parseDescription(AbstractCard card) {

        StringBuilder sb = new StringBuilder();

        for (int i = 0; i < card.description.size(); i++) {
            DescriptionLine line = card.description.get(i);

            sb.append(line.text);

            if(i < card.description.size() - 1)
                sb.append(" ");
        }

        String[] parts = sb.toString().split(" ");
        sb.setLength(0);

        Pattern patternDynVar = Pattern.compile("!(.+)!(.*)");
        Pattern patternKeyword = Pattern.compile("\\*(.+)");

        for (int i = 0; i < parts.length; i++) {
            String part = sanitize(parts[i]);

            Matcher matcherDynVar = patternDynVar.matcher(part);
            Matcher matcherKeyword = patternKeyword.matcher(part);

            if (matcherDynVar.find()) { // !MYVAR!
                part = matcherDynVar.group(1);
                String end = matcherDynVar.group(2);

                // Main body of method
//                StringBuilder stringBuilder = new StringBuilder();
                int num = 0;
                DynamicVariable dv = BaseMod.cardDynamicVariableMap.get(part);

                String color = "";
                if (dv != null) {
                    if (dv.isModified(card)) {
                        num = dv.value(card);
                        if (num >= dv.baseValue(card)) {
                            color = "#g";
                        } else {
                            color = "#r";
                        }
                    } else {
                        num = dv.baseValue(card);
                    }

                } else {
                    logger.error("No dynamic card variable found for key \"" + part + "\"!");
                }

                sb.append(color);
                sb.append(num);
                sb.append(end);

            } else if (matcherKeyword.find()) { // *Word
                sb.append("#y");
                sb.append(matcherKeyword.group(1));
            }  else { // Replace color codes for now

                part = part.replaceAll("\\[[a-zA-Z_]*\\]", "");
                part = part.replaceAll("\\[#[A-Ea-e0-9]*\\]", "");
                part = part.replaceAll("\\[\\]", "");
                part = part.replaceAll("\\[\\[", "[");

                sb.append(part);
            }

            if (i < parts.length - 1)
                sb.append(" ");
        }

        return sb.toString();
    }
}
