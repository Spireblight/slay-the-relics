package str_exporter.game_state;


import com.megacrit.cardcrawl.cards.AbstractCard;
import com.megacrit.cardcrawl.cards.CardGroup;
import com.megacrit.cardcrawl.characters.AbstractPlayer;
import com.megacrit.cardcrawl.core.CardCrawlGame;
import com.megacrit.cardcrawl.dungeons.AbstractDungeon;
import com.megacrit.cardcrawl.relics.*;

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
    public List<String> deck;
    public List<String> drawPile;
    public List<String> discardPile;
    public List<String> exhaustPile;
    public List<String> potions;
    public List<TipsBox> additionalTips;
    public List<ArrayList<MapNode>> mapNodes;
    public List<List<Integer>> mapPath;


    public GameState(String channel) {
        this.channel = channel;
        this.resetState();
    }

    public void resetState() {
        this.gameStateIndex = 0;
        this.character = "";
        this.boss = "";
        this.relics = new ArrayList<>();
        this.baseRelicStats = new HashMap<>();
        this.deck = new ArrayList<>();
        this.potions = new ArrayList<>();
        this.additionalTips = new ArrayList<>();
        this.mapNodes = new ArrayList<>();
        this.mapPath = new ArrayList<>();
        this.drawPile = new ArrayList<>();
        this.discardPile = new ArrayList<>();
        this.exhaustPile = new ArrayList<>();
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

    private static String colouredCardName(AbstractCard card) {
        if (card == null) {
            return null;
        }

        String name = normalCardName(card);
        String[] parts = name.split(" ");
        String colourString = "";
        switch (card.rarity) {
            case RARE:
                colourString = "#y";
                break;
            case UNCOMMON:
                colourString = "#b";
                break;
        }
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
        this.relics = new ArrayList<>();
        this.baseRelicStats = new HashMap<>();
        for (int i = 0; i < player.relics.size(); ++i) {
            AbstractRelic relic = player.relics.get(i);
            this.relics.add(relic.relicId);

            if (relic instanceof BottledFlame) {
                AbstractCard card = ((BottledFlame) relic).card;
                String name = colouredCardName(card);
                if (name != null) {
                    this.baseRelicStats.put(i, Collections.singletonList(name));
                }
            } else if (relic instanceof BottledLightning) {
                AbstractCard card = ((BottledLightning) relic).card;
                String name = colouredCardName(card);
                if (name != null) {
                    this.baseRelicStats.put(i, Collections.singletonList(name));
                }
            } else if (relic instanceof BottledTornado) {
                AbstractCard card = ((BottledTornado) relic).card;
                String name = colouredCardName(card);
                if (name != null) {
                    this.baseRelicStats.put(i, Collections.singletonList(name));
                }
            } else if (relic instanceof DuVuDoll) {
                int curse = 0;
                for (AbstractCard card : player.masterDeck.group) {
                    if (card.rarity == AbstractCard.CardRarity.CURSE) {
                        curse++;
                    }
                }
                this.baseRelicStats.put(i, Collections.singletonList(curse));
            } else if (relic instanceof Matryoshka) {
                this.baseRelicStats.put(i, Collections.singletonList(relic.counter));
            } else if (relic instanceof MawBank) {
                this.baseRelicStats.put(i, Collections.singletonList(relic.usedUp ? 0 : 12));
            } else if (relic instanceof Omamori) {
                this.baseRelicStats.put(i, Collections.singletonList(relic.counter));
            }
        }

        this.deck =
                player.masterDeck.group.stream()
                        .map(GameState::normalCardName)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toList());

        if (isInCombat()) {
            this.discardPile =
                    player.discardPile.group.stream()
                            .map(GameState::normalCardName)
                            .filter(Objects::nonNull)
                            .collect(Collectors.toList());

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
            this.drawPile =
                    drawPileCopy.group.stream()
                            .map(GameState::normalCardName)
                            .filter(Objects::nonNull)
                            .collect(Collectors.toList());
            this.exhaustPile =
                    exhaustPileCopy.group.stream()
                            .map(GameState::normalCardName)
                            .filter(Objects::nonNull)
                            .collect(Collectors.toList());
        } else {
            this.discardPile = new ArrayList<>();
            this.exhaustPile = new ArrayList<>();
            this.drawPile = new ArrayList<>();
        }


        this.potions = player.potions.stream().map(p -> p.ID).collect(Collectors.toList());
        this.additionalTips = TipsBox.allTips();
        this.mapNodes = makeMap();
        this.setPaths();
        this.gameStateIndex++;
    }

    private ArrayList<ArrayList<MapNode>> makeMap() {
        ArrayList<ArrayList<MapNode>> map = new ArrayList<>();
//        ArrayList<ArrayList<ArrayList<Integer>>> edges = new ArrayList<>();

        AbstractDungeon.map.forEach(n -> {
            ArrayList<MapNode> floor = new ArrayList<>();
            n.forEach(node -> {
                String nodeType = node.getRoomSymbol(true);
                if (node.getEdges().isEmpty()) {
                    nodeType = "*";
                }
//                node.getEdges().forEach(edge -> {
//                    ArrayList<ArrayList<Integer>> edgeCoords = new ArrayList<>();
//                    edgeCoords.add(new ArrayList<>(Arrays.asList(edge.srcX, edge.srcY)));
//                    edgeCoords.add(new ArrayList<>(Arrays.asList(edge.dstX, edge.dstY)));
//                    edges.add(edgeCoords);
//                });
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

//        edges.forEach(edge -> {
//            int srcX = edge.get(0).get(0);
//            int srcY = edge.get(0).get(1);
//            int dstX = edge.get(1).get(0);
//            int dstY = edge.get(1).get(1);
//
//            if (dstY > map.size() - 1) {
//                return;
//            }
//
//            MapNode srcNode = map.get(srcY).get(srcX);
//            MapNode dstNode = map.get(dstY).get(dstX);
//
//            if (srcNode != null && dstNode != null && dstY - srcY == 1) {
//                dstNode.parents.add(srcX);
//            }
//
//        });
        return map;
    }
}
