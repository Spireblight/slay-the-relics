using System;
using System.Collections.Generic;

namespace SlayTheRelicsExporter;

public static class MadScienceVariant
{
    private static readonly Dictionary<string, HashSet<string>> ValidRidersByType =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["attack"] = new(StringComparer.OrdinalIgnoreCase) { "sapping", "violence", "choking" },
            ["skill"] = new(StringComparer.OrdinalIgnoreCase) { "energized", "wisdom", "chaos" },
            ["power"] = new(StringComparer.OrdinalIgnoreCase) { "expertise", "curious", "improvement" },
        };

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
