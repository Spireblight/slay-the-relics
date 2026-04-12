using System;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using MegaCrit.Sts2.Core.Logging;

namespace SlayTheRelicsExporter;

public class AuthServer
{
    private const int Port = 49000;
    private const string RedirectUri = "http://localhost:49000";

    private static readonly string ClientId = "ebkycs9lir8pbic2r0b7wa6bg6n7ua";
    private readonly Config _config;

    public AuthServer(Config config)
    {
        _config = config;
    }

    public async Task<bool> Authenticate()
    {
        var state = GenerateState();
        string? code = null;

        var listener = new HttpListener();
        listener.Prefixes.Add($"http://localhost:{Port}/");
        listener.Start();

        try
        {
            // Open browser to local server
            OpenBrowser($"http://localhost:{Port}");

            // Handle requests until we get the auth code
            while (code == null)
            {
                var ctx = await listener.GetContextAsync();
                code = HandleRequest(ctx, state);
            }
        }
        finally
        {
            listener.Stop();
        }

        // Exchange code for user + token via backend
        return await ExchangeCode(code);
    }

    private string? HandleRequest(HttpListenerContext ctx, string state)
    {
        var request = ctx.Request;
        var response = ctx.Response;

        if (request.HttpMethod != "GET" || request.Url?.AbsolutePath != "/")
        {
            response.StatusCode = 404;
            response.Close();
            return null;
        }

        var query = request.Url.Query;
        if (string.IsNullOrEmpty(query))
        {
            // Serve the OAuth initiation page
            var html = GetIndexHtml(state);
            var bytes = Encoding.UTF8.GetBytes(html);
            response.ContentType = "text/html; charset=utf-8";
            response.ContentLength64 = bytes.Length;
            response.OutputStream.Write(bytes, 0, bytes.Length);
            response.Close();
            return null;
        }

        // Parse callback params
        var queryParams = System.Web.HttpUtility.ParseQueryString(query);
        var code = queryParams["code"];
        var returnedState = queryParams["state"];

        if (returnedState != state || string.IsNullOrEmpty(code))
        {
            response.StatusCode = 400;
            var errBytes = Encoding.UTF8.GetBytes("Invalid state parameter.");
            response.OutputStream.Write(errBytes, 0, errBytes.Length);
            response.Close();
            return null;
        }

        // Serve success page
        var successHtml = GetSuccessHtml();
        var successBytes = Encoding.UTF8.GetBytes(successHtml);
        response.ContentType = "text/html; charset=utf-8";
        response.ContentLength64 = successBytes.Length;
        response.OutputStream.Write(successBytes, 0, successBytes.Length);
        response.Close();

        return code;
    }

    private async Task<bool> ExchangeCode(string code)
    {
        try
        {
            using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(15) };
            var body = JsonSerializer.Serialize(new { code });
            var content = new StringContent(body, Encoding.UTF8, "application/json");

            var resp = await http.PostAsync($"{_config.BackendUrl}/api/v1/auth", content);
            resp.EnsureSuccessStatusCode();

            var json = await resp.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            var user = root.GetProperty("user").GetString();
            var token = root.GetProperty("token").GetString();

            if (string.IsNullOrEmpty(user) || string.IsNullOrEmpty(token))
            {
                Log.Warn("[SlayTheRelicsExporter] Auth response missing user or token");
                return false;
            }

            _config.Channel = user;
            _config.AuthToken = token;
            _config.Save();

            Log.Info($"[SlayTheRelicsExporter] Authenticated as user {user}");
            return true;
        }
        catch (Exception ex)
        {
            Log.Warn($"[SlayTheRelicsExporter] Auth code exchange failed: {ex.Message}");
            return false;
        }
    }

    private static string GenerateState()
    {
        var bytes = new byte[24];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToBase64String(bytes).Replace("+", "-").Replace("/", "_").TrimEnd('=');
    }

    private static void OpenBrowser(string url)
    {
        try
        {
            if (OperatingSystem.IsWindows())
                System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(url) { UseShellExecute = true });
            else if (OperatingSystem.IsMacOS())
                System.Diagnostics.Process.Start("open", url);
            else
                System.Diagnostics.Process.Start("xdg-open", url);
        }
        catch (Exception ex)
        {
            Log.Warn($"[SlayTheRelicsExporter] Failed to open browser: {ex.Message}");
            Log.Info($"[SlayTheRelicsExporter] Please open manually: {url}");
        }
    }

    private static string GetIndexHtml(string state)
    {
        var authUrl = $"https://id.twitch.tv/oauth2/authorize?response_type=code&client_id={ClientId}&redirect_uri={Uri.EscapeDataString(RedirectUri)}&scope=user%3Aread%3Afollows&state={state}";
        return $"""
            <!DOCTYPE html>
            <html lang="en">
            <head><meta charset="utf-8"><title>Slay the Relics</title></head>
            <body>
            <h1>Slay the Relics Exporter</h1>
            <p>Click the link below to connect your Twitch account:</p>
            <a href="{authUrl}">Connect with Twitch</a>
            <script>window.location.href = "{authUrl}";</script>
            </body>
            </html>
            """;
    }

    private static string GetSuccessHtml()
    {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head><meta charset="utf-8"><title>Slay the Relics</title></head>
            <body>
            <h1>Slay the Relics Exporter</h1>
            <p>Successfully connected to Twitch, you may close this tab now.</p>
            </body>
            </html>
            """;
    }
}
