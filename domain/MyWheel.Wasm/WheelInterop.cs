using System.Runtime.InteropServices.JavaScript;
using System.Runtime.Versioning;
using MyWheel.Domain;
using MyWheel.Domain.Contract;

namespace MyWheel.Wasm;

/// <summary>
/// JS に公開する唯一の入口。境界をまたぐたびにマーシャリングのコストがかかるので、
/// 細かい関数を並べず「リクエストの配列 → 結果の配列」を1回で受け渡す。
/// </summary>
[SupportedOSPlatform("browser")]
public static partial class WheelInterop
{
    [JSExport]
    public static string CalculateMany(string requestsJson)
    {
        CalculateRequest[] requests = DomainJson.ParseRequests(requestsJson);
        return DomainJson.Serialize(Array.ConvertAll(requests, WheelCalculator.Calculate));
    }
}

internal static class Program
{
    // ランタイムの起動だけを行う。計算は WheelInterop から呼ばれる
    private static void Main() { }
}
