using System;
using System.Text.Json;
using System.Text.Json.Serialization;
using MegaCrit.Sts2.Core.Models;

namespace SlayTheRelicsExporter.Serialization;

public class ModelIdJsonConverter : JsonConverter<ModelId>
{
    public override ModelId? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var str = reader.GetString();
        return str == null ? null : ModelId.Deserialize(str);
    }

    public override void Write(Utf8JsonWriter writer, ModelId value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToString());
    }
}

public class NullableModelIdJsonConverter : JsonConverter<ModelId?>
{
    public override ModelId? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null) return null;
        var str = reader.GetString();
        return str == null ? null : ModelId.Deserialize(str);
    }

    public override void Write(Utf8JsonWriter writer, ModelId? value, JsonSerializerOptions options)
    {
        if (value == null)
            writer.WriteNullValue();
        else
            writer.WriteStringValue(value.ToString());
    }
}
