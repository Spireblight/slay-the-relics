using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace SlayTheRelicsExporter.Models;

public class HitBoxData
{
    [JsonPropertyName("x")]
    public double X { get; set; }

    [JsonPropertyName("y")]
    public double Y { get; set; }

    [JsonPropertyName("w")]
    public double W { get; set; }

    [JsonPropertyName("h")]
    public double H { get; set; }

    [JsonPropertyName("z")]
    public double Z { get; set; }
}

public class TipsBoxData
{
    [JsonPropertyName("tips")]
    public List<TipData> Tips { get; set; } = new();

    [JsonPropertyName("hitbox")]
    public HitBoxData Hitbox { get; set; } = new();
}
