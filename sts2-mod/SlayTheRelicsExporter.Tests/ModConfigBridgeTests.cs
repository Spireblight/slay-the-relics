using Xunit;

namespace SlayTheRelicsExporter.Tests;

public class ModConfigBridgeTests
{
    [Fact]
    public void IsAvailable_WithoutModConfig_ReturnsFalse()
    {
        Assert.False(ModConfigBridge.IsAvailable);
    }

    [Fact]
    public void PollIntervalMs_WithoutModConfig_ReturnsDefault()
    {
        Assert.Equal(1000, ModConfigBridge.PollIntervalMs);
    }

    [Fact]
    public void Delay_WithoutModConfig_ReturnsDefault()
    {
        Assert.Equal(150, ModConfigBridge.Delay);
    }

    [Fact]
    public void GetValue_WithoutModConfig_ReturnsFallback()
    {
        Assert.Equal(42, ModConfigBridge.GetValue("nonexistent", 42));
        Assert.Equal("hello", ModConfigBridge.GetValue("nonexistent", "hello"));
        Assert.True(ModConfigBridge.GetValue("nonexistent", true));
    }

    [Fact]
    public void SetValue_WithoutModConfig_DoesNotThrow()
    {
        var ex = Record.Exception(() => ModConfigBridge.SetValue("key", "value"));
        Assert.Null(ex);
    }
}
