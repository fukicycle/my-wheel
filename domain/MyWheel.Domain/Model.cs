using System.Text.Json.Serialization;

namespace MyWheel.Domain;

// 入力の契約。計算に使う項目だけを宣言し、名前・プリセットIDなど表示用の項目は受け取らない。
// required を付けた項目が JSON に無ければ、デシリアライズの時点で失敗する。

[JsonConverter(typeof(JsonStringEnumConverter<Side>))]
public enum Side
{
    [JsonStringEnumMemberName("left")] Left,
    [JsonStringEnumMemberName("right")] Right,
}

[JsonConverter(typeof(JsonStringEnumConverter<WheelPosition>))]
public enum WheelPosition
{
    [JsonStringEnumMemberName("front")] Front,
    [JsonStringEnumMemberName("rear")] Rear,
}

/// <summary>左右のスポーク本数の配分。2:1 は多い側を指定する</summary>
[JsonConverter(typeof(JsonStringEnumConverter<Lacing>))]
public enum Lacing
{
    [JsonStringEnumMemberName("1:1")] OneToOne,
    [JsonStringEnumMemberName("2:1-left")] TwoToOneLeft,
    [JsonStringEnumMemberName("2:1-right")] TwoToOneRight,
}

public sealed record RimSpec
{
    /// <summary>有効リム径 (mm)</summary>
    public required double Erd { get; init; }
    /// <summary>リム単体重量 (g)</summary>
    public required double Mass { get; init; }
    /// <summary>スポーク穴の左右オフセット (mm)。+ で穴が左側に寄る</summary>
    public required double Offset { get; init; }
    /// <summary>リムの許容最大張力 (kgf)。不明なら null</summary>
    public required double? MaxTensionKgf { get; init; }
}

public sealed record HubSpec
{
    public required double PcdLeft { get; init; }
    public required double PcdRight { get; init; }
    /// <summary>センターからフランジまでの距離 (mm)</summary>
    public required double FlangeLeft { get; init; }
    public required double FlangeRight { get; init; }
    /// <summary>スポーク穴径 (mm)</summary>
    public required double HoleDiameter { get; init; }
    public required double Mass { get; init; }
    /// <summary>ディスクローターが付く側。リムブレーキなら null</summary>
    public required Side? RotorSide { get; init; }

    public double Pcd(Side side) => side == Side.Left ? PcdLeft : PcdRight;
}

public sealed record SideSpec
{
    public required int Cross { get; init; }
}

public sealed record WheelBuild
{
    public required WheelPosition Position { get; init; }
    public required int Holes { get; init; }
    public required Lacing Lacing { get; init; }
    public required RimSpec Rim { get; init; }
    public required HubSpec Hub { get; init; }
    public required SideSpec Left { get; init; }
    public required SideSpec Right { get; init; }
    /// <summary>張力が高い側に掛ける目標張力 (kgf)</summary>
    public required double TargetTensionKgf { get; init; }
    /// <summary>リムテープ・バルブなどの追加重量 (g)</summary>
    public required double ExtraMass { get; init; }

    public SideSpec Of(Side side) => side == Side.Left ? Left : Right;
}

public sealed record SpokeSpec
{
    /// <summary>両端（バテッド部）の径 (mm)</summary>
    public required double EndDiameter { get; init; }
    /// <summary>中央部の丸断面換算径 (mm)。扁平スポークは断面積から換算</summary>
    public required double CenterDiameter { get; init; }
    /// <summary>ネジ径 (mm)</summary>
    public required double Thread { get; init; }
}

public sealed record NippleSpec
{
    public required double Thread { get; init; }
    public required double Mass { get; init; }
}

public sealed record SideParts
{
    public required SpokeSpec Spoke { get; init; }
    public required NippleSpec Nipple { get; init; }
}

public sealed record PartsBySide
{
    public required SideParts Left { get; init; }
    public required SideParts Right { get; init; }

    public SideParts Of(Side side) => side == Side.Left ? Left : Right;
}

/// <summary>
/// 計算の入力。部品カタログは UI 側が持つので、ID ではなく解決済みの寸法を受け取る。
/// </summary>
public sealed record CalculateRequest
{
    public required WheelBuild Wheel { get; init; }
    public required PartsBySide Parts { get; init; }
}
