using System;
using System.IO;
using System.IO.Compression;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using MegaCrit.Sts2.Core.Logging;

namespace SlayTheRelicsExporter;

public class BackendClient : IDisposable
{
    private readonly HttpClient _http = new();
    private readonly Config _config;
    private int _consecutiveErrors;

    public BackendClient(Config config)
    {
        _config = config;
        _http.Timeout = TimeSpan.FromSeconds(10);
    }

    public async Task PostGameState(object state, JsonSerializerOptions options)
    {
        await PostJson("/api/v2/game-state", state, options);
    }

    private async Task PostJson(string path, object data, JsonSerializerOptions options)
    {
        try
        {
            var json = JsonSerializer.Serialize(data, options);
            var compressed = GzipCompress(Encoding.UTF8.GetBytes(json));

            var request = new HttpRequestMessage(HttpMethod.Post, _config.BackendUrl + path);
            request.Content = new ByteArrayContent(compressed);
            request.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/json");
            request.Content.Headers.ContentEncoding.Add("gzip");

            if (!string.IsNullOrEmpty(_config.AuthToken))
            {
                request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _config.AuthToken);
            }

            var response = await _http.SendAsync(request);
            response.EnsureSuccessStatusCode();
            _consecutiveErrors = 0;
        }
        catch (Exception ex)
        {
            _consecutiveErrors++;
            if (_consecutiveErrors <= 3 || _consecutiveErrors % 30 == 0)
            {
                Log.Warn($"[SlayTheRelicsExporter] POST {path} failed ({_consecutiveErrors}x): {ex.Message}");
            }
        }
    }

    private static byte[] GzipCompress(byte[] data)
    {
        using var output = new MemoryStream();
        using (var gz = new GZipStream(output, CompressionLevel.Optimal))
        {
            gz.Write(data, 0, data.Length);
        }
        return output.ToArray();
    }

    public void Dispose()
    {
        _http.Dispose();
    }
}
