using System;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using Godot;
using HarmonyLib;
using MegaCrit.Sts2.Core.Logging;
using MegaCrit.Sts2.Core.Modding;
using MegaCrit.Sts2.Core.Nodes.Screens.ModdingScreen;

namespace SlayTheRelicsExporter;

public class SettingsPanel
{
    public const string NodeName = "StreSettingsPanel";

    private static readonly ConditionalWeakTable<Control, SettingsPanel> _panelMap = new();

    private readonly VBoxContainer _root;
    private readonly HSlider _pollSlider;
    private readonly Label _pollValueLabel;
    private readonly HSlider _delaySlider;
    private readonly Label _delayValueLabel;
    private readonly Button _twitchButton;
    private readonly Label _statusLabel;
    private readonly VBoxContainer _devModeBox;
    private readonly CheckBox _devModeCheckBox;
    private readonly Label _devModeDesc;

    public Control Root => _root;

    public SettingsPanel()
    {
        _root = new VBoxContainer
        {
            Name = NodeName,
            OffsetLeft = 25,
            OffsetTop = 114,
            OffsetRight = 635,
            OffsetBottom = 484,
        };
        _root.SetPosition(new Vector2(25, 114));
        _root.SetSize(new Vector2(610, 370));
        _root.AddThemeConstantOverride("separation", 10);

        Font? regularFont = null;
        Font? boldFont = null;
        if (ResourceLoader.Exists("res://themes/kreon_regular_shared.tres"))
            regularFont = ResourceLoader.Load<Font>("res://themes/kreon_regular_shared.tres");
        if (ResourceLoader.Exists("res://themes/kreon_bold_shared.tres"))
            boldFont = ResourceLoader.Load<Font>("res://themes/kreon_bold_shared.tres");

        var headerLabel = new Label
        {
            Text = "Settings",
            VerticalAlignment = VerticalAlignment.Center,
        };
        headerLabel.AddThemeFontSizeOverride("font_size", 22);
        headerLabel.AddThemeColorOverride("font_color", new Color(1.0f, 0.965f, 0.886f));
        if (boldFont != null) headerLabel.AddThemeFontOverride("font", boldFont);
        _root.AddChild(headerLabel);

        var pollBox = new VBoxContainer();
        pollBox.AddThemeConstantOverride("separation", 2);

        var pollHeader = new HBoxContainer();
        var pollTitle = new Label
        {
            Text = "Poll Interval",
            SizeFlagsHorizontal = Control.SizeFlags.ExpandFill,
            VerticalAlignment = VerticalAlignment.Center,
        };
        pollTitle.AddThemeFontSizeOverride("font_size", 16);
        pollTitle.AddThemeColorOverride("font_color", new Color(0.9f, 0.9f, 0.9f));
        if (regularFont != null) pollTitle.AddThemeFontOverride("font", regularFont);

        _pollValueLabel = new Label
        {
            Text = "1000 ms",
            HorizontalAlignment = HorizontalAlignment.Right,
            VerticalAlignment = VerticalAlignment.Center,
        };
        _pollValueLabel.AddThemeFontSizeOverride("font_size", 16);
        _pollValueLabel.AddThemeColorOverride("font_color", new Color(0.95f, 0.82f, 0.4f));
        if (boldFont != null) _pollValueLabel.AddThemeFontOverride("font", boldFont);

        pollHeader.AddChild(pollTitle);
        pollHeader.AddChild(_pollValueLabel);

        _pollSlider = new HSlider
        {
            MinValue = 200,
            MaxValue = 5000,
            Step = 100,
            Value = 1000,
            CustomMinimumSize = new Vector2(0, 20),
            SizeFlagsHorizontal = Control.SizeFlags.ExpandFill,
        };
        _pollSlider.ValueChanged += OnPollIntervalChanged;

        var pollDesc = new Label
        {
            Text = "How often game state is sent to the backend.",
        };
        pollDesc.AddThemeFontSizeOverride("font_size", 13);
        pollDesc.AddThemeColorOverride("font_color", new Color(0.65f, 0.65f, 0.65f));
        if (regularFont != null) pollDesc.AddThemeFontOverride("font", regularFont);

        pollBox.AddChild(pollHeader);
        pollBox.AddChild(_pollSlider);
        pollBox.AddChild(pollDesc);
        _root.AddChild(pollBox);

        var delayBox = new VBoxContainer();
        delayBox.AddThemeConstantOverride("separation", 2);

        var delayHeader = new HBoxContainer();
        var delayTitle = new Label
        {
            Text = "Stream Delay",
            SizeFlagsHorizontal = Control.SizeFlags.ExpandFill,
            VerticalAlignment = VerticalAlignment.Center,
        };
        delayTitle.AddThemeFontSizeOverride("font_size", 16);
        delayTitle.AddThemeColorOverride("font_color", new Color(0.9f, 0.9f, 0.9f));
        if (regularFont != null) delayTitle.AddThemeFontOverride("font", regularFont);

        _delayValueLabel = new Label
        {
            Text = "150 ms",
            HorizontalAlignment = HorizontalAlignment.Right,
            VerticalAlignment = VerticalAlignment.Center,
        };
        _delayValueLabel.AddThemeFontSizeOverride("font_size", 16);
        _delayValueLabel.AddThemeColorOverride("font_color", new Color(0.95f, 0.82f, 0.4f));
        if (boldFont != null) _delayValueLabel.AddThemeFontOverride("font", boldFont);

        delayHeader.AddChild(delayTitle);
        delayHeader.AddChild(_delayValueLabel);

        _delaySlider = new HSlider
        {
            MinValue = 0,
            MaxValue = 10000,
            Step = 50,
            Value = 150,
            CustomMinimumSize = new Vector2(0, 20),
            SizeFlagsHorizontal = Control.SizeFlags.ExpandFill,
        };
        _delaySlider.ValueChanged += OnDelayChanged;

        var delayDesc = new Label
        {
            Text = "Syncs overlay output with Twitch stream encoding delay.",
        };
        delayDesc.AddThemeFontSizeOverride("font_size", 13);
        delayDesc.AddThemeColorOverride("font_color", new Color(0.65f, 0.65f, 0.65f));
        if (regularFont != null) delayDesc.AddThemeFontOverride("font", regularFont);

        delayBox.AddChild(delayHeader);
        delayBox.AddChild(_delaySlider);
        delayBox.AddChild(delayDesc);
        _root.AddChild(delayBox);

        var twitchRow = new HBoxContainer();
        twitchRow.AddThemeConstantOverride("separation", 14);

        _twitchButton = new Button
        {
            Text = "Connect with Twitch",
            CustomMinimumSize = new Vector2(210, 36),
        };
        _twitchButton.AddThemeFontSizeOverride("font_size", 15);
        if (regularFont != null) _twitchButton.AddThemeFontOverride("font", regularFont);
        _twitchButton.Pressed += OnTwitchButtonPressed;

        _statusLabel = new Label
        {
            VerticalAlignment = VerticalAlignment.Center,
            SizeFlagsHorizontal = Control.SizeFlags.ExpandFill,
        };
        _statusLabel.AddThemeFontSizeOverride("font_size", 15);
        if (regularFont != null) _statusLabel.AddThemeFontOverride("font", regularFont);

        twitchRow.AddChild(_twitchButton);
        twitchRow.AddChild(_statusLabel);
        _root.AddChild(twitchRow);

        _devModeBox = new VBoxContainer { Visible = false };
        _devModeBox.AddThemeConstantOverride("separation", 2);

        _devModeCheckBox = new CheckBox
        {
            Text = "Dev Mode (use local config.dev.json)",
        };
        _devModeCheckBox.AddThemeFontSizeOverride("font_size", 15);
        _devModeCheckBox.AddThemeColorOverride("font_color", new Color(0.95f, 0.82f, 0.4f));
        if (regularFont != null) _devModeCheckBox.AddThemeFontOverride("font", regularFont);
        _devModeCheckBox.Toggled += OnDevModeToggled;

        _devModeDesc = new Label
        {
            Text = "Switches to local backend until unchecked or game restarts.",
        };
        _devModeDesc.AddThemeFontSizeOverride("font_size", 13);
        _devModeDesc.AddThemeColorOverride("font_color", new Color(0.65f, 0.65f, 0.65f));
        if (regularFont != null) _devModeDesc.AddThemeFontOverride("font", regularFont);

        _devModeBox.AddChild(_devModeCheckBox);
        _devModeBox.AddChild(_devModeDesc);
        _root.AddChild(_devModeBox);

        SlayTheRelicsExporterMod.AuthStatusChanged += OnAuthStatusChanged;
        _root.TreeExited += OnTreeExited;

        Refresh();
    }

    private void OnPollIntervalChanged(double value)
    {
        var ms = (int)value;
        _pollValueLabel.Text = $"{ms} ms";
        var config = SlayTheRelicsExporterMod.CurrentConfig;
        if (config != null && config.PollIntervalMs != ms)
        {
            config.PollIntervalMs = ms;
            config.Save();
        }
    }

    private void OnDelayChanged(double value)
    {
        var ms = (int)value;
        _delayValueLabel.Text = $"{ms} ms";
        var config = SlayTheRelicsExporterMod.CurrentConfig;
        if (config != null && config.Delay != ms)
        {
            config.Delay = ms;
            config.Save();
        }
    }

    private void OnTwitchButtonPressed()
    {
        _twitchButton.Disabled = true;
        _twitchButton.Text = "Connecting...";
        Task.Run(async () =>
        {
            await SlayTheRelicsExporterMod.AuthenticateAsync();
        });
    }

    private void OnDevModeToggled(bool toggledOn)
    {
        SlayTheRelicsExporterMod.SetDevMode(toggledOn);
        Refresh();
    }

    private void OnAuthStatusChanged()
    {
        Callable.From(Refresh).CallDeferred();
    }

    private void OnTreeExited()
    {
        SlayTheRelicsExporterMod.AuthStatusChanged -= OnAuthStatusChanged;
    }

    public void Refresh()
    {
        if (_root == null || !GodotObject.IsInstanceValid(_root)) return;

        var config = SlayTheRelicsExporterMod.CurrentConfig;
        if (config != null)
        {
            _pollSlider.SetValueNoSignal(config.PollIntervalMs);
            _pollValueLabel.Text = $"{config.PollIntervalMs} ms";
            _delaySlider.SetValueNoSignal(config.Delay);
            _delayValueLabel.Text = $"{config.Delay} ms";
        }

        _devModeBox.Visible = Config.DevConfigExists;
        _devModeCheckBox.SetPressedNoSignal(SlayTheRelicsExporterMod.IsDevMode);
        if (SlayTheRelicsExporterMod.IsDevMode && config != null)
        {
            _devModeDesc.Text = $"Active endpoint: {config.BackendUrl}";
        }
        else
        {
            _devModeDesc.Text = "Switches to local backend until unchecked or game restarts.";
        }

        UpdateStatus();
    }

    public void UpdateStatus()
    {
        if (_statusLabel == null || !GodotObject.IsInstanceValid(_statusLabel)) return;

        var config = SlayTheRelicsExporterMod.CurrentConfig;
        var isAuth = config?.IsAuthenticated == true;
        var modeSuffix = SlayTheRelicsExporterMod.IsDevMode ? " [DEV]" : "";

        if (SlayTheRelicsExporterMod.IsAuthenticating)
        {
            _twitchButton.Disabled = true;
            _twitchButton.Text = "Connecting...";
            _statusLabel.Text = $"Waiting for browser login...{modeSuffix}";
            _statusLabel.AddThemeColorOverride("font_color", new Color(0.95f, 0.75f, 0.3f));
        }
        else if (isAuth)
        {
            _twitchButton.Disabled = false;
            _twitchButton.Text = "Reconnect Twitch";
            _statusLabel.Text = $"✓ Connected ({config!.Channel}){modeSuffix}";
            _statusLabel.AddThemeColorOverride(
                "font_color",
                SlayTheRelicsExporterMod.IsDevMode
                    ? new Color(0.4f, 0.85f, 0.95f)
                    : new Color(0.35f, 0.85f, 0.35f));
        }
        else
        {
            _twitchButton.Disabled = false;
            _twitchButton.Text = "Connect with Twitch";
            _statusLabel.Text = $"✗ Not Connected{modeSuffix}";
            _statusLabel.AddThemeColorOverride("font_color", new Color(0.9f, 0.35f, 0.35f));
        }
    }

    public static SettingsPanel GetOrCreate(NModInfoContainer container)
    {
        var existing = container.GetNodeOrNull<Control>(NodeName);
        if (existing != null && _panelMap.TryGetValue(existing, out var panel))
        {
            return panel;
        }

        var newPanel = new SettingsPanel();
        container.AddChild(newPanel.Root);
        _panelMap.Add(newPanel.Root, newPanel);
        return newPanel;
    }
}

[HarmonyPatch(typeof(NModInfoContainer), nameof(NModInfoContainer.Fill))]
internal static class ModInfoContainerFillPatch
{
    private static void Postfix(NModInfoContainer __instance, Mod mod)
    {
        try
        {
            var isStre = mod?.manifest?.id == "SlayTheRelicsExporter";
            var modImage = __instance.GetNodeOrNull<Control>("ModImage");

            if (isStre)
            {
                if (modImage != null)
                    modImage.Visible = false;

                var panel = SettingsPanel.GetOrCreate(__instance);
                panel.Refresh();
                panel.Root.Visible = true;
            }
            else
            {
                if (modImage != null)
                    modImage.Visible = true;

                var existing = __instance.GetNodeOrNull<Control>(SettingsPanel.NodeName);
                if (existing != null)
                    existing.Visible = false;
            }
        }
        catch (Exception ex)
        {
            Log.Error($"[SlayTheRelicsExporter] Error in ModInfoContainer.Fill patch: {ex}");
        }
    }
}

[HarmonyPatch(typeof(NModInfoContainer), nameof(NModInfoContainer.Clear))]
internal static class ModInfoContainerClearPatch
{
    private static void Postfix(NModInfoContainer __instance)
    {
        try
        {
            var modImage = __instance.GetNodeOrNull<Control>("ModImage");
            if (modImage != null)
                modImage.Visible = true;

            var existing = __instance.GetNodeOrNull<Control>(SettingsPanel.NodeName);
            if (existing != null)
                existing.Visible = false;
        }
        catch (Exception ex)
        {
            Log.Error($"[SlayTheRelicsExporter] Error in ModInfoContainer.Clear patch: {ex}");
        }
    }
}
