using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace MyWheel.Domain.Contract;

/// <summary>
/// JS との境界で使う JSON の契約。ソース生成なので WASM でトリミングしても壊れない。
/// TypeScript 側の型は src/domain/contract.ts の zod スキーマで、この形と一致させる。
/// </summary>
[JsonSourceGenerationOptions(
    PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase,
    RespectNullableAnnotations = true,
    RespectRequiredConstructorParameters = true,
    NumberHandling = JsonNumberHandling.Strict)]
[JsonSerializable(typeof(CalculateRequest))]
[JsonSerializable(typeof(CalculateRequest[]))]
[JsonSerializable(typeof(WheelResult))]
[JsonSerializable(typeof(WheelResult[]))]
public sealed partial class DomainJsonContext : JsonSerializerContext;

public static class DomainJson
{
    // 日本語のメッセージを \uXXXX にエスケープしない（JSON.parse には影響せず、受け渡しが小さくなる）
    private static readonly DomainJsonContext Context = new(new JsonSerializerOptions(DomainJsonContext.Default.Options)
    {
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
    });

    public static CalculateRequest[] ParseRequests(string json) =>
        JsonSerializer.Deserialize(json, Context.CalculateRequestArray)
        ?? throw new JsonException("リクエストが null です");

    public static string Serialize(WheelResult[] results) =>
        JsonSerializer.Serialize(results, Context.WheelResultArray);
}
