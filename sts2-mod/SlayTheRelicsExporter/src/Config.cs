using System;
using System.IO;
using System.Text.Json;

namespace SlayTheRelicsExporter;

public class Config
{
    public string BackendUrl { get; set; } = "https://slay-the-relics.baalorlord.tv";
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

    public bool IsAuthenticated =>
        !string.IsNullOrEmpty(Channel) && !string.IsNullOrEmpty(AuthToken);

    private static string ConfigPath => Path.Combine(
        Environment.GetEnvironmentVariable("STRE_CONFIG_DIR")
            ?? Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
        "SlayTheRelicsExporter",
        "config.json"
    );

    public static Config Load()
    {
        if (File.Exists(ConfigPath))
        {
            try
            {
                var json = File.ReadAllText(ConfigPath);
                var config = JsonSerializer.Deserialize<Config>(json);
                if (config != null)
                {
                    if (string.IsNullOrEmpty(config.AuthToken))
                        config.Channel = "";
                    return config;
                }
            }
            catch
            {
                // Fall back to fresh defaults if file is corrupted
            }
        }

        var fresh = new Config();
        fresh.Save();
        return fresh;
    }

    public void Save()
    {
        var dir = Path.GetDirectoryName(ConfigPath)!;
        Directory.CreateDirectory(dir);
        var json = JsonSerializer.Serialize(this, new JsonSerializerOptions { WriteIndented = true });
        File.WriteAllText(ConfigPath, json);
    }

}
