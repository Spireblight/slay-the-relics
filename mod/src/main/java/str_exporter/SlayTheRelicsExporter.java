package str_exporter;

//import basemod.*;
import basemod.BaseMod;
import basemod.ModButton;
import basemod.ModPanel;
import basemod.interfaces.*;
import com.badlogic.gdx.Gdx;
import com.evacipated.cardcrawl.modthespire.lib.SpireConfig;
import com.evacipated.cardcrawl.modthespire.lib.SpireInitializer;
import com.megacrit.cardcrawl.characters.AbstractPlayer;
import com.megacrit.cardcrawl.core.CardCrawlGame;
import com.megacrit.cardcrawl.core.Settings;
import com.megacrit.cardcrawl.helpers.FontHelper;
import com.megacrit.cardcrawl.helpers.ImageMaster;
import com.megacrit.cardcrawl.helpers.input.InputHelper;
import com.megacrit.cardcrawl.relics.AbstractRelic;
import com.sun.org.apache.xpath.internal.operations.Mod;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Properties;

@SpireInitializer
public class SlayTheRelicsExporter implements
        RelicGetSubscriber,
        StartGameSubscriber,
        PostCreateStartingRelicsSubscriber,
        PostInitializeSubscriber,
        PostUpdateSubscriber
{

    private static final String CONF_LOGIN = "Streamer Login";
    private static final String CONF_SECRET = "Streamer Secret (generated on twitch.tv on the StR config page)";

    public static final Logger logger = LogManager.getLogger(SlayTheRelicsExporter.class.getName());

    private static SpireConfig modConfig = null;

    public SlayTheRelicsExporter()
    {
        logger.info("Slay The Relics Exporter initialized!");
        BaseMod.subscribe(this);
        // TODO: make an awesome mod!
    }

    public static void initialize()
    {
        logger.info("initialize() called!");
        new SlayTheRelicsExporter();

        try {
            Properties defaults = new Properties();
            defaults.put(CONF_LOGIN, "");
            defaults.put(CONF_SECRET, "");
            modConfig = new SpireConfig("SlayTheRelicsExporter", "Config", defaults);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void receiveRelicGet(AbstractRelic abstractRelic) {
        logger.info("Relic Acquired");
        check();
    }

    @Override
    public void receiveStartGame() {
        logger.info("Start Game received");
        check();
    }

    @Override
    public void receivePostCreateStartingRelics(AbstractPlayer.PlayerClass playerClass, ArrayList<String> arrayList) {
        check();
    }

    private void check() {
        checkIfRunInProgress();
        checkRelics();
        logger.info("login: " + modConfig.getString(CONF_LOGIN));
        logger.info("secret: " + modConfig.getString(CONF_SECRET));
    }

    private void checkRelics() {

        if (CardCrawlGame.dungeon == null) {
            logger.info("dungeon == null");
            return;
        }

        if (CardCrawlGame.dungeon.player == null) {
            logger.info("dungeon.player == null");
            return;
        }

        ArrayList<AbstractRelic> relics = CardCrawlGame.dungeon.player.relics;

        for (AbstractRelic relic : relics) {
            logger.info(relic.name + ": " + relic.description);
        }
    }

    private void checkIfRunInProgress() {
        if (CardCrawlGame.isInARun()) {
            logger.info("Run in progress");
        } else {
            logger.info("Run not in progress");
        }
    }

    private static String getLogin() {
        if (modConfig == null) {
            return "";
        }

        return modConfig.getString(CONF_LOGIN);
    }

    private static String getSecret() {
        if (modConfig == null) {
            return "";
        }

        return modConfig.getString(CONF_SECRET);
    }

    private ModTextPanel loginText;

    @Override
    public void receivePostInitialize() {
        logger.info("Minty Spire is active.");

//        UIStrings UIStrings = CardCrawlGame.languagePack.getUIString("SlayTheRelicsExporter: OptionsMenu");
//        String[] TEXT = UIStrings.TEXT;
        String[] TEXT = {"text1", "hello", "there", "how", "are", "you", "doing"};

        int xPos = 350, yPos = 700;
        ModPanel settingsPanel = new ModPanel();
        loginText = new ModTextPanel();

        ModButton setLoginBtn = new ModButton(xPos, yPos, settingsPanel, button -> {
            if (modConfig != null) {
                loginText.show(
                        settingsPanel,
                        modConfig.getString(CONF_LOGIN),
                        "",
                        "Enter your twitch login (that's the one found in the URL of your stream twitch.tv/yourlogin)",
                        textPanel -> {},
                        textPanel -> {
                            Gdx.input.getInputProcessor();
                            modConfig.setString(CONF_LOGIN, ModTextPanel.textField);
                            logger.info("Input text field: " + ModTextPanel.textField);
//                            textPanel.confirm();
                        });
            }
        });
        settingsPanel.addUIElement(setLoginBtn);

//        settingsPanel.addUIElement();

//
//        ModLabeledToggleButton HHBtn = new ModLabeledToggleButton(TEXT[0], xPos, yPos, Settings.CREAM_COLOR, FontHelper.charDescFont, true, settingsPanel, l -> {
//        },
//                button ->
//                {
//                    if (modConfig != null) {
//                        modConfig.setBool("ShowHalfHealth", button.enabled);
//                        try {
//                            modConfig.save();
//                        } catch (IOException e) {
//                            e.printStackTrace();
//                        }
//                    }
//                });
//        settingsPanel.addUIElement(HHBtn);
//        yPos -= 50;
//
//        ModLabeledToggleButton BNBtn = new ModLabeledToggleButton(TEXT[1], xPos, yPos, Settings.CREAM_COLOR, FontHelper.charDescFont, true, settingsPanel, l -> {
//        },
//                button ->
//                {
//                    if (modConfig != null) {
//                        modConfig.setBool("ShowBossName", button.enabled);
//                        try {
//                            modConfig.save();
//                        } catch (IOException e) {
//                            e.printStackTrace();
//                        }
//                    }
//                });
//        settingsPanel.addUIElement(BNBtn);
//        yPos -= 50;
//
//        if (Settings.language == Settings.GameLanguage.ENG) {
//            ModLabeledToggleButton ICBtn = new ModLabeledToggleButton(TEXT[2], xPos, yPos, Settings.CREAM_COLOR, FontHelper.charDescFont, true, settingsPanel, l -> {
//            },
//                    button ->
//                    {
//                        if (modConfig != null) {
//                            modConfig.setBool("Ironchad", button.enabled);
//                            try {
//                                modConfig.save();
//                            } catch (IOException e) {
//                                e.printStackTrace();
//                            }
//                        }
//                    });
//            settingsPanel.addUIElement(ICBtn);
//            yPos -= 50;
//        }
//
//        ModLabeledToggleButton SBBtn = new ModLabeledToggleButton(TEXT[3], xPos, yPos, Settings.CREAM_COLOR, FontHelper.charDescFont, true, settingsPanel, l -> {
//        },
//                button ->
//                {
//                    if (modConfig != null) {
//                        modConfig.setBool("SummedDamage", button.enabled);
//                        try {
//                            modConfig.save();
//                        } catch (IOException e) {
//                            e.printStackTrace();
//                        }
//                    }
//                });
//        settingsPanel.addUIElement(SBBtn);
//        yPos -= 50;
//
//        ModLabeledToggleButton TIDBtn = new ModLabeledToggleButton(TEXT[4], xPos, yPos, Settings.CREAM_COLOR, FontHelper.charDescFont, true, settingsPanel, l -> {
//        },
//                button ->
//                {
//                    if (modConfig != null) {
//                        modConfig.setBool("TotalIncomingDamage", button.enabled);
//                        try {
//                            modConfig.save();
//                        } catch (IOException e) {
//                            e.printStackTrace();
//                        }
//                    }
//                });
//        settingsPanel.addUIElement(TIDBtn);
//        yPos -= 50;

        BaseMod.registerModBadge(ImageMaster.loadImage("SlayTheRelicsExporterResources/img/modBadgeSmall.png"), "SlayTheRelics", "LordAddy", "TODO", settingsPanel);
    }

    @Override
    public void receivePostUpdate() {
//        if(Gdx.input.isButtonPressed(0)) {
//            logger.info("button 0");
//        }
//
//        if(Gdx.input.isButtonPressed(1)) {
//            logger.info("button 1");
//        }

        if(InputHelper.justClickedLeft) {
            logger.info("just clicked left");
        }

        if(loginText != null && loginText.yesHb != null && loginText.yesHb.hovered) {
            logger.info("yes hovered");
        }
    }
}