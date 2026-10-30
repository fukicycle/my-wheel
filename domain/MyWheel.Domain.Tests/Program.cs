using System.Globalization;
using System.Text.Json;
using System.Text.Json.Nodes;
using MyWheel.Domain;
using MyWheel.Domain.Contract;

// golden.json は旧 TypeScript 実装の出力。C# の結果を JSON にしてから木構造で突き合わせるので、
// 計算値だけでなく「プロパティ名・列挙値の綴り・欠落」といった JS との契約のズレもここで落ちる。

const double RelTol = 1e-12;
const double AbsTol = 1e-9;

string path = Path.Combine(AppContext.BaseDirectory, "golden.json");
JsonArray cases = JsonNode.Parse(File.ReadAllText(path))?.AsArray()
    ?? throw new InvalidOperationException("golden.json を読めません");

var requests = DomainJson.ParseRequests(new JsonArray(cases.Select(c => c!["request"]!.DeepClone()).ToArray()).ToJsonString());
var results = requests.Select(WheelCalculator.Calculate).ToArray();
JsonArray actual = JsonNode.Parse(DomainJson.Serialize(results))!.AsArray();

var failures = new List<string>();
for (int i = 0; i < cases.Count; i++)
{
    Compare(cases[i]!["expected"], actual[i], $"case[{i}]", failures);
}

failures.AddRange(ContractChecks());

if (failures.Count > 0)
{
    foreach (string f in failures.Take(50)) Console.Error.WriteLine(f);
    Console.Error.WriteLine($"FAILED: {failures.Count} 件の不一致（{cases.Count} ケース）");
    return 1;
}
Console.WriteLine($"OK: {cases.Count} ケースすべて一致");
return 0;

static void Compare(JsonNode? expected, JsonNode? actual, string at, List<string> failures)
{
    switch (expected)
    {
        case JsonObject eo when actual is JsonObject ao:
            foreach (var key in eo.Select(p => p.Key).Union(ao.Select(p => p.Key)))
            {
                if (!eo.ContainsKey(key)) failures.Add($"{at}.{key}: C# にだけ存在");
                else if (!ao.ContainsKey(key)) failures.Add($"{at}.{key}: C# に存在しない");
                else Compare(eo[key], ao[key], $"{at}.{key}", failures);
            }
            break;
        case JsonArray ea when actual is JsonArray aa:
            if (ea.Count != aa.Count) failures.Add($"{at}: 要素数 {ea.Count} ≠ {aa.Count}");
            for (int i = 0; i < Math.Min(ea.Count, aa.Count); i++) Compare(ea[i], aa[i], $"{at}[{i}]", failures);
            break;
        case JsonValue ev when actual is JsonValue av:
            if (ev.GetValueKind() == JsonValueKind.Number && av.GetValueKind() == JsonValueKind.Number)
            {
                double e = ev.GetValue<double>();
                double a = av.GetValue<double>();
                double diff = Math.Abs(e - a);
                if (diff > AbsTol && diff > RelTol * Math.Abs(e))
                    failures.Add($"{at}: 期待 {e.ToString("R", CultureInfo.InvariantCulture)} / 実際 {a.ToString("R", CultureInfo.InvariantCulture)}");
            }
            else if (ev.ToJsonString() != av.ToJsonString())
            {
                failures.Add($"{at}: 期待 {ev} / 実際 {av}");
            }
            break;
        default:
            failures.Add($"{at}: 型が違う（期待 {expected?.GetValueKind()} / 実際 {actual?.GetValueKind()}）");
            break;
    }
}

// 境界で壊れた入力を受け取ったら、0 で埋めて黙って計算せずに失敗すること
static IEnumerable<string> ContractChecks()
{
    var good = """
        [{"wheel":{"position":"front","holes":28,"lacing":"1:1",
          "rim":{"erd":569,"mass":320,"offset":0,"maxTensionKgf":null},
          "hub":{"pcdLeft":44,"pcdRight":44,"flangeLeft":22.4,"flangeRight":35,"holeDiameter":2.6,"mass":136,"rotorSide":"left"},
          "left":{"cross":3},"right":{"cross":3},"targetTensionKgf":110,"extraMass":0},
          "parts":{"left":{"spoke":{"endDiameter":1.8,"centerDiameter":1.6,"thread":1.8},"nipple":{"thread":1.8,"mass":0.35}},
                   "right":{"spoke":{"endDiameter":1.8,"centerDiameter":1.6,"thread":1.8},"nipple":{"thread":1.8,"mass":0.35}}}}]
        """;
    if (Throws(good)) yield return "contract: 正しい入力が拒否された";

    (string Name, string Json)[] broken =
    [
        ("必須項目の欠落", good.Replace("\"erd\":569,", "")),
        ("列挙値の綴り違い", good.Replace("\"lacing\":\"1:1\"", "\"lacing\":\"one-to-one\"")),
        ("数値が文字列", good.Replace("\"holes\":28", "\"holes\":\"28\"")),
        ("null 不可に null", good.Replace("\"mass\":320", "\"mass\":null")),
        ("整数に小数", good.Replace("\"holes\":28", "\"holes\":28.5")),
    ];
    foreach (var (name, json) in broken)
    {
        if (json == good) yield return $"contract: テスト自体が壊れている（{name} の置換が効いていない）";
        else if (!Throws(json)) yield return $"contract: {name} を受け入れてしまった";
    }

    static bool Throws(string json)
    {
        try { DomainJson.ParseRequests(json); return false; }
        catch (JsonException) { return true; }
    }
}
