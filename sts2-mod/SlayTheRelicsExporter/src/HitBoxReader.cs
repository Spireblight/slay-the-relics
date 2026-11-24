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

public static class HitBoxReader
{
    // Game renders at 1920x1080 logical resolution
    private const float RefWidth = 1920f;
    private const float RefHeight = 1080f;

    public static List<TipsBoxData> ReadCombatTips(
        IEnumerable<Creature> creatures,
        Func<PowerModel, List<TipData>> powerTipResolver,
        Func<Creature, List<TipData>>? prependedTipsResolver = null)
    {
        var result = new List<TipsBoxData>();
        var combatRoom = NCombatRoom.Instance;
        if (combatRoom == null) return result;

        var creatureNodes = GetCreatureNodes(combatRoom);
        if (creatureNodes == null) return result;

        foreach (var creature in creatures)
        {
            try
            {
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
                    }
                }

                foreach (var power in creature.Powers)
                {
                    try
                    {
                        tips.AddRange(powerTipResolver(power));
                    }
                    catch
                    {
                    }
                }

                if (tips.Count == 0) continue;

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
        var hitbox = nCreature.Hitbox;
        if (hitbox != null && IsValid(hitbox))
        {
            return ControlToHitBox(hitbox);
        }

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
