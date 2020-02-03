package str_exporter;

import com.evacipated.cardcrawl.modthespire.lib.*;
import com.megacrit.cardcrawl.characters.AbstractPlayer;
import com.megacrit.cardcrawl.helpers.controller.CInputHelper;
import com.megacrit.cardcrawl.relics.AbstractRelic;
import com.megacrit.cardcrawl.ui.panels.TopPanel;
import javassist.CtBehavior;

public class AbstractPlayerRelicPagePatch {
    public static int previousPage;

    /*
    The first two patches handle a weird case of decrementing. They are like this on purpose
    The third case handles a simple case of incrementing.
    So this needs no fixing
     */

    @SpirePatch(
            clz = AbstractPlayer.class,
            method = "updateViewRelicControls"
    )
    public static class DecrementControllerRelicPageBefore {
        @SpireInsertPatch(
                locator = Locator.class
        )
        public static void Insert(AbstractPlayer __instance) {
            previousPage = AbstractRelic.relicPage;
        }

        private static class Locator extends SpireInsertLocator {
            @Override
            public int[] Locate(CtBehavior ctMethodToPatch) throws Exception {
                Matcher finalMatcher = new Matcher.FieldAccessMatcher(AbstractRelic.class, "relicPage");
                return LineFinder.findInOrder(ctMethodToPatch, finalMatcher);
            }
        }
    }
    @SpirePatch(
            clz = AbstractPlayer.class,
            method = "updateViewRelicControls"
    )
    public static class DecrementControllerRelicPageAfter {
        @SpireInsertPatch(
                locator = Locator.class
        )
        public static void Insert(AbstractPlayer __instance) {
            if(previousPage != AbstractRelic.relicPage) {
                TopPanelRelicPagePatch.relicPageChanged();
            }
        }

        private static class Locator extends SpireInsertLocator {
            @Override
            public int[] Locate(CtBehavior ctMethodToPatch) throws Exception {
                Matcher finalMatcher = new Matcher.MethodCallMatcher(CInputHelper.class, "setCursor");
                return LineFinder.findInOrder(ctMethodToPatch, finalMatcher);
            }
        }
    }

    @SpirePatch(
            clz = AbstractPlayer.class,
            method = "updateViewRelicControls"
    )
    public static class IncrementControllerRelicPageBefore {
        @SpireInsertPatch(
                locator = Locator.class
        )
        public static void Insert(AbstractPlayer __instance) {
            TopPanelRelicPagePatch.relicPageChanged();
        }

        private static class Locator extends SpireInsertLocator {
            @Override
            public int[] Locate(CtBehavior ctMethodToPatch) throws Exception {
                Matcher finalMatcher = new Matcher.FieldAccessMatcher(AbstractRelic.class, "relicPage");
                return new int[]{LineFinder.findAllInOrder(ctMethodToPatch, finalMatcher)[8]};
            }
        }
    }
}
