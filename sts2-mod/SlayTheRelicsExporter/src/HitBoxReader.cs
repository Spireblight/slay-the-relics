using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Godot;
using MegaCrit.Sts2.Core.Entities.Creatures;
using MegaCrit.Sts2.Core.HoverTips;
using MegaCrit.Sts2.Core.Logging;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Nodes;
using MegaCrit.Sts2.Core.Nodes.Combat;
using MegaCrit.Sts2.Core.Nodes.Rooms;
using SlayTheRelicsExporter.Models;

namespace SlayTheRelicsExporter;

/// <summary>
/// Reads hitbox positions from Godot UI nodes to position power tooltips on the overlay.
/// Converts from game pixel coordinates to viewport percentages (same as STS1 mod).
/// </summary>
public static class HitBoxReader
{
    // Game renders at 1920x1080 logical resolution
    private const float RefWidth = 1920f;
    private const float RefHeight = 1080f;

    /// <summary>
    /// Gets creature-level hitboxes with power tips for all creatures in combat.
    /// Each creature becomes one TipsBoxData with all its power tips grouped together.
    /// </summary>
    public static List<TipsBoxData> ReadCombatTips(
        IEnumerable<Creature> creatures,
        Func<PowerModel, List<TipData>> powerTipResolver,
        Func<Creature, List<TipData>>? prependedTipsResolver = null)
    {
        var result = new List<TipsBoxData>();
        var combatRoom = NCombatRoom.Instance;
        if (combatRoom == null) return result;

        // Access private _creatureNodes list via reflection
        var creatureNodes = GetCreatureNodes(combatRoom);
        if (creatureNodes == null) return result;

        foreach (var creature in creatures)
        {
            try
            {
                // Find the NCreature node for this creature
                var nCreature = creatureNodes.FirstOrDefault(n =>
                    n != null && IsValid(n) && n.Entity == creature);
                if (nCreature == null) continue;

                var tips = new List<TipData>();
                if (prependedTipsResolver != null)
                {
                    try
                    {
                        tips.AddRange(prependedTipsResolver(creature));
                    }
                    catch
                    {
                        // Skip unresolvable prepended tips
                    }
                }

                // Collect all power tips for this creature
                foreach (var power in creature.Powers)
                {
                    try
                    {
                        tips.AddRange(powerTipResolver(power));
                    }
                    catch
                    {
                        // Skip unresolvable powers
                    }
                }

                if (tips.Count == 0) continue;

                // Read the creature's hitbox position
                var hitbox = ReadCreatureHitBox(nCreature);
                result.Add(new TipsBoxData
                {
                    Tips = tips,
                    Hitbox = hitbox,
                });
            }
            catch (Exception ex)
            {
                Log.Warn($"[SlayTheRelicsExporter] Failed to read hitbox for creature: {ex.Message}");
            }
        }

        return result;
    }

    /// <summary>
    /// Reads the top-bar boss icon hitbox and its in-game hover tips when visible.
    /// Used outside boss fights in Dread Mode to display the upcoming boss's dominion.
    /// </summary>
    public static TipsBoxData? ReadTopBarBossIconTip(
        Func<IEnumerable<IHoverTip>, List<TipData>> hoverTipConverter)
    {
        try
        {
            var topBar = NRun.Instance?.GlobalUi?.TopBar;
            if (topBar == null) return null;

            var bossIconProp = topBar.GetType().GetProperty("BossIcon",
                BindingFlags.Public | BindingFlags.Instance);
            if (bossIconProp?.GetValue(topBar) is not Control bossIcon || !IsValid(bossIcon))
                return null;

            if (!bossIcon.IsVisibleInTree() || bossIcon.GlobalPosition.Y < 0f)
                return null;

            // Never export top-bar dominion tips when the game switched to the Act 3 2nd-boss-only icon.
            var onlySecondProp = bossIcon.GetType().GetProperty("ShouldOnlyShowSecondBossIcon",
                BindingFlags.NonPublic | BindingFlags.Public | BindingFlags.Instance);
            if (onlySecondProp?.GetValue(bossIcon) is true)
                return null;

            var hoverTipsField = bossIcon.GetType().GetField("_hoverTips",
                BindingFlags.NonPublic | BindingFlags.Instance);
            if (hoverTipsField?.GetValue(bossIcon) is not IEnumerable<IHoverTip> hoverTips)
                return null;

            var tips = hoverTipConverter(hoverTips);
            if (tips.Count == 0)
                return null;

            var rect = GetGlobalControlRect(bossIcon);
            var secondIconField = bossIcon.GetType().GetField("_secondBossIcon",
                BindingFlags.NonPublic | BindingFlags.Instance);
            if (secondIconField?.GetValue(bossIcon) is Control secondIcon &&
                IsValid(secondIcon) &&
                secondIcon.Visible)
            {
                rect = rect.Merge(GetGlobalControlRect(secondIcon));
            }

            return new TipsBoxData
            {
                Tips = tips,
                Hitbox = RectToHitBox(rect),
            };
        }
        catch (Exception ex)
        {
            Log.Warn($"[SlayTheRelicsExporter] Failed to read top-bar boss icon tip: {ex.Message}");
            return null;
        }
    }

    private static HitBoxData ReadCreatureHitBox(NCreature nCreature)
    {
        // Use the creature's Hitbox control for positioning
        var hitbox = nCreature.Hitbox;
        if (hitbox != null && IsValid(hitbox))
        {
            return ControlToHitBox(hitbox);
        }

        // Fallback: use the NCreature control itself
        return ControlToHitBox(nCreature);
    }

    private static Rect2 GetGlobalControlRect(Control control)
    {
        var pos = control.GlobalPosition;
        var size = control.Size * control.GetGlobalTransform().Scale;
        return new Rect2(pos, size);
    }

    private static HitBoxData ControlToHitBox(Control control) =>
        RectToHitBox(GetGlobalControlRect(control));

    private static HitBoxData RectToHitBox(Rect2 rect) =>
        new()
        {
            X = rect.Position.X / RefWidth * 100.0,
            Y = rect.Position.Y / RefHeight * 100.0,
            W = rect.Size.X / RefWidth * 100.0,
            H = rect.Size.Y / RefHeight * 100.0,
        };

    private static List<NCreature>? GetCreatureNodes(NCombatRoom room)
    {
        try
        {
            var field = typeof(NCombatRoom).GetField("_creatureNodes",
                BindingFlags.NonPublic | BindingFlags.Instance);
            return field?.GetValue(room) as List<NCreature>;
        }
        catch
        {
            return null;
        }
    }

    private static bool IsValid(GodotObject obj)
    {
        try
        {
            return GodotObject.IsInstanceValid(obj);
        }
        catch
        {
            return false;
        }
    }
}
