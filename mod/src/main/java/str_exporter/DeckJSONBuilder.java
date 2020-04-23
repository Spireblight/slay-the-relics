package str_exporter;

import basemod.BaseMod;
import basemod.abstracts.DynamicVariable;
import com.megacrit.cardcrawl.cards.AbstractCard;
import com.megacrit.cardcrawl.cards.CardGroup;
import com.megacrit.cardcrawl.cards.DescriptionLine;
import com.megacrit.cardcrawl.core.CardCrawlGame;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class DeckJSONBuilder extends JSONMessageBuilder{

    private String[] TEXT;

    public static final Logger logger = LogManager.getLogger(TipsJSONBuilder.class.getName());

    private ArrayList<String> keywords;
    private ArrayList<String> cardsRepr;
    private ArrayList<AbstractCard> cards;

    public DeckJSONBuilder(String login, String secret, String version) {
        super(login, secret, version, 4);

        keywords = new ArrayList<>();
        cardsRepr = new ArrayList<>();
        cards = new ArrayList<>();

        TEXT = CardCrawlGame.languagePack.getUIString("TipHelper").TEXT;
    }

    @Override
    protected void buildMessage(StringBuilder sb) {
        String character = "";

        if (CardCrawlGame.isInARun() && CardCrawlGame.dungeon != null && CardCrawlGame.dungeon.player != null) {
            character = CardCrawlGame.dungeon.player.getClass().getSimpleName();
        }

        sb.append("{");
        sb.append("\"c\":\"").append(character).append("\","); // character

        keywords.clear();
        cardsRepr.clear();
        cards.clear();

        // deck;;;cards;;;keywords
        StringBuilder sb_message = new StringBuilder();
        buildDeck(sb_message);
        sb_message.append(";;;");
        buildCards(sb_message);
        sb_message.append(";;;");
        buildKeywords(sb_message);

        sb.append("\"k\":\""); // deck
        sb.append(StringCompression.compress(sb_message.toString()));
        sb.append("\"}");
    }

    private void buildKeywords(StringBuilder sb) {
        Iterator<String> iter = keywords.iterator();

        while(iter.hasNext()) {
            sb.append(iter.next());

            if(iter.hasNext())
                sb.append(";;");
        }
    }

    private String getKeywordRepr(String word) {
        StringBuilder sb = new StringBuilder();

        if (word.equals("[R]") || word.equals("[G]") || word.equals("[B]") || word.equals("[W]") || word.equals("[E]")) {
            sb.append(sanitize(word));
            sb.append(' ');
            sb.append(TEXT[0]); // word Energy
        } else {
            sb.append(sanitize(BaseMod.getKeywordTitle(word)));
        }

        sb.append(";");
        sb.append(sanitize(BaseMod.getKeywordDescription(word)));

        return sb.toString();
    }

    private int getKeywordIndex(String keyword) {
        String keywordRepr = getKeywordRepr(keyword);

        int index = keywords.indexOf(keywordRepr);

        if (index >= 0)
            return index;
        else {
            keywords.add(keywordRepr);
            return keywords.size() - 1;
        }
    }

    private boolean buildDeck(StringBuilder sb) {
        int size = 0;

        if (CardCrawlGame.isInARun()) {
            CardGroup deck = CardCrawlGame.dungeon.player.masterDeck;
            for (int i = 0; i < deck.group.size(); i++) {
                sb.append(getCardIndex(deck.group.get(i)));
                if (i < deck.group.size() - 1)
                    sb.append(',');
            }

            size = deck.group.size();
        }

        if (size == 0) {
            sb.append('-');
        }

        return size > 0;
    }

    private void buildCards(StringBuilder sb) {
        //returns true if deck has 1 or more cards

        for (int i = 0; i < cards.size(); i++) {
            buildCard(sb, cards.get(i));
            if (i < cards.size() - 1)
                sb.append(";;");
        }

        if (cards.isEmpty())
            sb.append('-');
    }

    private int getCardIndex(AbstractCard card) {
        String cardShortRepr = getShortCardRepr(card);

        int index = cardsRepr.indexOf(cardShortRepr);

        if (index >= 0)
            return index;
        else {
            cards.add(card);
            cardsRepr.add(cardShortRepr);
            return cardsRepr.size() - 1;
        }
    }

    private String getShortCardRepr(AbstractCard card) {
        StringBuilder sb = new StringBuilder();

        sb.append(sanitize(card.name));
        sb.append(';');
        sb.append(encodeCardColor(card));
        sb.append(';');
        sb.append(card.rawDescription);

        return sb.toString();
    }

    private void buildCard(StringBuilder sb, AbstractCard card) {
        // inTip == true when we're building a card that's supposed to appear in a card tip (e.g. a Shiv)

        String name = sanitizeEmpty(sanitize(card.name));
        String desc = sanitizeEmpty(parseDescription(card));
        String keywords = sanitizeEmpty(encodeKeywords(card));

        AbstractCard copy = card.makeStatEquivalentCopy();
        copy.upgrade();
        copy.displayUpgrades();
        String upgradedDesc = sanitizeEmpty(parseDescription(copy));
        String upgradedName = sanitizeEmpty(copy.name);
        String upgradedKeywords = sanitizeEmpty(encodeKeywords(copy));

        int timesUpgraded = card.timesUpgraded;
        int cost = card.cost;

        if (!card.canUpgrade() && card.timesUpgraded > 0) {
            // card is already upgraded and cannot be upgraded further
            upgradedDesc = "_";
            upgradedName = "_";
            upgradedKeywords = "_";
        } else if (!card.canUpgrade() && card.timesUpgraded == 0) {
            // card cannot be upgraded at all, e.g. a Curse
            upgradedName = "null";
            upgradedDesc = "-";
            upgradedKeywords = "-";
        } else if (card.canUpgrade() && card.timesUpgraded == 0 && upgradedName.equals(name + '+')) {
            // card is not upgraded and can be upgraded and uses the common + sign notation
            upgradedName = "+";
        } else if (upgradedKeywords.equals(keywords)) {
            upgradedKeywords = "_";
        }

        // for a regular card:
        // name ; bottleStatus ; cardToPreview ; cardToPreview upgraded ; nameUpgraded ; upgrades ; keyword upgraded ; descriptionUpgraded ; keywords ; cost ; type ; rarity ; color ; description

        sb.append(name);
        sb.append(";");
        sb.append(encodeBottleStatus(card));
        sb.append(';');
        sb.append(encodeCardToPreview(card));
        sb.append(';');
        sb.append(encodeCardToPreview(copy));
        sb.append(';');
        sb.append(upgradedName);
        sb.append(";");
        sb.append(timesUpgraded);
        sb.append(';');
        sb.append(upgradedKeywords);
        sb.append(';');
        sb.append(upgradedDesc);
        sb.append(';');
        sb.append(keywords);
        sb.append(';');
        sb.append(cost);
        sb.append(";");
        sb.append(encodeCardType(card));
        sb.append(";");
        sb.append(encodeCardRarity(card));
        sb.append(";");
        sb.append(encodeCardColor(card));
        sb.append(";");
        sb.append(desc);
    }

    private String sanitizeEmpty(String s) {
        return s.isEmpty() ? "-" : s;
    }

    private String encodeCardToPreview(AbstractCard card) {
        if (card.cardsToPreview != null) {
            return Integer.toString(getCardIndex(card.cardsToPreview));
        }  else {
            return "-1";
        }
    }

    private String encodeKeywords(AbstractCard card) {
        StringBuilder sb = new StringBuilder();

        Iterator<String> iter = card.keywords.iterator();

        while(iter.hasNext()) {
            sb.append(getKeywordIndex(iter.next()));

            if (iter.hasNext())
                sb.append(',');
        }

        return sb.toString();
    }

    private String encodeCardType(AbstractCard card) {
        int ord = card.type.ordinal();
        return ord > 4 ? card.type.toString() : Integer.toString(ord);
    }

    private String encodeCardRarity(AbstractCard card) {
        int ord = card.rarity.ordinal();
        return ord > 5 ? card.rarity.toString() : Integer.toString(ord);
    }

    private String encodeCardColor(AbstractCard card) {
        int ord = card.color.ordinal();
        return ord > 5 ? card.color.toString() : Integer.toString(ord);
    }

    private String encodeBottleStatus(AbstractCard card) {
        if (card.inBottleFlame) {
            return "1";
        } else if (card.inBottleLightning) {
            return "2";
        } else if (card.inBottleTornado) {
            return "3";
        } else {
            return "0";
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
                sb.append(" NL ");
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
