//
// Source code recreated from a .class file by IntelliJ IDEA
// (powered by Fernflower decompiler)
//

package str_exporter;

import basemod.IUIElement;
import basemod.ModButton;
import basemod.ModPanel;
import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.Texture;
import com.badlogic.gdx.graphics.g2d.BitmapFont;
import com.badlogic.gdx.graphics.g2d.SpriteBatch;
import com.megacrit.cardcrawl.core.CardCrawlGame;
import com.megacrit.cardcrawl.core.Settings;
import com.megacrit.cardcrawl.helpers.FontHelper;
import com.megacrit.cardcrawl.helpers.Hitbox;
import com.megacrit.cardcrawl.helpers.ImageMaster;
import com.megacrit.cardcrawl.helpers.input.InputHelper;
import java.util.function.Consumer;

public class ModLabelButton implements IUIElement {
    private static final float HB_SHRINK = 14.0F;
    private Consumer<ModLabelButton> click;
    private Hitbox hb;
    private Texture texture;
    private float x;
    private float y;
    private float w;
    private float h;
    private String label;
    public ModPanel parent;
    public Color color, colorHover;
    public BitmapFont font;

    public ModLabelButton(String label, float xPos, float yPos, ModPanel p, Consumer<ModLabelButton> c) {
        this.label = label;
        this.texture = ImageMaster.loadImage("SlayTheRelicsExporterResources/img/Button.png");
        this.x = xPos * Settings.scale;
        this.y = yPos * Settings.scale;
        this.w = (float)this.texture.getWidth();
        this.h = (float)this.texture.getHeight();
        this.hb = new Hitbox(this.x + 1F * Settings.scale, this.y + 1F * Settings.scale, (this.w - 2F) * Settings.scale, (this.h - 2F) * Settings.scale);
        this.parent = p;
        this.click = c;
        this.font = FontHelper.buttonLabelFont;
        this.color = Color.WHITE;
        this.colorHover = Color.GREEN;
    }

    public void render(SpriteBatch sb) {
        sb.setColor(Color.WHITE);
        sb.draw(this.texture, this.x, this.y, this.w * Settings.scale, this.h * Settings.scale);
        this.hb.render(sb);

        if (this.hb.hovered)
            FontHelper.renderFontCentered(sb, this.font, this.label, this.hb.cX, this.hb.cY, this.colorHover );
        else
            FontHelper.renderFontCentered(sb, this.font, this.label, this.hb.cX, this.hb.cY, this.color);
    }

    public void update() {
        this.hb.update();
        if (this.hb.justHovered) {
            CardCrawlGame.sound.playV("UI_HOVER", 0.75F);
        }

        if (this.hb.hovered && InputHelper.justClickedLeft) {
            CardCrawlGame.sound.playA("UI_CLICK_1", -0.1F);
            this.hb.clickStarted = true;
        }

        if (this.hb.clicked) {
            this.hb.clicked = false;
            this.onClick();
        }
    }

    private void onClick() {
        this.click.accept(this);
    }

    public int renderLayer() {
        return 1;
    }

    public int updateOrder() {
        return 1;
    }
}
