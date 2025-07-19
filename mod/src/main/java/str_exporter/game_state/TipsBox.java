package str_exporter.game_state;

import basemod.ReflectionHacks;
import com.megacrit.cardcrawl.core.Settings;
import com.megacrit.cardcrawl.dungeons.AbstractDungeon;
import com.megacrit.cardcrawl.helpers.Hitbox;
import com.megacrit.cardcrawl.helpers.PowerTip;
import com.megacrit.cardcrawl.monsters.AbstractMonster;
import com.megacrit.cardcrawl.powers.AbstractPower;
import com.megacrit.cardcrawl.rooms.AbstractRoom;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class TipsBox {
    public final List<Tip> tips;
    public final HitBox hitbox;

    public TipsBox(List<Tip> tips, HitBox hitbox) {
        this.tips = tips;
        this.hitbox = hitbox;
    }

    public static boolean isInCombat() {
        AbstractRoom room = AbstractDungeon.getCurrRoom();
        return room != null && room.phase == AbstractRoom.RoomPhase.COMBAT;
    }

    public static List<TipsBox> allTips() {
        ArrayList<TipsBox> tips = new ArrayList<>();

        if (isInCombat()) {
            TipsBox player = playerTipsBox();
            tips.add(player);
            getMonsters().forEach(monster -> {
                tips.add(monsterTipsBox(monster));
            });
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
        return new Tip(power.name, power.description, "");
    }


    private static HitBox buildHitbox(Hitbox hb) {
        float x = hb.x / Settings.WIDTH * 100f;
        float y = (Settings.HEIGHT - hb.y - hb.height) / Settings.HEIGHT * 100f; // invert the y-coordinate
        float w = hb.width / Settings.WIDTH * 100f;
        float h = hb.height / Settings.HEIGHT * 100f;
        return new HitBox(x, y, w, h);
    }

    private static TipsBox monsterTipsBox(AbstractMonster monster) {
        ArrayList<Tip> tips = new ArrayList<>();
        HitBox box = buildHitbox(monster.hb);

        if (monster.intentAlphaTarget == 1.0F &&
                !AbstractDungeon.player.hasRelic("Runic Dome") &&
                monster.intent != AbstractMonster.Intent.NONE) {
            PowerTip intentTip = ReflectionHacks.getPrivate(monster, AbstractMonster.class, "intentTip");

            Tip tip = new Tip(
                    intentTip.header,
                    intentTip.body
            );
            tips.add(tip);
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
        return AbstractDungeon.getMonsters().monsters.stream().filter(
                m -> !m.isDying && !m.isDeadOrEscaped()
        ).collect(Collectors.toList());
    }
}
