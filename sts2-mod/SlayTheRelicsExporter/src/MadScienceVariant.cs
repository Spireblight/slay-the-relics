using System;
using System.Collections.Generic;

namespace SlayTheRelicsExporter;

/// <summary>
/// Resolves Mad Science card asset IDs matching assets/sts2/card-images/mad_science_*.png.
/// Kept free of Godot/STS2 assembly types so it can be unit-tested standalone.
/// </summary>
public static class MadScienceVariant
{
    private static readonly Dictionary<string, HashSet<string>> ValidRidersByType =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["attack"] = new(StringComparer.OrdinalIgnoreCase) { "sapping", "violence", "choking" },
            ["skill"] = new(StringComparer.OrdinalIgnoreCase) { "energized", "wisdom", "chaos" },
            ["power"] = new(StringComparer.OrdinalIgnoreCase) { "expertise", "curious", "improvement" },
        };

    /// <summary>
    /// Formats the lowercase card asset ID for a Mad Science card given its
    /// TinkerTimeType and TinkerTimeRider enum names.
    /// Falls back to "mad_science_attack" when type is None/unknown (matching the game's portrait fallback)
    /// and omits invalid/None riders so the resulting ID always matches an existing asset.
    /// </summary>
    public static string GetAssetId(string? tinkerTimeType, string? tinkerTimeRider)
    {
        var type = NormalizeType(tinkerTimeType);

        if (!string.IsNullOrEmpty(tinkerTimeRider) &&
            !string.Equals(tinkerTimeRider, "None", StringComparison.OrdinalIgnoreCase) &&
            ValidRidersByType.TryGetValue(type, out var validRiders) &&
            validRiders.Contains(tinkerTimeRider))
        {
            return $"mad_science_{type}_{tinkerTimeRider.ToLowerInvariant()}";
        }

        return $"mad_science_{type}";
    }

    private static string NormalizeType(string? tinkerTimeType)
    {
        if (string.IsNullOrEmpty(tinkerTimeType))
            return "attack";

        var lower = tinkerTimeType.ToLowerInvariant();
        return ValidRidersByType.ContainsKey(lower) ? lower : "attack";
    }
}
