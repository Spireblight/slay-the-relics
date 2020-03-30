package str_exporter;

import basemod.ReflectionHacks;
import basemod.patches.whatmod.WhatMod;
import com.badlogic.gdx.graphics.Texture;
import com.evacipated.cardcrawl.modthespire.Loader;
import com.evacipated.cardcrawl.modthespire.ModInfo;
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
import com.megacrit.cardcrawl.ui.buttons.PeekButton;
import com.megacrit.cardcrawl.ui.panels.TopPanel;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Locale;

public class JSONMessageBuilder {

    private String login, secret, version;
    private ArrayList<String> powerTips;
    private static final int MAX_RELICS = 25;

    public static final Logger logger = LogManager.getLogger(JSONMessageBuilder.class.getName());

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

        sb.append("\"relics\": ");
        buildRelics(sb);
        sb.append(", ");

        sb.append("\"potions\": ");
        buildPotions(sb);
        sb.append(", ");

        if (isInCombat()) { // && (!AbstractDungeon.isScreenUp || PeekButton.isPeeking)
            sb.append("\"player_powers\": ");
            buildPlayerPowers(sb);
            sb.append(", ");

            sb.append("\"monster_powers\": ");
            buildMonsterPowers(sb);
            sb.append(", ");

            sb.append("\"custom_tips\": ");
            buildCustomTips(sb);
            sb.append(", ");
        }

        sb.append("\"power_tips\": ");
        buildPowerTips(sb);

        sb.append("}}");

        return sb.toString();
    }

    private void buildPlayerPowers(StringBuilder sb) {

        AbstractPlayer player = CardCrawlGame.dungeon.player;

        float x = player.hb.x / Settings.WIDTH * 100f;
        float y = (Settings.HEIGHT - player.hb.y - player.hb.height)  / Settings.HEIGHT* 100f; // invert the y-coordinate
        float w = player.hb.width / Settings.WIDTH * 100f;
        float h = (player.hb.height + player.healthHb.height)  / Settings.HEIGHT * 100f;
        sb.append(String.format(Locale.US, "{\"hitbox\": {\"x\": %.3f, \"y\": %.3f, \"w\": %.3f, \"h\": %.3f}, ", x, y, w, h));

        sb.append("\"power_tips\": ");
        ArrayList<PowerTip> tipsPrefix = new ArrayList<>();
        if (!player.stance.ID.equals("Neutral")) {
            tipsPrefix.add(new PowerTip(player.stance.name, player.stance.description));
        }
        buildPowers(sb, player.powers, tipsPrefix);
        sb.append('}');
    }

    private void buildMonsterPowers(StringBuilder sb) {
        ArrayList<AbstractMonster> monsters = getMonsters();

        sb.append('[');
        for (int i = 0; i < monsters.size(); i++) {
            AbstractMonster monster = monsters.get(i);

            float x = monster.hb.x / Settings.WIDTH * 100f;
            float y = (Settings.HEIGHT - monster.hb.y - monster.hb.height)  / Settings.HEIGHT* 100f; // invert the y-coordinate
            float w = monster.hb.width / Settings.WIDTH * 100f;
            float h = (monster.hb.height + monster.healthHb.height)  / Settings.HEIGHT * 100f;
            sb.append(String.format(Locale.US, "{\"hitbox\": {\"x\": %.3f, \"y\": %.3f, \"w\": %.3f, \"h\": %.3f}, ", x, y, w, h));

            sb.append("\"power_tips\": ");
            ArrayList<PowerTip> tipsPrefix = new ArrayList<>();
            if (monster.intentAlphaTarget == 1.0F && !AbstractDungeon.player.hasRelic("Runic Dome") && monster.intent != AbstractMonster.Intent.NONE) {
                PowerTip intentTip = (PowerTip) ReflectionHacks.getPrivate(monster, AbstractMonster.class, "intentTip");
                tipsPrefix.add(intentTip);
            }
            buildPowers(sb, monster.powers, tipsPrefix);
            sb.append('}');

            if (i < monsters.size() - 1)
                sb.append(", ");
        }
        sb.append(']');
    }

    private void buildCustomTips(StringBuilder sb) {

        sb.append('[');

        buildOrbTips(sb);

        // try building custom tips
        StringBuilder sb_safe = new StringBuilder();
        String result = "";
        try {
            Object[] res = getTipsFromMods();
            ArrayList<Hitbox> hitboxes = (ArrayList<Hitbox>) res[0];
            ArrayList<ArrayList<PowerTip>> tip_lists = (ArrayList<ArrayList<PowerTip>>) res[1];

            logger.info("hitboxes size: " + hitboxes.size());

            if (CardCrawlGame.dungeon.player.orbs.size() > 0 && hitboxes.size() > 0)
                sb_safe.append(", ");

            for (int i = 0; i < hitboxes.size(); i++) {

                Hitbox hb = hitboxes.get(i);
                ArrayList<PowerTip> tips = tip_lists.get(i);

                float x = hb.x / Settings.WIDTH * 100f;
                float y = (Settings.HEIGHT - hb.y - hb.height)  / Settings.HEIGHT* 100f; // invert the y-coordinate
                float w = hb.width / Settings.WIDTH * 100f;
                float h = hb.height  / Settings.HEIGHT * 100f;
                sb_safe.append(String.format(Locale.US, "{\"hitbox\": {\"x\": %.3f, \"y\": %.3f, \"w\": %.3f, \"h\": %.3f}, ", x, y, w, h));

                sb_safe.append("\"power_tips\": ");

                buildPowerTips(sb_safe, tips);
                sb_safe.append('}');

                if (i < hitboxes.size() - 1)
                    sb_safe.append(", ");
            }
            result = sb_safe.toString();
        } catch(Exception e) {
            logger.error("an exception occured during building hitboxes", e);
            result = "";
        } finally {
            sb.append(result);
        }

        sb.append(']');
    }

    private static ArrayList<ArrayList<PowerTip>> sanitizePowerTipsLists(ArrayList<ArrayList<PowerTip>> tip_lists) {
        ArrayList<ArrayList<PowerTip>> new_tip_lists = new ArrayList<>();

        for (int i = 0; i < tip_lists.size(); i++) {
            new_tip_lists.add(new ArrayList<>());
            for (int j = 0; j < tip_lists.get(i).size(); j++) {
                new_tip_lists.get(i).add(new PowerTip(tip_lists.get(i).get(j).header, tip_lists.get(i).get(j).body));
            }
        }

        return new_tip_lists;
    }

    private Object[] getTipsFromMods() {
        Object[] result = new Object[2];

        ArrayList<Hitbox> hitboxes = new ArrayList<>();
        ArrayList<ArrayList<PowerTip>> tip_lists = new ArrayList<>();

        ArrayList<Class<?>> classes = SlayTheRelicsExporter.instance.customTipImplementingClasses;

        for (int i = 0; i < classes.size(); i++) {
            Class<?> cls = classes.get(i);

            try {

                logger.info("class: " + cls.getCanonicalName());

                ArrayList<Hitbox> mod_hitboxes = (ArrayList<Hitbox>) cls.getField(SlayTheRelicsExporter.CUSTOM_TIP_HITBOX_NAME).get(null);
                ArrayList<ArrayList<PowerTip>> mod_tip_lists = (ArrayList<ArrayList<PowerTip>>) cls.getField(SlayTheRelicsExporter.CUSTOM_TIP_POWERTIPS_NAME).get(null);

                for (int j = 0; j < mod_hitboxes.size(); j++) {
                    Hitbox hb = mod_hitboxes.get(j);
                    logger.info(String.format("hitbox %d: %f %f %f %f", j, hb.x, hb.y, hb.width, hb.height));
                }

                for (int j = 0; j < mod_tip_lists.size(); j++) {
                    logger.info(String.format("tips list  %d", j));
                    for (int k = 0; k < mod_tip_lists.get(j).size(); k++) {
                        PowerTip tip = mod_tip_lists.get(j).get(k);
                        logger.info(String.format("tip %d: %s, %s", k, tip.header, tip.body));
                    }
                }

                if (mod_hitboxes.size() == mod_tip_lists.size()) {
                    logger.info("found fields, adding " + mod_hitboxes.size() + " entries");
                    hitboxes.addAll(mod_hitboxes);
                    tip_lists.addAll(sanitizePowerTipsLists(mod_tip_lists));
                } else {
                    logger.info("hitboxes and powertip list don't have the same size for class: " + cls.getCanonicalName());
                }

            } catch (NoSuchFieldException | IllegalAccessException e) {
                e.printStackTrace();
            }
        }

        result[0] = hitboxes;
        result[1] = tip_lists;
        return result;
    }

    private void buildOrbTips(StringBuilder sb) {
        ArrayList<AbstractOrb> orbs = CardCrawlGame.dungeon.player.orbs;
        for (int i = 0; i < orbs.size(); i++) {
            AbstractOrb orb = orbs.get(i);

            float x = orb.hb.x / Settings.WIDTH * 100f;
            float y = (Settings.HEIGHT - orb.hb.y - orb.hb.height)  / Settings.HEIGHT* 100f; // invert the y-coordinate
            float w = orb.hb.width / Settings.WIDTH * 100f;
            float h = orb.hb.height  / Settings.HEIGHT * 100f;
            sb.append(String.format(Locale.US, "{\"hitbox\": {\"x\": %.3f, \"y\": %.3f, \"w\": %.3f, \"h\": %.3f}, ", x, y, w, h));

            sb.append("\"power_tips\": ");
            ArrayList<PowerTip> tips = new ArrayList<>();
            tips.add(new PowerTip(orb.name, orb.description));
            buildPowerTips(sb, tips);
            sb.append('}');

            if (i < orbs.size() - 1)
                sb.append(", ");
        }
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

    private void buildPowers(StringBuilder sb, ArrayList<AbstractPower> powers, ArrayList<PowerTip> tipsPrefix) {
        ArrayList<PowerTip> tips = (ArrayList<PowerTip>) tipsPrefix.clone();
        for (AbstractPower p: powers) {

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
                sb.append(", ");
        }
        sb.append(']');
    }

    private void buildPotions(StringBuilder sb) {

        sb.append("{\"potion_x\": " + (int) (TopPanel.potionX / Settings.scale) + ", \"items\": [");
        if (CardCrawlGame.isInARun() && CardCrawlGame.dungeon != null && CardCrawlGame.dungeon.player != null) {
            ArrayList<AbstractPotion> potions = CardCrawlGame.dungeon.player.potions;

            for (int i = 0; i < potions.size(); i++) {
                buildPotion(sb, potions.get(i));

                if (i < potions.size() - 1)
                    sb.append(", ");
            }
        }
        sb.append("]}");
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
            sb.append(powerTips.get(i));

            if (i < powerTips.size() - 1)
                sb.append(", ");
        }
        sb.append(']');
    }

    private int getPowerTipIndex(PowerTip tip) {
        String tipStr = "";
        if (tip.imgRegion != null && tip.imgRegion.name != null) {
            tipStr = powerTipJson(tip.header, tip.body, "powers/" + tip.imgRegion.name);
        } else if(tip.img != null) {
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
        if (str == null)
            return "";

        str = str.replace("\"", "\\\"");
//        str = str.replace("[R]", "[E]");
//        str = str.replace("[G]", "[E]");
//        str = str.replace("[B]", "[E]");
//        str = str.replace("[W]", "[E]");
        str = str.replaceAll("\\[[A-Z]\\]", "[E]");
        str = str.replace("NL", "<br>");

        return str;
    }

    private boolean isInCombat() {
        return CardCrawlGame.isInARun() && CardCrawlGame.dungeon != null && CardCrawlGame.dungeon.player != null &&
                CardCrawlGame.dungeon.currMapNode != null &&
                CardCrawlGame.dungeon.getCurrRoom().phase == AbstractRoom.RoomPhase.COMBAT;
    }

    private ArrayList<AbstractMonster> getMonsters() {
        ArrayList<AbstractMonster> monsters = (ArrayList<AbstractMonster>) AbstractDungeon.getMonsters().monsters.clone();
        monsters.removeIf(q -> q.isDying || q.isDeadOrEscaped());
        return monsters;
    }
}
