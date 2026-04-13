using System;
using System.IO;
using System.Text.Json;

namespace SlayTheRelicsExporter;

public class Config
{
    public string BackendUrl { get; set; } = "https://slay-the-relics.baalorlord.tv";
    public string Channel { get; set; } = "";
    public string AuthToken { get; set; } = "";

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
            var json = File.ReadAllText(ConfigPath);
            var config = JsonSerializer.Deserialize<Config>(json);
            if (config != null && !string.IsNullOrEmpty(config.AuthToken))
                return config;
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
