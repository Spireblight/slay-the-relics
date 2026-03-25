using System;
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
        try
        {
            var data = new TipData();

            if (tip is HoverTip ht)
            {
                data.Header = ht.Title ?? "";
                data.Description = ht.Description ?? "";
            }
            else if (tip is CardHoverTip cht)
            {
                // CardHoverTip is rendered as a mini card image in-game, not as text.
                // Emit the card image path so the frontend can do the same.
                var card = cht.Card;
                data.Header = card.Title ?? "";
                var idEntry = card.Id.Entry.ToLowerInvariant();
                var suffix = card.IsUpgraded ? "plusone" : "";
                data.Img = $"assets/sts2/card-images/{idEntry}{suffix}.png";
                data.Type = "card";
            }
            else
            {
                data.Header = tip.Id ?? "";
                data.Description = "";
            }

            return data;
        }
        catch (Exception ex)
        {
            Log.Warn($"[SlayTheRelicsExporter] Failed to export hover tip: {ex.Message}");
            return new TipData { Header = tip?.Id ?? "", Description = "" };
        }
    }

    public static List<TipData> FromHoverTips(IEnumerable<IHoverTip> tips)
    {
        var result = new List<TipData>();
        foreach (var tip in tips)
        {
            try
            {
                result.Add(FromHoverTip(tip));
            }
            catch (Exception ex)
            {
                Log.Warn($"[SlayTheRelicsExporter] Skipping hover tip: {ex.Message}");
            }
        }
        return result;
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
