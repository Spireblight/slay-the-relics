using System;
using System.IO;
using System.Text.Json;
using Xunit;

namespace SlayTheRelicsExporter.Tests;

public class ConfigTests : IDisposable
{
    private readonly string _tempDir;

    public ConfigTests()
    {
        _tempDir = Path.Combine(Path.GetTempPath(), $"stre_test_{Guid.NewGuid():N}");
        Directory.CreateDirectory(_tempDir);
        Environment.SetEnvironmentVariable("STRE_CONFIG_DIR", _tempDir);
    }

    public void Dispose()
    {
        Environment.SetEnvironmentVariable("STRE_CONFIG_DIR", null);
        if (Directory.Exists(_tempDir))
            Directory.Delete(_tempDir, true);
    }

    [Fact]
    public void Load_NoExistingFile_ReturnsDefaults()
    {
        var config = Config.Load();

        Assert.Equal("", config.Channel);
        Assert.Equal("", config.AuthToken);
    }

    [Fact]
    public void Save_ThenLoad_RoundTripsCredentials()
    {
        var config = Config.Load();
        config.Channel = "testuser";
        config.AuthToken = "tok_abc123";
        config.Save();

        var reloaded = Config.Load();

        Assert.Equal("testuser", reloaded.Channel);
        Assert.Equal("tok_abc123", reloaded.AuthToken);
    }

    [Fact]
    public void Load_EmptyAuthToken_ReturnsFreshDefaults()
    {
        // Write a config with empty AuthToken
        var configDir = Path.Combine(_tempDir, "SlayTheRelicsExporter");
        Directory.CreateDirectory(configDir);
        var configPath = Path.Combine(configDir, "config.json");
        var json = JsonSerializer.Serialize(new { Channel = "stale", AuthToken = "" });
        File.WriteAllText(configPath, json);

        var config = Config.Load();

        // Config.Load treats empty AuthToken as invalid and returns fresh defaults
        Assert.Equal("", config.Channel);
        Assert.Equal("", config.AuthToken);
    }

    [Fact]
    public void Save_CreatesDirectoryIfMissing()
    {
        var config = Config.Load();
        config.Channel = "newuser";
        config.AuthToken = "tok_new";

        // Delete the directory to ensure Save recreates it
        var configDir = Path.Combine(_tempDir, "SlayTheRelicsExporter");
        if (Directory.Exists(configDir))
            Directory.Delete(configDir, true);

        config.Save();

        Assert.True(File.Exists(Path.Combine(configDir, "config.json")));
    }
}
