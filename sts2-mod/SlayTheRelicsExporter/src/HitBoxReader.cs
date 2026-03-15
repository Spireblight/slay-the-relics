using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Godot;
using MegaCrit.Sts2.Core.Entities.Creatures;
using MegaCrit.Sts2.Core.Logging;
using MegaCrit.Sts2.Core.Models;
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
        Func<PowerModel, List<TipData>> powerTipResolver)
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

                // Collect all power tips for this creature
                var tips = new List<TipData>();
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

    private static HitBoxData ControlToHitBox(Control control)
    {
        var pos = control.GlobalPosition;
        var size = control.Size * control.GetGlobalTransform().Scale;

        return new HitBoxData
        {
            X = pos.X / RefWidth * 100.0,
            Y = pos.Y / RefHeight * 100.0,
            W = size.X / RefWidth * 100.0,
            H = size.Y / RefHeight * 100.0,
        };
    }

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
