using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace SlayTheRelicsExporter.Models;

/// <summary>
/// Wire format matching the STS1 GameState struct in the backend.
/// The extension renders this identically to STS1 data.
/// </summary>
public class ExportedState
{
    [JsonPropertyName("gameStateIndex")]
    public int GameStateIndex { get; set; }

    [JsonPropertyName("channel")]
    public string Channel { get; set; } = "";

    [JsonPropertyName("game")]
    public string Game { get; set; } = "sts2";

    // --- Same fields as STS1 ---

    [JsonPropertyName("character")]
    public string Character { get; set; } = "";

    [JsonPropertyName("boss")]
    public string Boss { get; set; } = "";

    [JsonPropertyName("relics")]
    public List<string> Relics { get; set; } = new();

    [JsonPropertyName("baseRelicStats")]
    public Dictionary<int, List<object>> BaseRelicStats { get; set; } = new();

    [JsonPropertyName("relicTips")]
    public List<TipData> RelicTips { get; set; } = new();

    [JsonPropertyName("deck")]
    public List<object> Deck { get; set; } = new();

    [JsonPropertyName("potions")]
    public List<string> Potions { get; set; } = new();

    [JsonPropertyName("additionalTips")]
    public List<TipsBoxData> AdditionalTips { get; set; } = new();

    [JsonPropertyName("staticTips")]
    public List<TipsBoxData> StaticTips { get; set; } = new();

    [JsonPropertyName("mapNodes")]
    public List<List<MapNodeData>> MapNodes { get; set; } = new();

    [JsonPropertyName("mapPath")]
    public List<List<int>> MapPath { get; set; } = new();

    [JsonPropertyName("bottles")]
    public List<int> Bottles { get; set; } = new() { -1, -1, -1 };

    [JsonPropertyName("potionX")]
    public double PotionX { get; set; } = 28;

    [JsonPropertyName("drawPile")]
    public List<object> DrawPile { get; set; } = new();

    [JsonPropertyName("discardPile")]
    public List<object> DiscardPile { get; set; } = new();

    [JsonPropertyName("exhaustPile")]
    public List<object> ExhaustPile { get; set; } = new();

    // --- New optional fields for STS2 ---

    [JsonPropertyName("cardTips")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Dictionary<string, List<TipData>>? CardTips { get; set; }

    [JsonPropertyName("potionTips")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public List<TipData>? PotionTips { get; set; }
}
