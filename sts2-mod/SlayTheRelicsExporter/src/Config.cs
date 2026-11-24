using System;
using System.IO;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace SlayTheRelicsExporter;

public class Config
{
    public const string DefaultLiveBackendUrl = "https://slay-the-relics.baalorlord.tv";
    public const string DefaultDevBackendUrl = "http://localhost:8888";

    public string BackendUrl { get; set; } = DefaultLiveBackendUrl;
    public string Channel { get; set; } = "";
    public string AuthToken { get; set; } = "";

    private int _pollIntervalMs = 1000;
    public int PollIntervalMs
    {
        get => _pollIntervalMs;
        set => _pollIntervalMs = Math.Clamp(value, 200, 5000);
    }

    private int _delay = 150;
    public int Delay
    {
        get => _delay;
        set => _delay = Math.Clamp(value, 0, 10000);
    }

    [JsonIgnore]
    public bool IsDevConfig { get; private set; }

    public bool IsAuthenticated =>
        !string.IsNullOrEmpty(Channel) && !string.IsNullOrEmpty(AuthToken);

    private static string ConfigDir => Path.Combine(
        Environment.GetEnvironmentVariable("STRE_CONFIG_DIR")
            ?? Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
        "SlayTheRelicsExporter"
    );

    private static string LiveConfigPath => Path.Combine(ConfigDir, "config.json");
    private static string DevConfigPath => Path.Combine(ConfigDir, "config.dev.json");

    public static bool DevConfigExists => File.Exists(DevConfigPath);

    private string TargetPath => IsDevConfig ? DevConfigPath : LiveConfigPath;

    public static Config Load(bool devMode = false)
    {
        var path = devMode ? DevConfigPath : LiveConfigPath;
        if (File.Exists(path))
        {
            try
            {
                var json = File.ReadAllText(path);
                var config = JsonSerializer.Deserialize<Config>(json);
                if (config != null)
                {
                    if (string.IsNullOrEmpty(config.AuthToken))
                        config.Channel = "";
                    config.IsDevConfig = devMode;
                    return config;
                }
            }
            catch
            {
            }
        }

        var fresh = new Config
        {
            BackendUrl = devMode ? DefaultDevBackendUrl : DefaultLiveBackendUrl,
            IsDevConfig = devMode,
        };
        fresh.Save();
        return fresh;
    }

    public void Save()
    {
        var dir = Path.GetDirectoryName(TargetPath)!;
        Directory.CreateDirectory(dir);
        var json = JsonSerializer.Serialize(this, new JsonSerializerOptions { WriteIndented = true });
        File.WriteAllText(TargetPath, json);
    }
}
