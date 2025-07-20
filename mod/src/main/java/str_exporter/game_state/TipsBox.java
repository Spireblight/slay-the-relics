package str_exporter.game_state;

import basemod.ReflectionHacks;
import com.badlogic.gdx.graphics.Texture;
import com.megacrit.cardcrawl.core.CardCrawlGame;
import com.megacrit.cardcrawl.core.Settings;
import com.megacrit.cardcrawl.dungeons.AbstractDungeon;
import com.megacrit.cardcrawl.helpers.Hitbox;
import com.megacrit.cardcrawl.helpers.ImageMaster;
import com.megacrit.cardcrawl.helpers.PowerTip;
import com.megacrit.cardcrawl.monsters.AbstractMonster;
import com.megacrit.cardcrawl.powers.AbstractPower;
import com.megacrit.cardcrawl.relics.AbstractRelic;
import com.megacrit.cardcrawl.rooms.AbstractRoom;
import com.megacrit.cardcrawl.rooms.ShopRoom;
import com.megacrit.cardcrawl.shop.StorePotion;
import com.megacrit.cardcrawl.shop.StoreRelic;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class TipsBox {
    public final List<Tip> tips;
    public final HitBox hitbox;

    public TipsBox(List<Tip> tips, HitBox hitbox) {
        this.tips = tips;
        this.hitbox = hitbox;
    }

    public static boolean isInCombat() {
        if (AbstractDungeon.currMapNode == null) {
            return false;
        }
        AbstractRoom room = AbstractDungeon.getCurrRoom();
        return room != null && room.phase == AbstractRoom.RoomPhase.COMBAT;
    }

    private static boolean isInAShop() {
        return CardCrawlGame.isInARun() &&
                CardCrawlGame.dungeon != null &&
                AbstractDungeon.player != null &&
                AbstractDungeon.currMapNode != null &&
                AbstractDungeon.currMapNode.room instanceof ShopRoom;
    }

    private static boolean isDisplayingBossRelics() {
        return CardCrawlGame.isInARun() &&
                CardCrawlGame.dungeon != null &&
                AbstractDungeon.player != null &&
                AbstractDungeon.currMapNode != null &&
                AbstractDungeon.screen == AbstractDungeon.CurrentScreen.BOSS_REWARD;
    }

    private static String getImageCode(Texture img) {
        if (img.equals(ImageMaster.INTENT_ATK_TIP_1)) return "intents/tip/1";
        if (img.equals(ImageMaster.INTENT_ATK_TIP_2)) return "intents/tip/2";
        if (img.equals(ImageMaster.INTENT_ATK_TIP_3)) return "intents/tip/3";
        if (img.equals(ImageMaster.INTENT_ATK_TIP_4)) return "intents/tip/4";
        if (img.equals(ImageMaster.INTENT_ATK_TIP_5)) return "intents/tip/5";
        if (img.equals(ImageMaster.INTENT_ATK_TIP_6)) return "intents/tip/6";
        if (img.equals(ImageMaster.INTENT_ATK_TIP_7)) return "intents/tip/7";
        if (img.equals(ImageMaster.INTENT_BUFF)) return "intents/buff1";
        if (img.equals(ImageMaster.INTENT_DEBUFF)) return "intents/debuff1";
        if (img.equals(ImageMaster.INTENT_DEBUFF2)) return "intents/debuff2";
        if (img.equals(ImageMaster.INTENT_DEFEND)) return "intents/defend";
        if (img.equals(ImageMaster.INTENT_DEFEND_BUFF)) return "intents/defendBuff";
        if (img.equals(ImageMaster.INTENT_ESCAPE)) return "intents/escape";
        if (img.equals(ImageMaster.INTENT_MAGIC)) return "intents/magic";
        if (img.equals(ImageMaster.INTENT_SLEEP)) return "intents/sleep";
        if (img.equals(ImageMaster.INTENT_STUN)) return "intents/stun";
        if (img.equals(ImageMaster.INTENT_UNKNOWN)) return "intents/unknown";
        if (img.equals(ImageMaster.INTENT_ATTACK_BUFF)) return "intents/attackBuff";
        if (img.equals(ImageMaster.INTENT_ATTACK_DEBUFF)) return "intents/attackDebuff";
        if (img.equals(ImageMaster.INTENT_ATTACK_DEFEND)) return "intents/attackDefend";
        return "placeholder";
    }

    public static List<TipsBox> allTips() {
        ArrayList<TipsBox> tips = new ArrayList<>();

        if (isInCombat()) {
            TipsBox player = playerTipsBox();
            tips.add(player);
            tips.addAll(orbTips());
            getMonsters().forEach(monster -> {
                tips.add(monsterTipsBox(monster));
            });
        } else if (isInAShop()) {
            tips.addAll(shopTips());
        } else if (isDisplayingBossRelics()) {
            tips.addAll(bossRelicTips());
        }

        return tips.stream().filter(t -> !t.tips.isEmpty()).collect(Collectors.toList());
    }

    private static boolean instanceOfInvisiblePower(AbstractPower p) {
        Class[] interfaces = p.getClass().getInterfaces();

        for (Class iface : interfaces) {
            if (iface.getCanonicalName().equals("com.evacipated.cardcrawl.mod.stslib.powers.interfaces.InvisiblePower"))
                return true;
        }

        return false;
    }

    private static Tip powerTip(AbstractPower power) {
        if (instanceOfInvisiblePower(power)) {
            return null; // Skip invisible powers
        }
        return powerTip(new PowerTip(power.name, power.description, power.region48));
    }

    private static Tip powerTip(PowerTip tip) {
        String img = "";
        if (tip.imgRegion != null && tip.imgRegion.name != null) {
            img = "powers/" + tip.imgRegion.name;
        } else if (tip.img != null) {
            img = getImageCode(tip.img);
        }
        return new Tip(tip.header, tip.body, img);
    }

    private static HitBox buildHitbox(Hitbox hb) {
        float x = hb.x / Settings.WIDTH * 100f;
        float y = (Settings.HEIGHT - hb.y - hb.height) / Settings.HEIGHT * 100f; // invert the y-coordinate
        float w = hb.width / Settings.WIDTH * 100f;
        float h = hb.height / Settings.HEIGHT * 100f;
        return new HitBox(x, y, w, h);
    }

    private static List<TipsBox> orbTips() {
        return AbstractDungeon.player.orbs.stream().map(orb -> {
            HitBox hb = buildHitbox(orb.hb);
            Tip tip = new Tip(orb.name, orb.description);
            return new TipsBox(Collections.singletonList(tip), hb);
        }).collect(Collectors.toList());
    }

    private static List<TipsBox> shopTips() {
        ArrayList<StorePotion>
                potions =
                ReflectionHacks.getPrivate(AbstractDungeon.shopScreen,
                        AbstractDungeon.shopScreen.getClass(),
                        "potions");
        ArrayList<StoreRelic>
                relics =
                ReflectionHacks.getPrivate(AbstractDungeon.shopScreen, AbstractDungeon.shopScreen.getClass(), "relics");

        if (potions == null) {
            potions = new ArrayList<>();
        }
        if (relics == null) {
            relics = new ArrayList<>();
        }

        Stream<TipsBox> potionTips = potions.stream().map(p -> {
            HitBox hb = buildHitbox(p.potion.hb);
            return new TipsBox(p.potion.tips.stream().map(TipsBox::powerTip).collect(Collectors.toList()), hb);
        });

        Stream<TipsBox> relicTips = relics.stream().map(relic -> {
            HitBox hb = buildHitbox(relic.relic.hb);
            return new TipsBox(relic.relic.tips.stream().map(TipsBox::powerTip).collect(Collectors.toList()), hb);
        });

        return Stream.concat(potionTips, relicTips).collect(Collectors.toList());
    }

    private static List<TipsBox> bossRelicTips() {
        ArrayList<AbstractRelic> relics = AbstractDungeon.bossRelicScreen.relics;
        return relics.stream().map(relic -> {
            HitBox hb = buildHitbox(relic.hb);
            return new TipsBox(relic.tips.stream().map(TipsBox::powerTip).collect(Collectors.toList()), hb);
        }).collect(Collectors.toList());
    }

    private static TipsBox monsterTipsBox(AbstractMonster monster) {
        ArrayList<Tip> tips = new ArrayList<>();
        HitBox box = buildHitbox(monster.hb);

        if (monster.intentAlphaTarget == 1.0F &&
                !AbstractDungeon.player.hasRelic("Runic Dome") &&
                monster.intent != AbstractMonster.Intent.NONE) {
            PowerTip intentTip = ReflectionHacks.getPrivate(monster, AbstractMonster.class, "intentTip");

            if (intentTip != null) {
                Tip tip = powerTip(intentTip);
                tips.add(tip);
            }
        }

        for (AbstractPower power : monster.powers) {
            Tip powerTip = powerTip(power);
            if (powerTip != null) {
                tips.add(powerTip);
            }
        }

        return new TipsBox(tips, box);
    }

    private static TipsBox playerTipsBox() {
        ArrayList<Tip> tips = new ArrayList<>();
        HitBox box = buildHitbox(AbstractDungeon.player.hb);

        for (AbstractPower power : AbstractDungeon.player.powers) {
            Tip tip = powerTip(power);
            if (tip != null) {
                tips.add(tip);
            }
        }

        return new TipsBox(tips, box);
    }

    private static List<AbstractMonster> getMonsters() {
        if (AbstractDungeon.getMonsters() == null) {
            return new ArrayList<>();
        }
        if (AbstractDungeon.getMonsters().monsters == null) {
            return new ArrayList<>();
        }
        return AbstractDungeon.getMonsters().monsters.stream()
                .filter(m -> !m.isDying && !m.isDeadOrEscaped())
                .collect(Collectors.toList());
    }
}
