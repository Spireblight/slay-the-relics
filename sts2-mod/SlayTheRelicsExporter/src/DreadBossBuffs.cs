using System;
using System.Collections.Generic;
using SlayTheRelicsExporter.Models;

namespace SlayTheRelicsExporter;

/// <summary>
/// Maps Dread Mode boss encounters/monsters to their Dread-specific combat buffs.
/// Kept free of Godot/STS2 assembly types so it can be unit-tested standalone.
/// </summary>
public static class DreadBossBuffs
{
    public const string TipHeader = "Dread Buffs";

    private static readonly Dictionary<string, string> MonsterBuffDescriptions = new(StringComparer.Ordinal)
    {
        ["VANTOM"] =
            "[blue]+2[/blue] [gold]Slippery[/gold] ([blue]11[/blue]).\n" +
            "[gold]Prepare[/gold] grants [blue]3[/blue] [gold]Strength[/gold] (was [blue]2[/blue]).",

        ["CEREMONIAL_BEAST"] =
            "[blue]+30[/blue] Max HP ([blue]292[/blue]).\n" +
            "[gold]Plow[/gold] grants [blue]3[/blue] [gold]Strength[/gold] (was [blue]2[/blue]).\n" +
            "Gains [blue]2[/blue] [gold]Ritual[/gold] in phase [blue]2[/blue].",

        ["THE_INSATIABLE"] =
            "[blue]+20[/blue] Max HP ([blue]361[/blue]).\n" +
            "[gold]Sandpit[/gold] starts at [blue]3[/blue] (was [blue]4[/blue]).",

        ["SOUL_FYSH"] =
            "[gold]Beckon[/gold] move adds [blue]3[/blue] [gold]Beckons[/gold] (was [blue]2[/blue]), putting [blue]1[/blue] directly into your [gold]Hand[/gold].",

        ["KNOWLEDGE_DEMON"] =
            "[gold]Disintegration[/gold] deals [blue]8[/blue] / [blue]9[/blue] / [blue]10[/blue] damage (was [blue]6[/blue] / [blue]7[/blue] / [blue]8[/blue]).",

        ["LAGAVULIN_MATRIARCH"] =
            "[blue]+22[/blue] Max HP ([blue]255[/blue]).\n" +
            "[gold]Slash[/gold] (+Block) deals [blue]+2[/blue] damage and gains [blue]+2[/blue] [gold]Block[/gold] ([blue]16[/blue]).\n" +
            "[gold]Soul Siphon[/gold] applies [red]-3[/red] [gold]Strength[/gold] and [gold]Dexterity[/gold] (was [red]-2[/red]).",

        ["WATERFALL_GIANT"] =
            "Gains [blue]4[/blue] [gold]Steam Eruption[/gold] per move (was [blue]3[/blue]).",

        ["CRUSHER"] =
            "Starts combat with [blue]14[/blue] [gold]Plating[/gold].",

        ["ROCKET"] =
            "Starts combat with [blue]14[/blue] [gold]Plating[/gold].\n" +
            "[gold]Rocket Claw[/gold] deals [blue]+5[/blue] damage ([blue]40[/blue]).",

        ["QUEEN"] =
            "Starts combat with [gold]Dread Initial[/gold] (combines [gold]Puppet Strings[/gold] and [gold]You're Mine[/gold] on Turn [blue]1[/blue]).\n" +
            "[gold]Burn Bright for Me[/gold] grants [blue]2[/blue] [gold]Strength[/gold] to Torch-Head Amalgam (was [blue]1[/blue]).",

        ["TORCH_HEAD_AMALGAM"] =
            "[gold]Strong Tackle[/gold] deals [blue]+5[/blue] damage ([blue]37[/blue]).",

        ["TEST_SUBJECT"] =
            "[blue]+1[/blue] [gold]Enrage[/gold] ([blue]4[/blue]).\n" +
            "[gold]Multi-Claw[/gold] hits [blue]4[/blue] times (was [blue]3[/blue]).\n" +
            "[gold]Burning Growl[/gold] grants [blue]+3[/blue] [gold]Strength[/gold] ([blue]6[/blue]).",

        ["AEONGLASS"] =
            "[gold]Increasing Intensity[/gold] adds [blue]+1[/blue] [gold]Wither[/gold] ([blue]3[/blue]) to your [gold]Draw Pile[/gold] instead of your [gold]Discard Pile[/gold].",
    };

    private const string TheKinBossDescription =
        "Spawns [blue]3[/blue] Kin Followers instead of [blue]2[/blue].";

    public static bool IsDreadGameMode(string? gameModeName) =>
        string.Equals(gameModeName, "Dread", StringComparison.OrdinalIgnoreCase);

    /// <summary>
    /// Returns the Dread Mode boss-buffs tooltip for a creature in a boss encounter,
    /// or null if the monster/encounter has no Dread Mode changes.
    /// </summary>
    public static TipData? GetBossCreatureTip(string? monsterEntry, string? encounterEntry)
    {
        if (string.IsNullOrEmpty(monsterEntry))
        {
            return null;
        }

        if (string.Equals(encounterEntry, "THE_KIN_BOSS", StringComparison.Ordinal) &&
            (string.Equals(monsterEntry, "KIN_PRIEST", StringComparison.Ordinal) ||
             string.Equals(monsterEntry, "KIN_FOLLOWER", StringComparison.Ordinal)))
        {
            return new TipData
            {
                Header = TipHeader,
                Description = TheKinBossDescription,
            };
        }

        if (MonsterBuffDescriptions.TryGetValue(monsterEntry, out var description))
        {
            return new TipData
            {
                Header = TipHeader,
                Description = description,
            };
        }

        return null;
    }
}
