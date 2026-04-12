using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Godot;
using MegaCrit.Sts2.Core.Logging;

namespace SlayTheRelicsExporter;

internal static class ModConfigBridge
{
    private const string ModId = "SlayTheRelicsExporter";
    private const string DisplayName = "Slay The Relics Exporter";
    private const int DefaultPollIntervalMs = 1000;
    private const int DefaultDelayMs = 150;

    private static bool _available;
    private static bool _registered;
    private static Type? _apiType;
    private static Type? _entryType;
    private static Type? _configTypeEnum;

    internal static bool IsAvailable => _available;

    internal static Action? OnConnectTwitch { get; set; }
    internal static Func<bool>? IsAuthenticated { get; set; }

    // Deferred to next frame so ModConfig has time to load first.
    internal static void DeferredRegister()
    {
        var tree = (SceneTree)Engine.GetMainLoop();
        tree.ProcessFrame += OnNextFrame;
    }

    private static void OnNextFrame()
    {
        var tree = (SceneTree)Engine.GetMainLoop();
        tree.ProcessFrame -= OnNextFrame;
        Detect();
        if (_available) Register();
    }

    private static void Detect()
    {
        try
        {
            var allTypes = AppDomain.CurrentDomain.GetAssemblies()
                .SelectMany(a =>
                {
                    try { return a.GetTypes(); }
                    catch { return Type.EmptyTypes; }
                })
                .ToArray();

            _apiType = allTypes.FirstOrDefault(t => t.FullName == "ModConfig.ModConfigApi");
            _entryType = allTypes.FirstOrDefault(t => t.FullName == "ModConfig.ConfigEntry");
            _configTypeEnum = allTypes.FirstOrDefault(t => t.FullName == "ModConfig.ConfigType");
            _available = _apiType != null && _entryType != null && _configTypeEnum != null;

            if (_available)
                Log.Info("[SlayTheRelicsExporter] ModConfig detected");
            else
                Log.Info("[SlayTheRelicsExporter] ModConfig not found, using defaults");
        }
        catch
        {
            _available = false;
        }
    }

    private static void Register()
    {
        if (_registered) return;
        _registered = true;

        try
        {
            var entries = BuildEntries();

            var registerMethod = _apiType!.GetMethods(BindingFlags.Public | BindingFlags.Static)
                .Where(m => m.Name == "Register")
                .OrderByDescending(m => m.GetParameters().Length)
                .First();

            if (registerMethod.GetParameters().Length == 4)
            {
                var displayNames = new Dictionary<string, string>
                {
                    ["en"] = DisplayName,
                };
                registerMethod.Invoke(null, new object[] { ModId, DisplayName, displayNames, entries });
            }
            else
            {
                registerMethod.Invoke(null, new object[] { ModId, DisplayName, entries });
            }

            StartWatchingUI();
            Log.Info("[SlayTheRelicsExporter] ModConfig entries registered");
        }
        catch (Exception e)
        {
            Log.Warn($"[SlayTheRelicsExporter] ModConfig registration failed: {e}");
        }
    }

    internal static T GetValue<T>(string key, T fallback)
    {
        if (!_available) return fallback;
        try
        {
            var result = _apiType!.GetMethod("GetValue", BindingFlags.Public | BindingFlags.Static)
                ?.MakeGenericMethod(typeof(T))
                ?.Invoke(null, new object[] { ModId, key });
            return result != null ? (T)result : fallback;
        }
        catch { return fallback; }
    }

    internal static void SetValue(string key, object value)
    {
        if (!_available) return;
        try
        {
            _apiType!.GetMethod("SetValue", BindingFlags.Public | BindingFlags.Static)
                ?.Invoke(null, new object[] { ModId, key, value });
        }
        catch { /* graceful fallback */ }
    }

    internal static int PollIntervalMs =>
        (int)GetValue("pollIntervalMs", (float)DefaultPollIntervalMs);

    internal static int Delay => (int)GetValue("delay", (float)DefaultDelayMs);

    private static Array BuildEntries()
    {
        var list = new List<object>();

        // ── Connection Settings ─────────────────────────────────
        list.Add(Entry(cfg =>
        {
            Set(cfg, "Label", "Connection Settings");
            Set(cfg, "Type", EnumVal("Header"));
        }));

        list.Add(Entry(cfg =>
        {
            Set(cfg, "Key", "pollIntervalMs");
            Set(cfg, "Label", "Poll Interval (ms)");
            Set(cfg, "Type", EnumVal("Slider"));
            Set(cfg, "DefaultValue", (object)1000.0f);
            Set(cfg, "Min", 200.0f);
            Set(cfg, "Max", 5000.0f);
            Set(cfg, "Step", 100.0f);
            Set(cfg, "Format", "F0");
            Set(cfg, "Description", "How often game state is sent to the backend (in milliseconds)");
            Set(cfg, "OnChanged", new Action<object>(_ => { }));
        }));

        list.Add(Entry(cfg =>
        {
            Set(cfg, "Key", "delay");
            Set(cfg, "Label", "Delay (ms)");
            Set(cfg, "Type", EnumVal("Slider"));
            Set(cfg, "DefaultValue", (object)(float)DefaultDelayMs);
            Set(cfg, "Min", 0.0f);
            Set(cfg, "Max", 10000.0f);
            Set(cfg, "Step", 50.0f);
            Set(cfg, "Format", "F0");
            Set(cfg, "Description", "Adjusts sync timing for stream encoding delay. Higher values delay the extension output to better match what viewers see on stream.");
            Set(cfg, "OnChanged", new Action<object>(_ => { }));
        }));

        list.Add(Entry(cfg =>
        {
            Set(cfg, "Key", "connectTwitch");
            Set(cfg, "Label", "Connect with Twitch");
            Set(cfg, "Type", EnumVal("Button"));
            Set(cfg, "OnChanged", new Action<object>(_ => OnConnectTwitch?.Invoke()));
        }));

        var result = Array.CreateInstance(_entryType!, list.Count);
        for (int i = 0; i < list.Count; i++)
            result.SetValue(list[i], i);
        return result;
    }

    // Inject a live ✓/✗ status label next to the Twitch button.
    // Re-fires on ModConfig RefreshUI() since NodeAdded triggers again.
    private const string EntriesNodeName = "Entries_SlayTheRelicsExporter";
    private static Label? _statusLabel;

    private static void StartWatchingUI()
    {
        var tree = (SceneTree)Engine.GetMainLoop();
        tree.NodeAdded += OnNodeAdded;
    }

    private static void OnNodeAdded(Node node)
    {
        if (node.Name != EntriesNodeName) return;

        Callable.From(() => InjectStatus(node as VBoxContainer)).CallDeferred();
    }

    private static void InjectStatus(VBoxContainer? entriesBox)
    {
        if (entriesBox == null) return;

        foreach (var child in entriesBox.GetChildren())
        {
            if (child is not HBoxContainer hbox) continue;
            foreach (var inner in hbox.GetChildren())
            {
                if (inner is not Button btn) continue;
                if (btn.Text != "Connect with Twitch") continue;

                _statusLabel = new Label
                {
                    SizeFlagsHorizontal = Control.SizeFlags.ShrinkEnd,
                    VerticalAlignment = VerticalAlignment.Center,
                };
                _statusLabel.AddThemeFontSizeOverride("font_size", 18);
                hbox.AddChild(_statusLabel);
                UpdateStatusLabel();
                return;
            }
        }
    }

    internal static void UpdateStatusLabel()
    {
        if (_statusLabel == null || !GodotObject.IsInstanceValid(_statusLabel)) return;
        var connected = IsAuthenticated?.Invoke() == true;
        _statusLabel.Text = connected ? "  ✓" : "  ✗";
        _statusLabel.AddThemeColorOverride("font_color",
            connected ? new Color(0.4f, 0.9f, 0.4f) : new Color(0.9f, 0.4f, 0.4f));
    }

    private static object Entry(Action<object> configure)
    {
        var inst = Activator.CreateInstance(_entryType!)!;
        configure(inst);
        return inst;
    }

    private static void Set(object obj, string name, object value)
        => obj.GetType().GetProperty(name)?.SetValue(obj, value);

    private static object EnumVal(string name)
        => Enum.Parse(_configTypeEnum!, name);
}
