using System;
using System.Collections.Generic;
using System.Linq;
using MegaCrit.Sts2.Core.Combat;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Entities.Players;
using MegaCrit.Sts2.Core.Logging;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Runs;
using SlayTheRelicsExporter.Models;

namespace SlayTheRelicsExporter;

public class StateExporter
{
    private readonly Config _config;
    private int _gameStateIndex;

    public StateExporter(Config config)
    {
        _config = config;
    }

    public ExportedState? Export()
    {
        try
        {
            var runManager = RunManager.Instance;
            if (!runManager.IsInProgress)
                return null;

            var runState = runManager.DebugOnlyGetState();
            if (runState == null)
                return null;

            var player = runState.Players.FirstOrDefault();
            if (player == null)
                return null;

            var state = new ExportedState
            {
                GameStateIndex = _gameStateIndex++,
                Channel = _config.Channel,
                Game = "sts2",
                Character = GetCharacterName(player),
                Boss = GetBossName(runState),
            };

            // Relics (display names + fully resolved tips)
            ExportRelics(player, state);

            // Deck (display names)
            ExportDeck(player, state);

            // Potions (display names + tips)
            ExportPotions(player, state);

            // Map
            ExportMap(runState, state);

            // Combat state (piles, power tips)
            if (CombatManager.Instance.IsInProgress)
            {
                ExportCombatState(runState, player, state);
            }

            return state;
        }
        catch (Exception ex)
        {
            Log.Warn($"[SlayTheRelicsExporter] Export failed: {ex.Message}");
            return null;
        }
    }

    public void ResetIndex()
    {
        _gameStateIndex = 0;
    }

    private static string GetCharacterName(Player player)
    {
        try
        {
            return player.Character.Title.GetFormattedText();
        }
        catch
        {
            return player.Character.Id.ToString();
        }
    }

    private static string GetBossName(RunState runState)
    {
        try
        {
            // Access the current act's boss encounter via ActModel.BossEncounter
            var currentActIndex = runState.CurrentActIndex;
            if (currentActIndex < 0 || currentActIndex >= runState.Acts.Count)
                return "";

            var act = runState.Acts[currentActIndex];
            var boss = act.BossEncounter;
            return boss?.Id.Entry.ToLowerInvariant() ?? "";
        }
        catch
        {
            return "";
        }
    }

    private static void ExportRelics(Player player, ExportedState state)
    {
        foreach (var relic in player.Relics)
        {
            try
            {
                var name = relic.Title.GetFormattedText();
                state.Relics.Add(name);
                var tips = TipExporter.RelicTips(relic);
                // Merge all hover tips into a single tip to maintain 1:1 mapping with relics
                if (tips.Count > 0)
                {
                    var textTips = tips.Where(t => t.Type != "card").ToList();
                    var parts = textTips.Select((t, i) =>
                    {
                        var header = i > 0 && !string.IsNullOrEmpty(t.Header) ? $"[gold]{t.Header}[/gold]\n" : "";
                        return header + t.Description;
                    }).Where(d => !string.IsNullOrEmpty(d));
                    var merged = new TipData
                    {
                        Header = tips[0].Header,
                        Description = string.Join("\n\n", parts)
                    };
                    state.RelicTips.Add(merged);
                }
                else
                {
                    state.RelicTips.Add(new TipData { Header = name, Description = "" });
                }
            }
            catch (Exception ex)
            {
                Log.Warn($"[SlayTheRelicsExporter] Failed to export relic {relic.Id}: {ex.Message}");
                state.Relics.Add(relic.Id.ToString());
            }
        }
    }

    private static void ExportDeck(Player player, ExportedState state)
    {
        var cardTips = new Dictionary<string, List<TipData>>();

        foreach (var card in player.Deck.Cards)
        {
            var key = GetCardKey(card);
            state.Deck.Add(key);
            PopulateCardMeta(card, key, cardTips);
        }

        state.CardTips = cardTips.Count > 0 ? cardTips : null;
    }

    private static void ExportPotions(Player player, ExportedState state)
    {
        var slots = player.PotionSlots;
        var potionTips = new List<TipData>(slots.Count);

        for (int i = 0; i < slots.Count; i++)
        {
            var potion = slots[i];
            if (potion == null)
            {
                state.Potions.Add("");
                potionTips.Add(new TipData { Header = "Potion Slot", Description = "" });
                continue;
            }

            try
            {
                var name = potion.Title.GetFormattedText();
                state.Potions.Add(name);
                potionTips.Add(TipExporter.PotionTip(potion));
            }
            catch
            {
                state.Potions.Add(potion.Id.ToString());
                potionTips.Add(new TipData { Header = potion.Id.ToString() });
            }
        }

        state.PotionTips = potionTips;
    }

    private static void ExportMap(RunState runState, ExportedState state)
    {
        try
        {
            var map = runState.Map;
            if (map == null) return;

            var visitedCoords = runState.VisitedMapCoords;
            var (mapNodes, mapPath) = MapTransformer.Transform(map, visitedCoords);
            state.MapNodes = mapNodes;
            state.MapPath = mapPath;
        }
        catch (Exception ex)
        {
            Log.Warn($"[SlayTheRelicsExporter] Failed to export map: {ex.Message}");
        }
    }

    private static void ExportCombatState(RunState runState, Player player, ExportedState state)
    {
        try
        {
            var combatState = player.Creature.CombatState;
            if (combatState == null) return;

            var playerCombat = player.PlayerCombatState;
            if (playerCombat == null) return;

            // Card piles
            var cardTips = state.CardTips ?? new Dictionary<string, List<TipData>>();

            state.DrawPile = ExportPile(playerCombat.DrawPile, cardTips);
            state.DiscardPile = ExportPile(playerCombat.DiscardPile, cardTips);
            state.ExhaustPile = ExportPile(playerCombat.ExhaustPile, cardTips);

            // Populate tips for hand cards (may have combat-applied enchantments/afflictions)
            foreach (var card in playerCombat.Hand.Cards)
            {
                var key = GetCardKey(card);
                PopulateCardMeta(card, key, cardTips);
            }

            state.CardTips = cardTips.Count > 0 ? cardTips : null;

            // Power tips with hitbox positions from game UI nodes
            ExportPowerTips(combatState, state);
        }
        catch (Exception ex)
        {
            Log.Warn($"[SlayTheRelicsExporter] Failed to export combat state: {ex.Message}");
        }
    }

    private static List<object> ExportPile(CardPile pile,
        Dictionary<string, List<TipData>> cardTips)
    {
        var result = new List<object>();
        foreach (var card in pile.Cards)
        {
            var key = GetCardKey(card);
            result.Add(key);
            PopulateCardMeta(card, key, cardTips);
        }
        return result;
    }

    // Unit separator used to encode card variant info into the key.
    // Format: "DisplayName\u001FenchantmentId:amount\u001FafflictionId"
    // Frontend splits on this to separate display name from variant identity.
    private const char KeySeparator = '\u001F';

    private static string GetCardKey(CardModel card)
    {
        try
        {
            var id = card.Id.Entry.ToLowerInvariant();
            if (card.IsUpgraded)
                id += "+";
            var enchantment = card.Enchantment != null
                ? $"{card.Enchantment.Id.Entry}:{card.Enchantment.Amount}"
                : "";
            var affliction = card.Affliction?.Id.Entry ?? "";
            if (enchantment == "" && affliction == "")
                return id;
            return $"{id}{KeySeparator}{enchantment}{KeySeparator}{affliction}";
        }
        catch (Exception ex)
        {
            Log.Warn($"[SlayTheRelicsExporter] Failed to get card key for {card.Id}: {ex.Message}");
            return card.Id.ToString();
        }
    }

    private static void PopulateCardMeta(CardModel card, string cardKey,
        Dictionary<string, List<TipData>> cardTips)
    {
        if (!cardTips.ContainsKey(cardKey))
        {
            cardTips[cardKey] = TipExporter.CardTips(card);
        }
    }

    private static void ExportPowerTips(CombatState combatState, ExportedState state)
    {
        try
        {
            var tipsBoxes = HitBoxReader.ReadCombatTips(
                combatState.Creatures,
                power => TipExporter.FromHoverTips(power.HoverTips));
            state.AdditionalTips.AddRange(tipsBoxes);
        }
        catch (Exception ex)
        {
            Log.Warn($"[SlayTheRelicsExporter] Failed to read power hitboxes: {ex.Message}");
        }
    }
}
