package str_exporter.patches;

import com.evacipated.cardcrawl.modthespire.lib.*;
import com.megacrit.cardcrawl.ui.panels.TopPanel;
import javassist.CtBehavior;
import str_exporter.SlayTheRelicsExporter;

public class TopPanelRelicPagePatch {
    public static void relicPageChanged() {
        if (SlayTheRelicsExporter.instance != null) {
            SlayTheRelicsExporter.instance.relicPageChanged();
        }
    }

    @SpirePatch(
            clz = TopPanel.class,
            method = "updateRelics"
    )
    public static class DecrementRelicpage {
        @SpireInsertPatch(
                locator = Locator.class
        )
        public static void Insert(TopPanel __instance) {
            relicPageChanged();
        }

        private static class Locator extends SpireInsertLocator {
            @Override
            public int[] Locate(CtBehavior ctMethodToPatch) throws Exception {
                Matcher finalMatcher = new Matcher.MethodCallMatcher(TopPanel.class, "adjustRelicHbs");
                return LineFinder.findInOrder(ctMethodToPatch, finalMatcher);
            }
        }
    }

    @SpirePatch(
            clz = TopPanel.class,
            method = "updateRelics"
    )
    public static class IncrementRelicpage {
        @SpireInsertPatch(
                locator = Locator.class
        )
        public static void Insert(TopPanel __instance) {
            relicPageChanged();
        }

        private static class Locator extends SpireInsertLocator {
            @Override
            public int[] Locate(CtBehavior ctMethodToPatch) throws Exception {
                Matcher finalMatcher = new Matcher.MethodCallMatcher(TopPanel.class, "adjustRelicHbs");
                return new int[]{LineFinder.findAllInOrder(ctMethodToPatch, finalMatcher)[1]};
            }
        }
    }
}
