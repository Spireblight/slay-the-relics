package str_exporter.builders;

import basemod.ReflectionHacks;
import basemod.patches.whatmod.WhatMod;
import com.badlogic.gdx.graphics.Texture;
import com.megacrit.cardcrawl.characters.AbstractPlayer;
import com.megacrit.cardcrawl.core.CardCrawlGame;
import com.megacrit.cardcrawl.core.Settings;
import com.megacrit.cardcrawl.dungeons.AbstractDungeon;
import com.megacrit.cardcrawl.helpers.FontHelper;
import com.megacrit.cardcrawl.helpers.Hitbox;
import com.megacrit.cardcrawl.helpers.ImageMaster;
import com.megacrit.cardcrawl.helpers.PowerTip;
import com.megacrit.cardcrawl.monsters.AbstractMonster;
import com.megacrit.cardcrawl.orbs.AbstractOrb;
import com.megacrit.cardcrawl.potions.AbstractPotion;
import com.megacrit.cardcrawl.powers.AbstractPower;
import com.megacrit.cardcrawl.relics.AbstractRelic;
import com.megacrit.cardcrawl.rooms.AbstractRoom;
import com.megacrit.cardcrawl.rooms.ShopRoom;
import com.megacrit.cardcrawl.shop.StorePotion;
import com.megacrit.cardcrawl.shop.StoreRelic;
import com.megacrit.cardcrawl.ui.panels.TopPanel;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import str_exporter.CustomTipsAPI;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.Locale;

public class TipsJSONBuilder extends JSONMessageBuilder {

    public static final Logger logger = LogManager.getLogger(TipsJSONBuilder.class.getName());
    private static final int MAX_RELICS = 25;
    private final ArrayList<String> powerTips;

    public TipsJSONBuilder(String login, String secret, String version) {
        super(login, secret, version, 1);
        powerTips = new ArrayList<>(40);
    }

    private static PowerTip createPowerTip(AbstractPower p) {
        PowerTip tip;
        if (p.region48 != null) {
            tip = new PowerTip(p.name, p.description, p.region48);
        } else {
            tip = new PowerTip(p.name, p.description);
        }

        String modName = WhatMod.findModName(p.getClass());

        if (WhatMod.enabled && modName != null) {
            tip.body = FontHelper.colorString(modName, "p") + " NL " + tip.body;
        }

        return tip;
    }

    // implemented like this to avoid dependency on StSLib
    private static boolean instanceOfInvisiblePower(AbstractPower p) {
        Class[] interfaces = p.getClass().getInterfaces();

        for (Class iface : interfaces) {
            if (iface.getCanonicalName().equals("com.evacipated.cardcrawl.mod.stslib.powers.interfaces.InvisiblePower"))
                return true;
        }

        return false;
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

    private static String powerTipJson(String header, String body) {
        return String.format(
                "%s;%s",
                sanitizeEmpty(sanitize(header)),
                sanitizeEmpty(sanitize(body))
        );
    }

    private static String powerTipJson(String header, String body, String img) {
        return String.format(
                "%s;%s;%s",
                sanitizeEmpty(sanitize(header)),
                sanitizeEmpty(sanitize(body)),
                sanitizeEmpty(sanitize(img))
        );
    }

    private static String sanitize(String str) {
        if (str == null)
            return "";

        str = str.replace("\"", "\\\"");
        str = str.replaceAll("\\[[A-Z]\\]", "[E]");

        return str;
    }

    private static String sanitizeColorCodes(String text) {
        text = text.replaceAll("\\[[a-zA-Z_]{2,}\\]", "");
        text = text.replaceAll("\\[#[A-Ea-e0-9]*\\]", "");
        text = text.replaceAll("\\[\\]", "");
        text = text.replaceAll("\\[\\[", "[");

        return text;
    }

    private static String sanitizeEmpty(String str) {
        return str.isEmpty() ? " " : str;
    }

    @Override
    public void buildMessage(StringBuilder sb) {

        powerTips.clear();

        String character = "";

        if (CardCrawlGame.isInARun() && CardCrawlGame.dungeon != null && AbstractDungeon.player != null) {
            character = AbstractDungeon.player.getClass().getSimpleName();
        }

        sb.append("{");
        sb.append("\"c\":\"" + character + "\","); // character

        sb.append("\"r\":"); // relics
        buildRelics(sb);
        sb.append(",");

        sb.append("\"o\":");
        buildPotions(sb);
        sb.append(",");

        if (isInCombat()) { // && (!AbstractDungeon.isScreenUp || PeekButton.isPeeking)
            sb.append("\"p\":");
            buildPlayerPowers(sb);
            sb.append(",");

            sb.append("\"m\":");
            buildMonsterPowers(sb);
            sb.append(",");
        }

        sb.append("\"u\":");
        buildCustomTips(sb);
        sb.append(",");

        sb.append("\"w\":");
        buildPowerTipsDictionary(sb);

        sb.append("}");
    }

    private void buildShop(StringBuilder sb) {
        ArrayList<StorePotion>
                potions =
                ReflectionHacks.getPrivate(AbstractDungeon.shopScreen,
                        AbstractDungeon.shopScreen.getClass(),
                        "potions");
        ArrayList<StoreRelic>
                relics =
                ReflectionHacks.getPrivate(AbstractDungeon.shopScreen,
                        AbstractDungeon.shopScreen.getClass(),
                        "relics");

        for (int i = 0; i < potions.size(); i++) {
            AbstractPotion potion = potions.get(i).potion;

            sb.append('[');
            buildHitbox(sb, potion.hb);
            sb.append(',');
            buildPowerTips(sb, potion.tips);
            sb.append(']');
            if (i < potions.size() - 1 || relics.size() > 0)
                sb.append(',');
        }

        for (int i = 0; i < relics.size(); i++) {
            AbstractRelic relic = relics.get(i).relic;

            sb.append('[');
            buildHitbox(sb, relic.hb);
            sb.append(',');
            buildPowerTips(sb, relic.tips);
            sb.append(']');
            if (i < relics.size() - 1)
                sb.append(',');
        }
    }

    private void buildBossRelics(StringBuilder sb) {
        ArrayList<AbstractRelic> relics = AbstractDungeon.bossRelicScreen.relics;

        for (int i = 0; i < relics.size(); i++) {
            AbstractRelic relic = relics.get(i);

            sb.append('[');
            buildHitbox(sb, relic.hb);
            sb.append(',');
            buildPowerTips(sb, relic.tips);
            sb.append(']');
            if (i < relics.size() - 1)
                sb.append(',');
        }
    }

    private void buildPlayerPowers(StringBuilder sb) {

        AbstractPlayer player = AbstractDungeon.player;

        float x = player.hb.x / Settings.WIDTH * 100f;
        float
                y =
                (Settings.HEIGHT - player.hb.y - player.hb.height) / Settings.HEIGHT * 100f; // invert the y-coordinate
        float w = player.hb.width / Settings.WIDTH * 100f;
        float h = (player.hb.height + player.healthHb.height) / Settings.HEIGHT * 100f;
        sb.append(String.format(Locale.US, "[%.2f,%.2f,%.2f,%.2f,", x, y, w, h));

        ArrayList<PowerTip> tipsPrefix = new ArrayList<>();
        if (!player.stance.ID.equals("Neutral")) {
            tipsPrefix.add(new PowerTip(player.stance.name, player.stance.description));
        }
        buildPowers(sb, player.powers, tipsPrefix);
        sb.append(']');
    }

    private void buildMonsterPowers(StringBuilder sb) {
        ArrayList<AbstractMonster> monsters = getMonsters();

        sb.append('[');
        for (int i = 0; i < monsters.size(); i++) {
            AbstractMonster monster = monsters.get(i);

            float x = monster.hb.x / Settings.WIDTH * 100f;
            float
                    y =
                    (Settings.HEIGHT - monster.hb.y - monster.hb.height) / Settings.HEIGHT *
                            100f; // invert the y-coordinate
            float w = monster.hb.width / Settings.WIDTH * 100f;
            float h = (monster.hb.height + monster.healthHb.height) / Settings.HEIGHT * 100f;
            sb.append(String.format(Locale.US, "[%.2f,%.2f,%.2f,%.2f,", x, y, w, h));

            ArrayList<PowerTip> tipsPrefix = new ArrayList<>();
            if (monster.intentAlphaTarget == 1.0F &&
                    !AbstractDungeon.player.hasRelic("Runic Dome") &&
                    monster.intent != AbstractMonster.Intent.NONE) {
                PowerTip intentTip = ReflectionHacks.getPrivate(monster, AbstractMonster.class, "intentTip");
                tipsPrefix.add(intentTip);
            }
            buildPowers(sb, monster.powers, tipsPrefix);
            sb.append(']');

            if (i < monsters.size() - 1)
                sb.append(",");
        }
        sb.append(']');
    }

    private float[] transformHitbox(Hitbox hb) {
        float x = hb.x / Settings.WIDTH * 100f;
        float y = (Settings.HEIGHT - hb.y - hb.height) / Settings.HEIGHT * 100f; // invert the y-coordinate
        float w = hb.width / Settings.WIDTH * 100f;
        float h = hb.height / Settings.HEIGHT * 100f;

        return new float[]{x, y, w, h};
    }

    private void buildHitbox(StringBuilder sb, Hitbox hb) {
        float[] coords = transformHitbox(hb);
        sb.append(String.format(Locale.US, "%.2f,%.2f,%.2f,%.2f", coords[0], coords[1], coords[2], coords[3]));
    }

    private void buildCustomTips(StringBuilder sb) {

        sb.append('[');

        if (isInCombat()) {
            boolean nonzeroOrbs = buildOrbTips(sb);
            buildCustomTipsFromApi(sb, nonzeroOrbs);
        } else if (isInAShop()) {
            buildShop(sb);
        } else if (isDisplayingBossRelics()) {
            buildBossRelics(sb);
        }

        sb.append(']');
    }

    private boolean buildOrbTips(StringBuilder sb) {

        ArrayList<AbstractOrb> orbs = AbstractDungeon.player.orbs;
        for (int i = 0; i < orbs.size(); i++) {
            AbstractOrb orb = orbs.get(i);

            sb.append('[');
            buildHitbox(sb, orb.hb);
            sb.append(',');

            ArrayList<PowerTip> tips = new ArrayList<>();
            tips.add(new PowerTip(orb.name, orb.description));
            buildPowerTips(sb, tips);
            sb.append(']');

            if (i < orbs.size() - 1)
                sb.append(",");
        }

        return orbs.size() > 0;
    }

    private void buildCustomTipsFromApi(StringBuilder sb, boolean nonzeroOrbs) {

        // try building custom tips
        StringBuilder sb_safe = new StringBuilder();
        String result = "";
        try {
            long start = System.currentTimeMillis();
            Object[] res = CustomTipsAPI.instance.getTipsFromMods();

            LinkedList<Hitbox> hitboxes = (LinkedList<Hitbox>) res[0];
            LinkedList<ArrayList<PowerTip>> tip_lists = (LinkedList<ArrayList<PowerTip>>) res[1];
            long end = System.currentTimeMillis();

//            logger.info("getTipsFromMods() took " + (end - start) + "ms");
//            logger.info("hitboxes size: " + hitboxes.size());

            Iterator<Hitbox> hb_iter = hitboxes.iterator();
            Iterator<ArrayList<PowerTip>> pt_iter = tip_lists.iterator();

            while (hb_iter.hasNext() && pt_iter.hasNext()) {
                Hitbox hb = hb_iter.next();
                ArrayList<PowerTip> tips = pt_iter.next();

                sb_safe.append('[');
                buildHitbox(sb_safe, hb);
                sb_safe.append(',');

                buildPowerTips(sb_safe, tips);
                sb_safe.append(']');

                if (hb_iter.hasNext() && pt_iter.hasNext())
                    sb_safe.append(",");
            }
            result = sb_safe.toString();
        } catch (Exception e) {
            logger.error("an exception occured during building hitboxes", e);
            result = "";
        } finally {
            if (nonzeroOrbs && !result.isEmpty())
                sb.append(",");

            sb.append(result);
        }
    }

    private void buildPowers(StringBuilder sb, ArrayList<AbstractPower> powers, ArrayList<PowerTip> tipsPrefix) {
        ArrayList<PowerTip> tips = (ArrayList<PowerTip>) tipsPrefix.clone();
        for (AbstractPower p : powers) {

            if (!instanceOfInvisiblePower(p)) // do not display powers that inherit InvisiblePower
                tips.add(createPowerTip(p));
        }

        buildPowerTips(sb, tips);
    }

    private void buildPowerTips(StringBuilder sb, ArrayList<PowerTip> tips) {
        sb.append('[');
        for (int i = 0; i < tips.size(); i++) {
            PowerTip tip = tips.get(i);
            sb.append(getPowerTipIndex(tip));

            if (i < tips.size() - 1)
                sb.append(",");
        }
        sb.append(']');
    }

    private void buildPotions(StringBuilder sb) {

        sb.append("[" + (int) (TopPanel.potionX / Settings.scale) + ",[");
        if (CardCrawlGame.isInARun() && CardCrawlGame.dungeon != null && AbstractDungeon.player != null) {
            ArrayList<AbstractPotion> potions = AbstractDungeon.player.potions;

            for (int i = 0; i < potions.size(); i++) {
                buildPowerTips(sb, potions.get(i).tips);

                if (i < potions.size() - 1)
                    sb.append(",");
            }
        }
        sb.append("]]");
    }

    private void buildRelics(StringBuilder sb) {
        int pageId = AbstractRelic.relicPage;
        ArrayList<AbstractRelic> relics = new ArrayList<>();

        if (CardCrawlGame.isInARun() && CardCrawlGame.dungeon != null && AbstractDungeon.player != null) {
            relics = AbstractDungeon.player.relics; // send over relics
        }

        int first_index = pageId * MAX_RELICS;
        int last_index = Math.min((pageId + 1) * MAX_RELICS, relics.size());

        sb.append("[" + ((relics.size() > MAX_RELICS) ? 1 : 0) + ",");
        sb.append("[");
        for (int i = first_index; i < last_index; i++) {
            buildPowerTips(sb, relics.get(i).tips);

            if (i < last_index - 1)
                sb.append(",");
        }
        sb.append("]]");
    }

    private void buildPowerTipsDictionary(StringBuilder sb) {
        StringBuilder sb2 = new StringBuilder();

        for (int i = 0; i < powerTips.size(); i++) {
            sb2.append(powerTips.get(i));

            if (i < powerTips.size() - 1)
                sb2.append(";;");
        }

        sb.append('"');
        sb.append(StringCompression.compress(sanitizeColorCodes(sb2.toString())));
        sb.append('"');
    }

    private int getPowerTipIndex(PowerTip tip) {
        String tipStr = "";
        if (tip.imgRegion != null && tip.imgRegion.name != null) {
            tipStr = powerTipJson(tip.header, tip.body, "powers/" + tip.imgRegion.name);
        } else if (tip.img != null) {
            tipStr = powerTipJson(tip.header, tip.body, getImageCode(tip.img));
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

    private boolean isInCombat() {
        return CardCrawlGame.isInARun() && CardCrawlGame.dungeon != null && AbstractDungeon.player != null &&
                AbstractDungeon.currMapNode != null &&
                AbstractDungeon.getCurrRoom().phase == AbstractRoom.RoomPhase.COMBAT;
    }

    private boolean isInAShop() {
        return CardCrawlGame.isInARun() && CardCrawlGame.dungeon != null && AbstractDungeon.player != null &&
                AbstractDungeon.currMapNode != null &&
                AbstractDungeon.currMapNode.room instanceof ShopRoom;
    }

    private boolean isDisplayingBossRelics() {
        return CardCrawlGame.isInARun() && CardCrawlGame.dungeon != null && AbstractDungeon.player != null &&
                AbstractDungeon.currMapNode != null &&
                AbstractDungeon.screen == AbstractDungeon.CurrentScreen.BOSS_REWARD;
    }

    private ArrayList<AbstractMonster> getMonsters() {
        ArrayList<AbstractMonster>
                monsters =
                (ArrayList<AbstractMonster>) AbstractDungeon.getMonsters().monsters.clone();
        monsters.removeIf(q -> q.isDying || q.isDeadOrEscaped());
        return monsters;
    }
}
