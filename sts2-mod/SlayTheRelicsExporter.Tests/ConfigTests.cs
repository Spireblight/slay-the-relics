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

    [Fact]
    public void Load_NoExistingFile_ReturnsDefaultSettings()
    {
        var config = Config.Load();

        Assert.Equal(1000, config.PollIntervalMs);
        Assert.Equal(150, config.Delay);
    }

    [Fact]
    public void Save_ThenLoad_RoundTripsSettings()
    {
        var config = Config.Load();
        config.PollIntervalMs = 2500;
        config.Delay = 400;
        config.Save();

        var reloaded = Config.Load();

        Assert.Equal(2500, reloaded.PollIntervalMs);
        Assert.Equal(400, reloaded.Delay);
    }

    [Fact]
    public void Settings_ClampsToBounds()
    {
        var config = new Config();

        config.PollIntervalMs = 50;
        Assert.Equal(200, config.PollIntervalMs);

        config.PollIntervalMs = 10000;
        Assert.Equal(5000, config.PollIntervalMs);

        config.Delay = -100;
        Assert.Equal(0, config.Delay);

        config.Delay = 20000;
        Assert.Equal(10000, config.Delay);
    }

    [Fact]
    public void Load_PreservesSettingsEvenWhenAuthTokenIsEmpty()
    {
        var configDir = Path.Combine(_tempDir, "SlayTheRelicsExporter");
        Directory.CreateDirectory(configDir);
        var configPath = Path.Combine(configDir, "config.json");
        var json = JsonSerializer.Serialize(new
        {
            Channel = "stale",
            AuthToken = "",
            PollIntervalMs = 2200,
            Delay = 350
        });
        File.WriteAllText(configPath, json);

        var config = Config.Load();

        Assert.Equal("", config.Channel);
        Assert.Equal("", config.AuthToken);
        Assert.Equal(2200, config.PollIntervalMs);
        Assert.Equal(350, config.Delay);
    }

    [Fact]
    public void DevConfig_IsolatedFromLiveConfig()
    {
        Assert.False(Config.DevConfigExists);

        var live = Config.Load();
        live.Channel = "live_user";
        live.AuthToken = "live_token";
        live.Save();

        Assert.False(Config.DevConfigExists);

        var dev = Config.Load(devMode: true);
        Assert.True(dev.IsDevConfig);
        Assert.True(Config.DevConfigExists);
        Assert.Equal(Config.DefaultDevBackendUrl, dev.BackendUrl);

        dev.Channel = "dev_user";
        dev.AuthToken = "dev_token";
        dev.Save();

        // Reloading live config must preserve live credentials and backend URL
        var reloadedLive = Config.Load();
        Assert.False(reloadedLive.IsDevConfig);
        Assert.Equal(Config.DefaultLiveBackendUrl, reloadedLive.BackendUrl);
        Assert.Equal("live_user", reloadedLive.Channel);
        Assert.Equal("live_token", reloadedLive.AuthToken);

        // Reloading dev config preserves dev credentials and backend URL
        var reloadedDev = Config.Load(devMode: true);
        Assert.True(reloadedDev.IsDevConfig);
        Assert.Equal(Config.DefaultDevBackendUrl, reloadedDev.BackendUrl);
        Assert.Equal("dev_user", reloadedDev.Channel);
        Assert.Equal("dev_token", reloadedDev.AuthToken);
    }
}
