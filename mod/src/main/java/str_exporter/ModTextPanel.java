//
// Source code recreated from a .class file by IntelliJ IDEA
// (powered by Fernflower decompiler)
//

package str_exporter;

import basemod.BaseMod;
import basemod.ModPanel;
import basemod.interfaces.PostUpdateSubscriber;
import basemod.interfaces.RenderSubscriber;
import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.InputProcessor;
import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.g2d.SpriteBatch;
import com.badlogic.gdx.math.Interpolation;
import com.badlogic.gdx.math.MathUtils;
import com.megacrit.cardcrawl.core.CardCrawlGame;
import com.megacrit.cardcrawl.core.Settings;
import com.megacrit.cardcrawl.helpers.FontHelper;
import com.megacrit.cardcrawl.helpers.Hitbox;
import com.megacrit.cardcrawl.helpers.ImageMaster;
import com.megacrit.cardcrawl.helpers.input.InputHelper;
import com.megacrit.cardcrawl.screens.mainMenu.MainMenuScreen.CurScreen;
import java.util.function.Consumer;

public class ModTextPanel implements RenderSubscriber, PostUpdateSubscriber {
    private String prevName = "";
    public static String textField;
    public Hitbox yesHb = null;
    public Hitbox noHb = null;
    public Consumer<ModTextPanel> confirm = null;
    public Consumer<ModTextPanel> cancel = null;
    public String defaultName;
    public String explanationText;
    public static final String CANCEL_TEXT = "Cancel";
    public static final String CONFIRM_TEXT = "Confirm";
    private static final int CONFIRM_W = 360;
    private static final int CONFIRM_H = 414;
    private static final int YES_W = 173;
    private static final int NO_W = 161;
    private static final int BUTTON_H = 74;
    private Color screenColor = new Color(0.0F, 0.0F, 0.0F, 0.0F);
    private Color uiColor = new Color(1.0F, 1.0F, 1.0F, 0.0F);
    private float animTimer = 0.0F;
    private float waitTimer = 0.0F;
    private static final float ANIM_TIME = 0.25F;
    public boolean shown = false;
    private static final float SCREEN_DARKNESS = 0.75F;
    private InputProcessor oldInputProcessor;
    private ModPanel panel;

    public ModTextPanel() {
        BaseMod.subscribe(this);
    }

    public void receivePostUpdate() {
        if (this.shown) {
            if (Gdx.input.isKeyPressed(67) && !textField.equals("") && this.waitTimer <= 0.0F) {
                textField = textField.substring(0, textField.length() - 1);
                this.waitTimer = 0.09F;
            }

            if (this.waitTimer > 0.0F) {
                this.waitTimer -= Gdx.graphics.getDeltaTime();
            }

            if (this.shown) {
                if (this.animTimer != 0.0F) {
                    this.animTimer -= Gdx.graphics.getDeltaTime();
                    if (this.animTimer < 0.0F) {
                        this.animTimer = 0.0F;
                    }

                    this.screenColor.a = Interpolation.fade.apply(0.75F, 0.0F, this.animTimer * 1.0F / 0.25F);
                    this.uiColor.a = Interpolation.fade.apply(1.0F, 0.0F, this.animTimer * 1.0F / 0.25F);
                } else {
                    this.updateYes();
                    this.updateNo();
                    if (Gdx.input.isKeyJustPressed(66)) {
                        this.confirm();
                    } else if (InputHelper.pressedEscape) {
                        InputHelper.pressedEscape = false;
                        this.cancel();
                    }
                }
            } else if (this.animTimer != 0.0F) {
                this.animTimer -= Gdx.graphics.getDeltaTime();
                if (this.animTimer < 0.0F) {
                    this.animTimer = 0.0F;
                }

                this.screenColor.a = Interpolation.fade.apply(0.0F, 0.75F, this.animTimer * 1.0F / 0.25F);
                this.uiColor.a = Interpolation.fade.apply(0.0F, 1.0F, this.animTimer * 1.0F / 0.25F);
            }

        }
    }

    private void updateYes() {
        this.yesHb.update();
        if (this.yesHb.justHovered) {
            CardCrawlGame.sound.play("UI_HOVER");
        }

        if (InputHelper.justClickedLeft && this.yesHb.hovered) {
            CardCrawlGame.sound.play("UI_CLICK_1");
            this.yesHb.clickStarted = true;
        }

        if (this.yesHb.clicked) {
            this.yesHb.clicked = false;
            this.confirm();
        }

    }

    private void updateNo() {
        this.noHb.update();
        if (this.noHb.justHovered) {
            CardCrawlGame.sound.play("UI_HOVER");
        }

        if (InputHelper.justClickedLeft && this.noHb.hovered) {
            CardCrawlGame.sound.play("UI_CLICK_1");
            this.noHb.clickStarted = true;
        }

        if (this.noHb.clicked) {
            this.noHb.clicked = false;
            this.cancel();
        }

    }

    public void show(ModPanel panel, String curName, String defaultValue, String explanationText, Consumer<ModTextPanel> cancel, Consumer<ModTextPanel> confirm) {
        this.panel = panel;
        panel.isUp = false;
        this.oldInputProcessor = Gdx.input.getInputProcessor();
        Gdx.input.setInputProcessor(new ModTextPanelInputHelper());
        System.out.println("setting new input processor");
        if (this.yesHb == null) {
            this.yesHb = new Hitbox(160.0F * Settings.scale, 70.0F * Settings.scale);
        }

        if (this.noHb == null) {
            this.noHb = new Hitbox(160.0F * Settings.scale, 70.0F * Settings.scale);
        }

        this.yesHb.move(860.0F * Settings.scale, Settings.OPTION_Y - 118.0F * Settings.scale);
        this.noHb.move(1062.0F * Settings.scale, Settings.OPTION_Y - 118.0F * Settings.scale);
        this.shown = true;
        this.animTimer = 0.25F;
        textField = curName;
        this.prevName = curName;
        this.cancel = cancel;
        this.confirm = confirm;
        this.defaultName = defaultValue;
        this.explanationText = explanationText;
    }

    private void removeListeners() {
        this.confirm = null;
        this.cancel = null;
    }

    private void resetToSettings() {
        this.panel.isUp = true;
        CardCrawlGame.mainMenuScreen.darken();
        CardCrawlGame.mainMenuScreen.hideMenuButtons();
        CardCrawlGame.mainMenuScreen.screen = CurScreen.SETTINGS;
        CardCrawlGame.cancelButton.show("Close");
    }

    public void confirm() {
        textField = textField.trim();
        if (textField.equals("")) {
            textField = this.defaultName;
        }

        this.confirm.accept(this);
        this.removeListeners();
        this.resetToSettings();
        this.yesHb.move(-1000.0F, -1000.0F);
        this.noHb.move(-1000.0F, -1000.0F);
        this.shown = false;
        this.animTimer = 0.25F;
        Gdx.input.setInputProcessor(this.oldInputProcessor);
    }

    public void cancel() {
        textField = this.prevName;
        if (textField.equals("")) {
            textField = this.defaultName;
        }

        this.cancel.accept(this);
        this.removeListeners();
        this.resetToSettings();
        this.yesHb.move(-1000.0F, -1000.0F);
        this.noHb.move(-1000.0F, -1000.0F);
        this.shown = false;
        this.animTimer = 0.25F;
        Gdx.input.setInputProcessor(this.oldInputProcessor);
    }

    public void receiveRender(SpriteBatch sb) {
        if (this.shown) {
            sb.setColor(this.screenColor);
            sb.draw(ImageMaster.WHITE_SQUARE_IMG, 0.0F, 0.0F, (float)Settings.WIDTH, (float)Settings.HEIGHT);
            sb.setColor(this.uiColor);
            sb.draw(ImageMaster.OPTION_CONFIRM, (float)Settings.WIDTH / 2.0F - 180.0F, Settings.OPTION_Y - 207.0F, 180.0F, 207.0F, 360.0F, 414.0F, Settings.scale, Settings.scale, 0.0F, 0, 0, 360, 414, false, false);
            sb.draw(ImageMaster.RENAME_BOX, (float)Settings.WIDTH / 2.0F - 160.0F, Settings.OPTION_Y - 160.0F, 160.0F, 160.0F, 320.0F, 320.0F, Settings.scale, Settings.scale, 0.0F, 0, 0, 320, 320, false, false);
            FontHelper.renderSmartText(sb, FontHelper.cardTitleFont_small, textField, (float)Settings.WIDTH / 2.0F - 120.0F * Settings.scale, Settings.OPTION_Y + 4.0F * Settings.scale, 100000.0F, 0.0F, this.uiColor);
            float tmpAlpha = (MathUtils.cosDeg((float)(System.currentTimeMillis() / 3L % 360L)) + 1.25F) / 3.0F * this.uiColor.a;
            FontHelper.renderSmartText(sb, FontHelper.cardTitleFont_small, "_", (float)Settings.WIDTH / 2.0F - 122.0F * Settings.scale + FontHelper.getSmartWidth(FontHelper.cardTitleFont_small, textField, 1000000.0F, 0.0F), Settings.OPTION_Y + 4.0F * Settings.scale, 100000.0F, 0.0F, new Color(1.0F, 1.0F, 1.0F, tmpAlpha));
            Color c = Settings.GOLD_COLOR.cpy();
            c.a = this.uiColor.a;
            FontHelper.renderFontCentered(sb, FontHelper.cardTitleFont, this.explanationText, (float)Settings.WIDTH / 2.0F, Settings.OPTION_Y + 126.0F * Settings.scale, c);
            if (this.yesHb.clickStarted) {
                sb.setColor(new Color(1.0F, 1.0F, 1.0F, this.uiColor.a * 0.9F));
                sb.draw(ImageMaster.OPTION_YES, (float)Settings.WIDTH / 2.0F - 86.5F - 100.0F * Settings.scale, Settings.OPTION_Y - 37.0F - 120.0F * Settings.scale, 86.5F, 37.0F, 173.0F, 74.0F, Settings.scale, Settings.scale, 0.0F, 0, 0, 173, 74, false, false);
                sb.setColor(new Color(this.uiColor));
            } else {
                sb.draw(ImageMaster.OPTION_YES, (float)Settings.WIDTH / 2.0F - 86.5F - 100.0F * Settings.scale, Settings.OPTION_Y - 37.0F - 120.0F * Settings.scale, 86.5F, 37.0F, 173.0F, 74.0F, Settings.scale, Settings.scale, 0.0F, 0, 0, 173, 74, false, false);
            }

            if (!this.yesHb.clickStarted && this.yesHb.hovered) {
                sb.setColor(new Color(1.0F, 1.0F, 1.0F, this.uiColor.a * 0.25F));
                sb.setBlendFunction(770, 1);
                sb.draw(ImageMaster.OPTION_YES, (float)Settings.WIDTH / 2.0F - 86.5F - 100.0F * Settings.scale, Settings.OPTION_Y - 37.0F - 120.0F * Settings.scale, 86.5F, 37.0F, 173.0F, 74.0F, Settings.scale, Settings.scale, 0.0F, 0, 0, 173, 74, false, false);
                sb.setBlendFunction(770, 771);
                sb.setColor(this.uiColor);
            }

            if (this.yesHb.clickStarted) {
                c = Color.LIGHT_GRAY.cpy();
            } else if (this.yesHb.hovered) {
                c = Settings.CREAM_COLOR.cpy();
            } else {
                c = Settings.GOLD_COLOR.cpy();
            }

            c.a = this.uiColor.a;
            FontHelper.renderFontCentered(sb, FontHelper.cardTitleFont_small, "Confirm", (float)Settings.WIDTH / 2.0F - 110.0F * Settings.scale, Settings.OPTION_Y - 118.0F * Settings.scale, c, 1.0F);
            sb.draw(ImageMaster.OPTION_NO, (float)Settings.WIDTH / 2.0F - 80.5F + 106.0F * Settings.scale, Settings.OPTION_Y - 37.0F - 120.0F * Settings.scale, 80.5F, 37.0F, 161.0F, 74.0F, Settings.scale, Settings.scale, 0.0F, 0, 0, 161, 74, false, false);
            if (!this.noHb.clickStarted && this.noHb.hovered) {
                sb.setColor(new Color(1.0F, 1.0F, 1.0F, this.uiColor.a * 0.25F));
                sb.setBlendFunction(770, 1);
                sb.draw(ImageMaster.OPTION_NO, (float)Settings.WIDTH / 2.0F - 80.5F + 106.0F * Settings.scale, Settings.OPTION_Y - 37.0F - 120.0F * Settings.scale, 80.5F, 37.0F, 161.0F, 74.0F, Settings.scale, Settings.scale, 0.0F, 0, 0, 161, 74, false, false);
                sb.setBlendFunction(770, 771);
                sb.setColor(this.uiColor);
            }

            if (this.noHb.clickStarted) {
                c = Color.LIGHT_GRAY.cpy();
            } else if (this.noHb.hovered) {
                c = Settings.CREAM_COLOR.cpy();
            } else {
                c = Settings.GOLD_COLOR.cpy();
            }

            c.a = this.uiColor.a;
            FontHelper.renderFontCentered(sb, FontHelper.cardTitleFont_small, "Cancel", (float)Settings.WIDTH / 2.0F + 110.0F * Settings.scale, Settings.OPTION_Y - 118.0F * Settings.scale, c, 1.0F);
            if (this.shown) {
                this.yesHb.render(sb);
                this.noHb.render(sb);
            }

        }
    }
}
