using System;
using System.Threading;
using System.Threading.Tasks;
using MegaCrit.Sts2.Core.Logging;
using MegaCrit.Sts2.Core.Modding;
using MegaCrit.Sts2.Core.Runs;
using SlayTheRelicsExporter.Serialization;

namespace SlayTheRelicsExporter;

[ModInitializer("Initialize")]
public class SlayTheRelicsExporterMod
{
    private static Config? _config;
    private static BackendClient? _client;
    private static StateExporter? _exporter;
    private static CancellationTokenSource? _cts;
    private static bool _wasInRun;

    public static void Initialize()
    {
        Log.Info("[SlayTheRelicsExporter] Initializing v0.2.0");

        try
        {
            _config = Config.Load();
            _client = new BackendClient(_config);
            _exporter = new StateExporter(_config);

            if (string.IsNullOrEmpty(_config.Channel))
            {
                Log.Warn("[SlayTheRelicsExporter] No channel configured. Set 'Channel' in config.json.");
                return;
            }

            StartPolling();
            Log.Info("[SlayTheRelicsExporter] Started polling loop");
        }
        catch (Exception ex)
        {
            Log.Error($"[SlayTheRelicsExporter] Failed to initialize: {ex}");
        }
    }

    private static void StartPolling()
    {
        _cts = new CancellationTokenSource();
        var token = _cts.Token;

        Task.Run(async () =>
        {
            while (!token.IsCancellationRequested)
            {
                try
                {
                    await PollOnce();
                }
                catch (Exception ex)
                {
                    Log.Warn($"[SlayTheRelicsExporter] Poll error: {ex.Message}");
                }

                await Task.Delay(_config!.PollIntervalMs, token);
            }
        }, token);
    }

    private static async Task PollOnce()
    {
        var inRun = RunManager.Instance.IsInProgress;

        // Detect run start → reset index
        if (inRun && !_wasInRun)
        {
            _exporter!.ResetIndex();
        }

        _wasInRun = inRun;

        if (!inRun) return;

        // Export and send game state
        var state = _exporter!.Export();
        if (state != null)
        {
            await _client!.PostGameState(state, SerializerOptions.Default);
        }
    }
}
