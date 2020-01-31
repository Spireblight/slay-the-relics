//
// Source code recreated from a .class file by IntelliJ IDEA
// (powered by Fernflower decompiler)
//

package str_exporter;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.InputProcessor;
import com.badlogic.gdx.Input.Keys;
import com.megacrit.cardcrawl.core.Settings;
import com.megacrit.cardcrawl.helpers.FontHelper;

class ModTextPanelInputHelper implements InputProcessor {
    ModTextPanelInputHelper() {
    }

    public boolean keyDown(int keycode) {
        System.out.println("keydown and key was " + keycode);
        String tmp = Keys.toString(keycode);
        if (tmp.equals("Space") && tmp.length() != 0) {
            ModTextPanel.textField = ModTextPanel.textField + ' ';
            return false;
        } else if (tmp.length() != 1) {
            return false;
        } else if (FontHelper.getSmartWidth(FontHelper.cardTitleFont_small, ModTextPanel.textField, 1.0E7F, 0.0F) >= 240.0F * Settings.scale) {
            return false;
        } else {
            if (!Gdx.input.isKeyPressed(59) && !Gdx.input.isKeyPressed(60)) {
                tmp = tmp.toLowerCase();
            }

            char tmp2 = tmp.charAt(0);
            if (Character.isDigit(tmp2) || Character.isLetter(tmp2)) {
                ModTextPanel.textField = ModTextPanel.textField + tmp2;
            }

            return true;
        }
    }

    public boolean keyTyped(char arg0) {
        return false;
    }

    public boolean keyUp(int arg0) {
        return false;
    }

    public boolean mouseMoved(int arg0, int arg1) {
        return false;
    }

    public boolean scrolled(int arg0) {
        return false;
    }

    public boolean touchDown(int arg0, int arg1, int arg2, int arg3) {
        return false;
    }

    public boolean touchDragged(int arg0, int arg1, int arg2) {
        return false;
    }

    public boolean touchUp(int arg0, int arg1, int arg2, int arg3) {
        return false;
    }
}
