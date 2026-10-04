using System;
using System.Threading;
using System.Threading.Tasks;
using Godot;
using HarmonyLib;
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
    private static bool _sentEmptyState;
    private static bool _isAuthenticating;

    public static Config? CurrentConfig => _config;
    public static bool IsAuthenticating => _isAuthenticating;
    public static event Action? AuthStatusChanged;

    public static void Initialize()
    {
        Log.Info("[SlayTheRelicsExporter] Initializing v0.2.0");

        try
        {
            _config = Config.Load();
            _client = new BackendClient(_config);
            _exporter = new StateExporter(_config);

            var harmony = new Harmony("com.spireblight.slaytherelicsexporter");
            harmony.PatchAll();

            if (!_config.IsAuthenticated)
            {
                Log.Info("[SlayTheRelicsExporter] No credentials found, starting auth flow...");
                _ = AuthenticateAsync();
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

    public static async Task<bool> AuthenticateAsync()
    {
        if (_isAuthenticating || _config == null) return false;
        _isAuthenticating = true;
        AuthStatusChanged?.Invoke();

        try
        {
            var auth = new AuthServer(_config);
            var success = await auth.Authenticate();
            if (!success)
            {
                Log.Warn("[SlayTheRelicsExporter] Auth failed. Mod will not export game state.");
                return false;
            }

            _client = new BackendClient(_config);
            StartPolling();
            Log.Info("[SlayTheRelicsExporter] Auth complete, started polling loop");
            return true;
        }
        catch (Exception ex)
        {
            Log.Error($"[SlayTheRelicsExporter] Auth flow error: {ex}");
            return false;
        }
        finally
        {
            _isAuthenticating = false;
            AuthStatusChanged?.Invoke();
        }
    }

    private static void StartPolling()
    {
        _cts?.Cancel();
        _cts?.Dispose();
        _cts = new CancellationTokenSource();
        var token = _cts.Token;

        Task.Run(async () =>
        {
            while (!token.IsCancellationRequested)
            {
                try
                {
                    await PollOnce();
                    var interval = _config?.PollIntervalMs ?? 1000;
                    await Task.Delay(interval, token);
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

    private static Task<T> RunOnMainThread<T>(Func<T> func)
    {
        var tcs = new TaskCompletionSource<T>();
        Callable.From(() =>
        {
            try
            {
                tcs.SetResult(func());
            }
            catch (Exception ex)
            {
                tcs.SetException(ex);
            }
        }).CallDeferred();
        return tcs.Task;
    }

    private static async Task PollOnce()
    {
        try
        {
            var inRun = RunManager.Instance.IsInProgress;

            if (inRun && !_wasInRun)
            {
                _exporter!.ResetIndex();
                _sentEmptyState = false;
            }

            _wasInRun = inRun;

            if (!inRun && _sentEmptyState)
                return;

            // Game state must be read on the main thread (Godot is not thread-safe).
            var state = await RunOnMainThread(() => _exporter!.Export());

            if (state != null)
            {
                var delayMs = _config?.Delay ?? 150;
                if (delayMs > 0)
                    await Task.Delay(delayMs);

                await _client!.PostGameState(state, SerializerOptions.Default);

                if (!inRun)
                    _sentEmptyState = true;
            }
        }
        catch (Exception ex)
        {
            Log.Warn($"[SlayTheRelicsExporter] PollOnce error: {ex.Message}");
        }
    }
}
