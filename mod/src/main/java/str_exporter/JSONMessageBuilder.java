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

        if (isInMonsterRoom()) {
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

    private void buildPowers(StringBuilder sb, ArrayList<AbstractPower> powers, ArrayList<PowerTip> tipsPrefix) {
        ArrayList<PowerTip> tips = (ArrayList<PowerTip>) tipsPrefix.clone();
        for (AbstractPower p: powers) {
            if (p.region48 != null) {
                tips.add(new PowerTip(p.name, p.description, p.region48));
            } else {
                tips.add(new PowerTip(p.name, p.description));
            }
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

    private boolean isInMonsterRoom() {
        return CardCrawlGame.isInARun() && CardCrawlGame.dungeon != null && CardCrawlGame.dungeon.player != null &&
                CardCrawlGame.dungeon.currMapNode != null && CardCrawlGame.dungeon.currMapNode.room instanceof MonsterRoom;
    }

    private ArrayList<AbstractMonster> getMonsters() {
        ArrayList<AbstractMonster> monsters = (ArrayList<AbstractMonster>) AbstractDungeon.getMonsters().monsters.clone();
        monsters.removeIf(q -> q.isDying || q.isDeadOrEscaped());
        return monsters;
    }
}
