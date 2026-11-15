using System.Text.RegularExpressions;
using Xunit;

namespace SlayTheRelicsExporter.Tests;

public class DreadBossBuffsTests
{
    private static readonly Regex SupportedColorTagRegex = new(
        @"\[(gold|blue|red|green|purple)\].+?\[/\1\]",
        RegexOptions.Compiled);

    [Theory]
    [InlineData("Dread", true)]
    [InlineData("dread", true)]
    [InlineData("Standard", false)]
    [InlineData("Blitz", false)]
    [InlineData("Daily", false)]
    [InlineData(null, false)]
    [InlineData("", false)]
    public void IsDreadGameMode_MatchesOnlyDread(string? mode, bool expected)
    {
        Assert.Equal(expected, DreadBossBuffs.IsDreadGameMode(mode));
    }

    [Theory]
    [InlineData("VANTOM", "VANTOM_BOSS")]
    [InlineData("CEREMONIAL_BEAST", "CEREMONIAL_BEAST_BOSS")]
    [InlineData("KIN_PRIEST", "THE_KIN_BOSS")]
    [InlineData("KIN_FOLLOWER", "THE_KIN_BOSS")]
    [InlineData("THE_INSATIABLE", "THE_INSATIABLE_BOSS")]
    [InlineData("SOUL_FYSH", "SOUL_FYSH_BOSS")]
    [InlineData("KNOWLEDGE_DEMON", "KNOWLEDGE_DEMON_BOSS")]
    [InlineData("LAGAVULIN_MATRIARCH", "LAGAVULIN_MATRIARCH_BOSS")]
    [InlineData("WATERFALL_GIANT", "WATERFALL_GIANT_BOSS")]
    [InlineData("CRUSHER", "KAISER_CRAB_BOSS")]
    [InlineData("ROCKET", "KAISER_CRAB_BOSS")]
    [InlineData("QUEEN", "QUEEN_BOSS")]
    [InlineData("TORCH_HEAD_AMALGAM", "QUEEN_BOSS")]
    [InlineData("TEST_SUBJECT", "TEST_SUBJECT_BOSS")]
    [InlineData("AEONGLASS", "AEONGLASS_BOSS")]
    public void GetBossCreatureTip_AllDreadBosses_ReturnFormattedTip(string monsterEntry, string encounterEntry)
    {
        var tip = DreadBossBuffs.GetBossCreatureTip(monsterEntry, encounterEntry);

        Assert.NotNull(tip);
        Assert.Equal(DreadBossBuffs.TipHeader, tip!.Header);
        Assert.False(string.IsNullOrWhiteSpace(tip.Description));
        // Extension TipBody only converts \n to <br /> when STS2 color tags are present.
        Assert.Matches(SupportedColorTagRegex, tip.Description);
    }

    [Fact]
    public void GetBossCreatureTip_KinFollowerOutsideBossEncounter_ReturnsNull()
    {
        Assert.Null(DreadBossBuffs.GetBossCreatureTip("KIN_FOLLOWER", "KIN_FOLLOWERS_NORMAL"));
        Assert.Null(DreadBossBuffs.GetBossCreatureTip("KIN_FOLLOWER", null));
    }

    [Theory]
    [InlineData(null, "VANTOM_BOSS")]
    [InlineData("", "VANTOM_BOSS")]
    [InlineData("JAW_WORM", "JAW_WORM_NORMAL")]
    public void GetBossCreatureTip_UnknownOrNullMonster_ReturnsNull(string? monsterEntry, string? encounterEntry)
    {
        Assert.Null(DreadBossBuffs.GetBossCreatureTip(monsterEntry, encounterEntry));
    }
}
