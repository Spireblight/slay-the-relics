package str_exporter.patches;

import com.evacipated.cardcrawl.modthespire.lib.*;
import com.megacrit.cardcrawl.core.CardCrawlGame;
import com.megacrit.cardcrawl.relics.AbstractRelic;
import com.megacrit.cardcrawl.ui.panels.SeedPanel;
import javassist.CtBehavior;

public class CardCrawlGameRelicPagePatch {

    @SpirePatch(
            clz = CardCrawlGame.class,
            method = "updateFade"
    )
    public static class DecrementCardCrawlGameRelicPageBefore {
        @SpireInsertPatch(
                locator = Locator.class
        )
        public static void Insert(CardCrawlGame __instance) {
            AbstractPlayerRelicPagePatch.previousPage = AbstractRelic.relicPage;
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
            clz = CardCrawlGame.class,
            method = "updateFade"
    )
    public static class DecrementCardCrawlGameRelicPageAfter {
        @SpireInsertPatch(
                locator = Locator.class
        )
        public static void Insert(CardCrawlGame __instance) {
            if (AbstractPlayerRelicPagePatch.previousPage != AbstractRelic.relicPage) {
                TopPanelRelicPagePatch.relicPageChanged();
            }
        }

        private static class Locator extends SpireInsertLocator {
            @Override
            public int[] Locate(CtBehavior ctMethodToPatch) throws Exception {
                Matcher finalMatcher = new Matcher.FieldAccessMatcher(SeedPanel.class, "textField");
                return LineFinder.findInOrder(ctMethodToPatch, finalMatcher);
            }
        }
    }
}
