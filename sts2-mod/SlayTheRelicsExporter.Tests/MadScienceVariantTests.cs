using System.Collections.Generic;
using Xunit;

namespace SlayTheRelicsExporter.Tests;

public class MadScienceVariantTests
{
    public static IEnumerable<object[]> AllValidVariants => new[]
    {
        new object[] { "Attack", "None", "mad_science_attack" },
        new object[] { "Attack", "Sapping", "mad_science_attack_sapping" },
        new object[] { "Attack", "Violence", "mad_science_attack_violence" },
        new object[] { "Attack", "Choking", "mad_science_attack_choking" },
        new object[] { "Skill", "None", "mad_science_skill" },
        new object[] { "Skill", "Energized", "mad_science_skill_energized" },
        new object[] { "Skill", "Wisdom", "mad_science_skill_wisdom" },
        new object[] { "Skill", "Chaos", "mad_science_skill_chaos" },
        new object[] { "Power", "None", "mad_science_power" },
        new object[] { "Power", "Expertise", "mad_science_power_expertise" },
        new object[] { "Power", "Curious", "mad_science_power_curious" },
        new object[] { "Power", "Improvement", "mad_science_power_improvement" },
    };

    [Theory]
    [MemberData(nameof(AllValidVariants))]
    public void GetAssetId_ValidVariants_ReturnsExpectedAssetName(string type, string rider, string expected)
    {
        Assert.Equal(expected, MadScienceVariant.GetAssetId(type, rider));
    }

    [Theory]
    [InlineData("None", "None", "mad_science_attack")]
    [InlineData(null, null, "mad_science_attack")]
    [InlineData("", "", "mad_science_attack")]
    [InlineData("Status", "None", "mad_science_attack")]
    [InlineData("Attack", "Wisdom", "mad_science_attack")]
    [InlineData("Skill", "Sapping", "mad_science_skill")]
    [InlineData("Power", "Chaos", "mad_science_power")]
    [InlineData("skill", "CHAOS", "mad_science_skill_chaos")]
    public void GetAssetId_FallbacksAndCasing_ReturnValidAssetName(string? type, string? rider, string expected)
    {
        Assert.Equal(expected, MadScienceVariant.GetAssetId(type, rider));
    }
}
