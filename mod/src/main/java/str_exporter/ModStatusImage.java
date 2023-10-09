package str_exporter;

import basemod.IUIElement;
import com.badlogic.gdx.graphics.Texture;
import com.badlogic.gdx.graphics.g2d.SpriteBatch;
import com.megacrit.cardcrawl.core.Settings;
import com.megacrit.cardcrawl.helpers.Hitbox;
import com.megacrit.cardcrawl.helpers.ImageMaster;

import java.util.concurrent.atomic.AtomicBoolean;

public class ModStatusImage implements IUIElement {
    private final Hitbox hb;
    private final Texture greenTexture;
    private final Texture redTexture;
    private final Texture orangeTexture;
    private final float x;
    private final float y;
    private final float w;
    private final float h;
    private final AtomicBoolean healthy;
    private final AtomicBoolean inProgress;

    public ModStatusImage(float xPos, float yPos, AtomicBoolean healthy, AtomicBoolean inProgress) {
        this.greenTexture = ImageMaster.loadImage("SlayTheRelicsExporterResources/img/twitch_green-70.png");
        this.redTexture = ImageMaster.loadImage("SlayTheRelicsExporterResources/img/twitch_red-70.png");
        this.orangeTexture = ImageMaster.loadImage("SlayTheRelicsExporterResources/img/twitch_orange-70.png");
        this.x = xPos * Settings.scale;
        this.y = yPos * Settings.scale;
        this.w = (float) this.greenTexture.getWidth();
        this.h = (float) this.greenTexture.getHeight();
        this.hb =
                new Hitbox(this.x + Settings.scale,
                        this.y + Settings.scale,
                        (this.w - 2F) * Settings.scale,
                        (this.h - 2F) * Settings.scale);
        this.healthy = healthy;
        this.inProgress = inProgress;

    }

    @Override
    public void render(SpriteBatch sb) {
        if (this.inProgress.get()) {
            sb.draw(this.orangeTexture, this.x, this.y, this.w * Settings.scale, this.h * Settings.scale);
        } else if (this.healthy.get()) {
            sb.draw(this.greenTexture, this.x, this.y, this.w * Settings.scale, this.h * Settings.scale);
        } else {
            sb.draw(this.redTexture, this.x, this.y, this.w * Settings.scale, this.h * Settings.scale);
        }
        this.hb.render(sb);
    }

    @Override
    public void update() {
    }

    @Override
    public int renderLayer() {
        return 1;
    }

    @Override
    public int updateOrder() {
        return 1;
    }
}
