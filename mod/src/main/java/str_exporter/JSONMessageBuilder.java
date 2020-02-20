package str_exporter;

import basemod.ReflectionHacks;
import basemod.patches.whatmod.WhatMod;
import com.badlogic.gdx.graphics.Texture;
import com.megacrit.cardcrawl.characters.AbstractPlayer;
import com.megacrit.cardcrawl.core.CardCrawlGame;
import com.megacrit.cardcrawl.core.Settings;
import com.megacrit.cardcrawl.dungeons.AbstractDungeon;
import com.megacrit.cardcrawl.helpers.FontHelper;
import com.megacrit.cardcrawl.helpers.ImageMaster;
import com.megacrit.cardcrawl.helpers.PowerTip;
import com.megacrit.cardcrawl.monsters.AbstractMonster;
import com.megacrit.cardcrawl.potions.AbstractPotion;
import com.megacrit.cardcrawl.powers.AbstractPower;
import com.megacrit.cardcrawl.relics.AbstractRelic;
import com.megacrit.cardcrawl.rooms.AbstractRoom;
import com.megacrit.cardcrawl.rooms.MonsterRoom;
import com.megacrit.cardcrawl.ui.panels.TopPanel;

import java.util.ArrayList;
import java.util.Locale;

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

        sb.append("\"relics\": ");
        buildRelics(sb);
        sb.append(", ");

        sb.append("\"potions\": ");
        buildPotions(sb);
        sb.append(", ");

        if (isInCombat()) {
            sb.append("\"player_powers\": ");
            buildPlayerPowers(sb);
            sb.append(", ");

            sb.append("\"monster_powers\": ");
            buildMonsterPowers(sb);
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
        sb.append(String.format(Locale.US, "{\"hitbox\": {\"x\": %f, \"y\": %f, \"w\": %f, \"h\": %f}, ", x, y, w, h));

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
            sb.append(String.format(Locale.US, "{\"hitbox\": {\"x\": %f, \"y\": %f, \"w\": %f, \"h\": %f}, ", x, y, w, h));

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

    private void buildPowers(StringBuilder sb, ArrayList<AbstractPower> powers, ArrayList<PowerTip> tipsPrefix) {
        ArrayList<PowerTip> tips = (ArrayList<PowerTip>) tipsPrefix.clone();
        for (AbstractPower p: powers) {
            tips.add(createPowerTip(p));
        }

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
        str = str.replace("[R]", "[E]");
        str = str.replace("[G]", "[E]");
        str = str.replace("[B]", "[E]");
        str = str.replace("[W]", "[E]");
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
