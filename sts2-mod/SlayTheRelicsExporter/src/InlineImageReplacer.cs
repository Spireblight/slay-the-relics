using System;
using System.Text.RegularExpressions;

namespace SlayTheRelicsExporter;

public static class InlineImageReplacer
{
    // Game formats energy as either: leading digit + single tag (0 or ≥4),
    // or repeated tags (1–3). Stars always use repeated tags.
    private static readonly Regex _energyWithCount = new(
        @"(\d+)\[img\]res://images/packed/sprite_fonts/\w+_energy_icon\.png\[/img\]",
        RegexOptions.Compiled);

    private static readonly Regex _energyRepeated = new(
        @"(?:\[img\]res://images/packed/sprite_fonts/\w+_energy_icon\.png\[/img\])+",
        RegexOptions.Compiled);

    private static readonly Regex _starsRepeated = new(
        @"(?:\[img\]res://images/packed/sprite_fonts/star_icon\.png\[/img\])+",
        RegexOptions.Compiled);

    public static string Replace(string description, string energyLabel = "Energy", string starLabel = "Stars")
    {
        if (string.IsNullOrEmpty(description)) return description;

        description = _energyWithCount.Replace(description, m =>
            FormatIconCount(int.Parse(m.Groups[1].Value), energyLabel));

        description = _energyRepeated.Replace(description, m =>
            FormatIconCount(CountImgTags(m.Value), energyLabel));

        description = _starsRepeated.Replace(description, m =>
            FormatIconCount(CountImgTags(m.Value), starLabel));

        return description;
    }

    private static string FormatIconCount(int n, string label) =>
        $"[blue]{n}[/blue] [gold]{label}[/gold]";

    private static int CountImgTags(string s)
    {
        int count = 0;
        int index = 0;
        while ((index = s.IndexOf("[img]", index, StringComparison.Ordinal)) != -1)
        {
            count++;
            index += 5;
        }
        return count;
    }
}
