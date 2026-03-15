using System.Text.Json.Serialization;

namespace SlayTheRelicsExporter.Models;

public class TipData
{
    [JsonPropertyName("header")]
    public string Header { get; set; } = "";

    [JsonPropertyName("description")]
    public string Description { get; set; } = "";

    [JsonPropertyName("img")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Img { get; set; }
}
