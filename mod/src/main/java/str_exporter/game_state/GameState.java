package str_exporter.game_state;


import basemod.Pair;
import com.megacrit.cardcrawl.cards.AbstractCard;
import com.megacrit.cardcrawl.cards.CardGroup;
import com.megacrit.cardcrawl.characters.AbstractPlayer;
import com.megacrit.cardcrawl.core.CardCrawlGame;
import com.megacrit.cardcrawl.core.Settings;
import com.megacrit.cardcrawl.dungeons.AbstractDungeon;
import com.megacrit.cardcrawl.relics.*;
import com.megacrit.cardcrawl.ui.panels.TopPanel;
import str_exporter.config.Config;
import str_exporter.game_state.integrations.Integrations;

import java.util.*;
import java.util.stream.Collectors;

import static str_exporter.game_state.TipsBox.isInCombat;

public class GameState {
    public int gameStateIndex = 0;
    public String channel;

    public String character;
    public String boss;
    public List<String> relics;
    public Map<Integer, List<Object>> baseRelicStats;
    public List<Tip> relicTips = new ArrayList<>();
    public List<Object> deck;
    public List<Object> drawPile;
    public List<Object> discardPile;
    public List<Object> exhaustPile;
    public List<String> potions;
    public List<TipsBox> additionalTips;
    // this is rendered the exact same way as additional tips,
    // but it's a separate field to save bytes sent to Twitch,
    // as they are updated less often than additionalTips
    public List<TipsBox> staticTips;
    public List<ArrayList<MapNode>> mapNodes;
    public List<List<Integer>> mapPath;
    public List<Integer> bottles;
    public float potionX;

    private transient final Config config;

    public GameState(String channel, Config config) {
        this.channel = channel;
        this.resetState();
        this.config = config;
    }

    public void resetState() {
        this.gameStateIndex = 0;
        this.character = "";
        this.boss = "";
        this.relics = new ArrayList<>();
        this.relicTips = new ArrayList<>();
        this.baseRelicStats = new HashMap<>();
        this.deck = new ArrayList<>();
        this.potions = new ArrayList<>();
        this.additionalTips = new ArrayList<>();
        this.staticTips = new ArrayList<>();
        this.mapNodes = new ArrayList<>();
        this.mapPath = new ArrayList<>();
        this.drawPile = new ArrayList<>();
        this.discardPile = new ArrayList<>();
        this.exhaustPile = new ArrayList<>();
        this.bottles = Arrays.asList(-1, -1, -1);
        this.potionX = 33;
    }

    private static String normalCardName(AbstractCard card) {
        if (card == null) {
            return null;
        }
        String name = card.cardID;
        if (card.upgraded && !name.contains("+")) {
            name += "+";
        }
        return name;
    }

    private static String bottleCardName(AbstractCard card) {
        if (card == null) {
            return null;
        }

        String[] parts = card.toString().split(" ");
        String colourString = "#y";
        StringBuilder sb = new StringBuilder();
        for (String part : parts) {
            sb.append(colourString).append(part).append(" ");
        }
        return sb.toString().trim();
    }

    private void setPaths() {
        this.mapPath = new ArrayList<>();
        if (AbstractDungeon.pathX == null || AbstractDungeon.pathY == null) {
            return;
        }
        if (AbstractDungeon.pathX.isEmpty() || AbstractDungeon.pathY.isEmpty()) {
            return;
        }
        if (AbstractDungeon.pathX.size() != AbstractDungeon.pathY.size()) {
            return;
        }
        for (int i = 0; i < AbstractDungeon.pathX.size(); i++) {
            int x = AbstractDungeon.pathX.get(i);
            int y = AbstractDungeon.pathY.get(i);
            if (x < 0 || y < 0) {
                continue;
            }
            ArrayList<Integer> cord = new ArrayList<>();
            cord.add(x);
            cord.add(y);
            this.mapPath.add(cord);
        }
    }


    private static String getBossName() {
        String key = AbstractDungeon.bossKey;
        switch (key) {
            case "The Guardian":
                return "guardian";
            case "Hexaghost":
                return "hexaghost";
            case "Slime Boss":
                return "slime";
            case "Collector":
                return "collector";
            case "Automaton":
                return "automaton";
            case "Champ":
                return "champ";
            case "Awakened One":
                return "awakened";
            case "Time Eater":
                return "timeeater";
            case "Donu and Deca":
                return "donu";
            case "The Heart":
                return "heart";
        }
        return "";
    }

    private static List<Object> cardGroupToCardData(CardGroup group) {
        return group.group.stream().filter(Objects::nonNull).map(GameState::cardToData).collect(Collectors.toList());
    }

    private static Object cardToData(AbstractCard card) {
        String name = normalCardName(card);
        switch (card.cardID) {
            case "Genetic Algorithm":
                return new ArrayList<>(Arrays.asList(name, card.baseBlock));
            case "RitualDagger":
                return new ArrayList<>(Arrays.asList(name, card.baseDamage));
            case "Searing Blow":
                return new ArrayList<>(Arrays.asList(name, card.timesUpgraded));
            default:
                return name;
        }
    }

    private void putBaseRelicStats(int i, List<Object> stats) {
        if (config.getModded()) {
            return;
        }
        this.baseRelicStats.put(i, stats);
    }

    private Pair<BottledFlame, Pair<BottledLightning, BottledTornado>> setRelics(AbstractPlayer player) {
        this.relics = new ArrayList<>();
        this.baseRelicStats = new HashMap<>();

        BottledFlame bottledFlame = null;
        BottledLightning bottledLightning = null;
        BottledTornado bottledTornado = null;

        for (int i = 0; i < player.relics.size(); ++i) {
            AbstractRelic relic = player.relics.get(i);

            if (!config.getModded()) {
                this.relics.add(relic.relicId);
            }

            if (relic instanceof BottledFlame) {
                bottledFlame = (BottledFlame) relic;
                AbstractCard card = bottledFlame.card;
                String name = bottleCardName(card);
                if (name != null) {
                    this.putBaseRelicStats(i, Collections.singletonList(name));
                }
            } else if (relic instanceof BottledLightning) {
                bottledLightning = (BottledLightning) relic;
                AbstractCard card = bottledLightning.card;
                String name = bottleCardName(card);
                if (name != null) {
                    this.putBaseRelicStats(i, Collections.singletonList(name));
                }
            } else if (relic instanceof BottledTornado) {
                bottledTornado = (BottledTornado) relic;
                AbstractCard card = bottledTornado.card;
                String name = bottleCardName(card);
                if (name != null) {
                    this.putBaseRelicStats(i, Collections.singletonList(name));
                }
            } else if (relic instanceof DuVuDoll) {
                int curse = 0;
                for (AbstractCard card : player.masterDeck.group) {
                    if (card.rarity == AbstractCard.CardRarity.CURSE) {
                        curse++;
                    }
                }
                this.putBaseRelicStats(i, Collections.singletonList(curse));
            } else if (relic instanceof Matryoshka) {
                this.putBaseRelicStats(i, Collections.singletonList(relic.counter));
            } else if (relic instanceof MawBank) {
                this.putBaseRelicStats(i, Collections.singletonList(relic.usedUp ? 0 : 12));
            } else if (relic instanceof Omamori) {
                this.putBaseRelicStats(i, Collections.singletonList(relic.counter));
            }
        }

        if (!config.getModded()) {
            this.relicTips = Integrations.relicStatsIntegration.relicTips(this.relics);
        }

        return new Pair<>(bottledFlame, new Pair<>(bottledLightning, bottledTornado));
    }

    public void poll() {
        boolean inRun = CardCrawlGame.isInARun() && CardCrawlGame.dungeon != null && AbstractDungeon.player != null;
        AbstractPlayer player = AbstractDungeon.player;
        if (!inRun) {
            this.resetState();
            return;
        }

        switch (player.chosenClass) {
            case IRONCLAD:
                this.character = "ironclad";
                break;
            case THE_SILENT:
                this.character = "silent";
                break;
            case DEFECT:
                this.character = "defect";
                break;
            case WATCHER:
                this.character = "watcher";
                break;
        }
        this.boss = getBossName();


        List<AbstractCard> masterDeck;
        if (player.masterDeck != null && player.masterDeck.group != null) {
            masterDeck = player.masterDeck.group.stream().filter(Objects::nonNull).collect(Collectors.toList());
        } else {
            masterDeck = new ArrayList<>();
        }

        Pair<BottledFlame, Pair<BottledLightning, BottledTornado>> b = setRelics(player);

        BottledFlame bottledFlame = b.getKey();
        BottledLightning bottledLightning = b.getValue().getKey();
        BottledTornado bottledTornado = b.getValue().getValue();

        ArrayList<Object> deck = new ArrayList<>();
        List<Integer> bottles = Arrays.asList(-1, -1, -1);

        for (int i = 0; i < masterDeck.size(); ++i) {
            AbstractCard card = masterDeck.get(i);
            deck.add(cardToData(card));
            if (bottledFlame != null && bottledFlame.card == card) {
                bottles.set(0, i);
            } else if (bottledLightning != null && bottledLightning.card == card) {
                bottles.set(1, i);
            } else if (bottledTornado != null && bottledTornado.card == card) {
                bottles.set(2, i);
            }
        }
        this.bottles = bottles;
        this.deck = deck;

        if (isInCombat()) {
            this.discardPile = cardGroupToCardData(player.discardPile);

            CardGroup drawPileCopy = new CardGroup(CardGroup.CardGroupType.UNSPECIFIED);
            CardGroup exhaustPileCopy = new CardGroup(CardGroup.CardGroupType.UNSPECIFIED);
            player.drawPile.group.forEach(drawPileCopy::addToBottom);
            player.exhaustPile.group.forEach(exhaustPileCopy::addToBottom);
            if (!player.hasRelic("Frozen Eye")) {
                drawPileCopy.sortAlphabetically(true);
                drawPileCopy.sortByRarityPlusStatusCardType(true);
                exhaustPileCopy.sortAlphabetically(true);
                exhaustPileCopy.sortByRarityPlusStatusCardType(true);
            }
            this.drawPile = cardGroupToCardData(drawPileCopy);
            this.exhaustPile = cardGroupToCardData(exhaustPileCopy);
        } else {
            this.discardPile = new ArrayList<>();
            this.exhaustPile = new ArrayList<>();
            this.drawPile = new ArrayList<>();
        }

        this.potions = player.potions.stream().map(p -> p.ID).collect(Collectors.toList());
        this.additionalTips = TipsBox.allCombatTips();
        this.staticTips = TipsBox.allStaticTips(this.config.getModded());
        this.mapNodes = makeMap();
        this.setPaths();

        this.potionX = getPotionX();

        this.gameStateIndex++;
    }

    private float getPotionX() {
        if (TopPanel.potionX == 0) {
            return 33;
        }
        if (Settings.WIDTH == 0) {
            return 33;
        }
        return TopPanel.potionX / Settings.WIDTH * 100;
    }

    private ArrayList<ArrayList<MapNode>> makeMap() {
        ArrayList<ArrayList<MapNode>> map = new ArrayList<>();
        if (AbstractDungeon.map == null) {
            return map;
        }
        AbstractDungeon.map.forEach(n -> {
            ArrayList<MapNode> floor = new ArrayList<>();
            n.forEach(node -> {
                if (node == null) {
                    return;
                }
                String nodeType = node.getRoomSymbol(true);
                if (node.getEdges().isEmpty()) {
                    nodeType = "*";
                }
                if (node.hasEmeraldKey && Objects.equals(nodeType, "E")) {
                    nodeType = "B";
                }
                MapNode newNode = new MapNode(nodeType, new ArrayList<>());
                node.getParents().forEach(parent -> {
                    if (parent.getEdges().isEmpty()) {
                        return;
                    }
                    newNode.parents.add(parent.x);
                });
                floor.add(newNode);
            });
            map.add(floor);
        });

        return map;
    }
}
