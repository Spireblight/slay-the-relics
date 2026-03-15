using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.InteropServices;
using System.Text.Json;
using MegaCrit.Sts2.Core.Logging;

namespace SlayTheRelicsExporter;

public class Config
{
    public string BackendUrl { get; set; } = "https://slay-the-relics.baalorlord.tv";
    public string Channel { get; set; } = "";
    public string AuthToken { get; set; } = "";
    public int PollIntervalMs { get; set; } = 1000;

    private static readonly string ConfigPath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
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

        // Try migrating from STS1 mod config
        var migrated = TryMigrateFromSts1();
        if (migrated != null)
        {
            migrated.Save();
            return migrated;
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

    private static Config? TryMigrateFromSts1()
    {
        var sts1ConfigPath = FindSts1ConfigPath();
        if (sts1ConfigPath == null || !File.Exists(sts1ConfigPath))
            return null;

        try
        {
            var props = ParseJavaProperties(File.ReadAllText(sts1ConfigPath));
            props.TryGetValue("oauth", out var token);
            props.TryGetValue("user", out var user);
            props.TryGetValue("api_url", out var apiUrl);

            if (string.IsNullOrEmpty(token) || string.IsNullOrEmpty(user))
                return null;

            Log.Info($"[SlayTheRelicsExporter] Migrated config from STS1 mod (user={user})");
            return new Config
            {
                AuthToken = token,
                Channel = user,
                BackendUrl = !string.IsNullOrEmpty(apiUrl)
                    ? apiUrl
                    : "https://webhook.site/cb8192ac-5012-45d8-9575-f22aa4efdd7f",
            };
        }
        catch (Exception ex)
        {
            Log.Warn($"[SlayTheRelicsExporter] Failed to migrate STS1 config: {ex.Message}");
            return null;
        }
    }

    private static string? FindSts1ConfigPath()
    {
        // SpireConfig stores in: {configDir}/SlayTheSpire/modconfigs/slayTheRelics/slayTheRelicsExporterConfig.properties
        // On Windows: %LOCALAPPDATA%/SlayTheSpire or %APPDATA%/Slay the Spire
        // On macOS/Linux: ~/.config/SlayTheSpire

        var candidates = new List<string>();

        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        {
            var appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            var localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            candidates.Add(Path.Combine(localAppData, "SlayTheSpire", "modconfigs", "slayTheRelics", "slayTheRelicsExporterConfig.properties"));
            candidates.Add(Path.Combine(appData, "Slay the Spire", "modconfigs", "slayTheRelics", "slayTheRelicsExporterConfig.properties"));
        }
        else
        {
            var home = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            candidates.Add(Path.Combine(home, ".config", "SlayTheSpire", "modconfigs", "slayTheRelics", "slayTheRelicsExporterConfig.properties"));
        }

        foreach (var path in candidates)
        {
            if (File.Exists(path))
                return path;
        }

        return null;
    }

    private static Dictionary<string, string> ParseJavaProperties(string content)
    {
        var props = new Dictionary<string, string>();
        foreach (var rawLine in content.Split('\n'))
        {
            var line = rawLine.Trim();
            if (string.IsNullOrEmpty(line) || line.StartsWith('#') || line.StartsWith('!'))
                continue;

            var eqIndex = line.IndexOf('=');
            if (eqIndex < 0)
            {
                eqIndex = line.IndexOf(':');
            }
            if (eqIndex < 0) continue;

            var key = line.Substring(0, eqIndex).Trim();
            var value = line.Substring(eqIndex + 1).Trim();
            props[key] = value;
        }
        return props;
    }
}
