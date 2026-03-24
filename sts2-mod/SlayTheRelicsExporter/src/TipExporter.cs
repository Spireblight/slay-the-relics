using System.Collections.Generic;
using System.Linq;
using MegaCrit.Sts2.Core.HoverTips;
using MegaCrit.Sts2.Core.Logging;
using MegaCrit.Sts2.Core.Models;
using SlayTheRelicsExporter.Models;

namespace SlayTheRelicsExporter;

public static class TipExporter
{
    public static TipData FromHoverTip(IHoverTip tip)
    {
        var data = new TipData();

        if (tip is HoverTip ht)
        {
            data.Header = ht.Title ?? "";
            data.Description = ht.Description ?? "";
        }
        else if (tip is CardHoverTip cht)
        {
            // CardHoverTip wraps a CardModel — extract title and description from it
            data.Header = cht.Card.Title ?? "";
            try
            {
                data.Description = cht.Card.Description.GetFormattedText();
            }
            catch
            {
                data.Description = "";
            }
        }
        else
        {
            // Fallback: try to get basic info
            data.Header = tip.Id ?? "";
            data.Description = "";
        }

        return data;
    }

    public static List<TipData> FromHoverTips(IEnumerable<IHoverTip> tips)
    {
        return tips.Select(FromHoverTip).ToList();
    }

    public static List<TipData> RelicTips(RelicModel relic)
    {
        try
        {
            return FromHoverTips(relic.HoverTips);
        }
        catch
        {
            Log.Warn($"[SlayTheRelicsExporter] Failed to get HoverTips for relic {relic.Id}");
            return new List<TipData>
            {
                new() { Header = relic.Title?.GetFormattedText() ?? relic.Id.ToString(), Description = "" }
            };
        }
    }

    public static List<TipData> CardTips(CardModel card)
    {
        try
        {
            // Build tips list with type annotations for enchantments/afflictions
            var tips = FromHoverTips(card.HoverTips);

            // Tag enchantment tips
            if (card.Enchantment != null)
            {
                var enchantmentTips = FromHoverTips(card.Enchantment.HoverTips);
                var enchantmentHeaders = new HashSet<string>(enchantmentTips.Select(t => t.Header));
                foreach (var tip in tips)
                {
                    if (enchantmentHeaders.Contains(tip.Header))
                        tip.Type = "enchantment";
                }
            }

            // Tag affliction tips
            if (card.Affliction != null)
            {
                var afflictionTips = FromHoverTips(card.Affliction.HoverTips);
                var afflictionHeaders = new HashSet<string>(afflictionTips.Select(t => t.Header));
                foreach (var tip in tips)
                {
                    if (afflictionHeaders.Contains(tip.Header))
                        tip.Type = "affliction";
                }
            }

            return tips;
        }
        catch
        {
            Log.Warn($"[SlayTheRelicsExporter] Failed to get HoverTips for card {card.Id}");
            return new List<TipData>
            {
                new() { Header = card.Title ?? card.Id.ToString(), Description = "" }
            };
        }
    }

    public static TipData PotionTip(PotionModel potion)
    {
        try
        {
            var tip = potion.HoverTip;
            return FromHoverTip(tip);
        }
        catch
        {
            Log.Warn($"[SlayTheRelicsExporter] Failed to get HoverTip for potion {potion.Id}");
            return new TipData
            {
                Header = potion.Title?.GetFormattedText() ?? potion.Id.ToString(),
                Description = ""
            };
        }
    }
}
