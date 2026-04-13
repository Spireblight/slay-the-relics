using Xunit;

namespace SlayTheRelicsExporter.Tests;

public class InlineImageReplacerTests
{
    private static string EnergyImg(string prefix = "colorless") =>
        $"[img]res://images/packed/sprite_fonts/{prefix}_energy_icon.png[/img]";

    private static string StarImg() =>
        "[img]res://images/packed/sprite_fonts/star_icon.png[/img]";

    [Fact]
    public void Replace_NoImgTags_ReturnsUnchanged()
    {
        const string input = "Every time you play [blue]10[/blue] Attacks, gain something.";
        Assert.Equal(input, InlineImageReplacer.Replace(input));
    }

    [Fact]
    public void Replace_SingleEnergyIcon_ReturnsOne()
    {
        var input = $"Gain {EnergyImg()} at the start of each turn.";
        var result = InlineImageReplacer.Replace(input);
        Assert.Equal("Gain [blue]1[/blue] [gold]Energy[/gold] at the start of each turn.", result);
    }

    [Fact]
    public void Replace_ThreeRepeatedEnergyIcons_ReturnsThree()
    {
        var input = $"Gain {EnergyImg()}{EnergyImg()}{EnergyImg()} now.";
        var result = InlineImageReplacer.Replace(input);
        Assert.Equal("Gain [blue]3[/blue] [gold]Energy[/gold] now.", result);
    }

    [Fact]
    public void Replace_EnergyWithLeadingCount_ReturnsCount()
    {
        // ≥4 or 0 case: the formatter emits "N[img]...[/img]"
        var input = $"Gain 5{EnergyImg()} now.";
        var result = InlineImageReplacer.Replace(input);
        Assert.Equal("Gain [blue]5[/blue] [gold]Energy[/gold] now.", result);
    }

    [Fact]
    public void Replace_ZeroEnergyWithLeadingCount_ReturnsZero()
    {
        var input = $"Spend 0{EnergyImg()}.";
        var result = InlineImageReplacer.Replace(input);
        Assert.Equal("Spend [blue]0[/blue] [gold]Energy[/gold].", result);
    }

    [Fact]
    public void Replace_CharacterSpecificEnergyPrefix_Works()
    {
        var input = $"Gain {EnergyImg("purple")} energy.";
        var result = InlineImageReplacer.Replace(input);
        Assert.Equal("Gain [blue]1[/blue] [gold]Energy[/gold] energy.", result);
    }

    [Fact]
    public void Replace_SingleStar_ReturnsStarLabel()
    {
        var input = $"Gain {StarImg()} at the start.";
        var result = InlineImageReplacer.Replace(input);
        Assert.Equal("Gain [blue]1[/blue] [gold]Stars[/gold] at the start.", result);
    }

    [Fact]
    public void Replace_TwoStars_ReturnsStarLabel()
    {
        var input = $"Gain {StarImg()}{StarImg()} at the start.";
        var result = InlineImageReplacer.Replace(input);
        Assert.Equal("Gain [blue]2[/blue] [gold]Stars[/gold] at the start.", result);
    }

    [Fact]
    public void Replace_NunchakunDescription_Works()
    {
        // Nunchaku: "Every time you play [blue]10[/blue] Attacks, gain {energy}."
        var input = $"Every time you play [blue]10[/blue] Attacks, gain {EnergyImg()}.";
        var result = InlineImageReplacer.Replace(input);
        Assert.Equal(
            "Every time you play [blue]10[/blue] Attacks, gain [blue]1[/blue] [gold]Energy[/gold].",
            result);
    }

    [Fact]
    public void Replace_MultipleEnergyGroupsInOneDescription_ReplacesAll()
    {
        // e.g. BREAD: "lose N energy, gain M energy"
        var input = $"Lose {EnergyImg()}. Gain {EnergyImg()}{EnergyImg()}.";
        var result = InlineImageReplacer.Replace(input);
        Assert.Equal(
            "Lose [blue]1[/blue] [gold]Energy[/gold]. Gain [blue]2[/blue] [gold]Energy[/gold].",
            result);
    }
}
