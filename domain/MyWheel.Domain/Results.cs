using System.Text.Json.Serialization;

namespace MyWheel.Domain;

[JsonConverter(typeof(JsonStringEnumConverter<Severity>))]
public enum Severity
{
    [JsonStringEnumMemberName("error")] Error,
    [JsonStringEnumMemberName("warn")] Warn,
    [JsonStringEnumMemberName("info")] Info,
}

public sealed record Finding(Severity Severity, string Message);

public sealed record SideResult
{
    public required Side Side { get; init; }
    public required double Count { get; init; }
    /// <summary>フランジ上での穴のずれ角 (deg)</summary>
    public required double HubAngleDeg { get; init; }
    /// <summary>スポークがフランジを出る角度。0 = 放射、90 = 接線 (deg)</summary>
    public required double ExitAngleDeg { get; init; }
    /// <summary>接線を超えない最大クロス数</summary>
    public required int MaxCross { get; init; }
    /// <summary>実効フランジ距離（リムオフセット込み, mm）</summary>
    public required double FlangeDistance { get; init; }
    /// <summary>幾何長（穴中心〜ERD, mm）</summary>
    public required double GeometricLength { get; init; }
    /// <summary>スポーク長（穴径の半分を差し引いた値, mm）</summary>
    public required double Length { get; init; }
    /// <summary>支え角 (deg)</summary>
    public required double BracingDeg { get; init; }
    public required double TensionKgf { get; init; }
    public required double TensionN { get; init; }
    /// <summary>1本の軸剛性 (N/mm)</summary>
    public required double AxialStiffness { get; init; }
    /// <summary>張力による伸び (mm)</summary>
    public required double Elongation { get; init; }
    public required double SpokeMass { get; init; }
    public required double NippleMass { get; init; }
}

public sealed record MassBreakdown
{
    public required double Rim { get; init; }
    public required double Hub { get; init; }
    public required double Spokes { get; init; }
    public required double Nipples { get; init; }
    public required double Extra { get; init; }
    public required double Total { get; init; }
}

public sealed record WheelResult
{
    public required SideResult Left { get; init; }
    public required SideResult Right { get; init; }
    /// <summary>低張力側 ÷ 高張力側 (0〜1)</summary>
    public required double TensionRatio { get; init; }
    public required Side HighSide { get; init; }
    /// <summary>スポーク系の横剛性指標 (N/mm)。リム剛体仮定の全周合計</summary>
    public required double LateralIndex { get; init; }
    /// <summary>スポーク系の縦（半径方向）剛性指標 (N/mm)</summary>
    public required double RadialIndex { get; init; }
    public required MassBreakdown Mass { get; init; }
    public required IReadOnlyList<Finding> Findings { get; init; }

    public SideResult Of(Side side) => side == Side.Left ? Left : Right;
}
