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
        AppDomain.CurrentDomain.UnhandledException += (_, args) =>
        {
            if (args.ExceptionObject is Exception ex)
                Log.Error($"[SlayTheRelicsExporter] Unhandled exception: {ex}");
        };

        TaskScheduler.UnobservedTaskException += (_, args) =>
        {
            Log.Error($"[SlayTheRelicsExporter] Unobserved task exception: {args.Exception}");
            args.SetObserved();
        };

        Log.Info("[SlayTheRelicsExporter] Initializing v0.2.0");

        try
        {
            _config = Config.Load();
            _client = new BackendClient(_config);
            _exporter = new StateExporter(_config);

            if (string.IsNullOrEmpty(_config.Channel) || string.IsNullOrEmpty(_config.AuthToken))
            {
                Log.Info("[SlayTheRelicsExporter] No credentials found, starting auth flow...");
                _ = RunAuthThenPoll();
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

    private static async Task RunAuthThenPoll()
    {
        try
        {
            var auth = new AuthServer(_config!);
            var success = await auth.Authenticate();
            if (!success)
            {
                Log.Warn("[SlayTheRelicsExporter] Auth failed. Mod will not export game state.");
                return;
            }

            // Re-create client with updated config
            _client = new BackendClient(_config!);
            StartPolling();
            Log.Info("[SlayTheRelicsExporter] Auth complete, started polling loop");
        }
        catch (Exception ex)
        {
            Log.Error($"[SlayTheRelicsExporter] Auth flow error: {ex}");
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
                    await Task.Delay(_config!.PollIntervalMs, token);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    Log.Warn($"[SlayTheRelicsExporter] Poll error: {ex.Message}");
                }
            }
        }, token);
    }

    private static async Task PollOnce()
    {
        try
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
        catch (Exception ex)
        {
            Log.Warn($"[SlayTheRelicsExporter] PollOnce error: {ex.Message}");
        }
    }
}
