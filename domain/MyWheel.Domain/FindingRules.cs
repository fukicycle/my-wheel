using System.Globalization;

namespace MyWheel.Domain;

/// <summary>組めない・危ない構成を検出して、日本語のメッセージにする</summary>
internal static class FindingRules
{
    private static readonly CultureInfo Inv = CultureInfo.InvariantCulture;

    /// <summary>JS の Number#toString と同じ最短表記</summary>
    private static string Num(double v) => v.ToString("R", Inv);
    private static string Fixed0(double v) => v.ToString("F0", Inv);

    private static string Label(Side side) => side == Side.Left ? "左" : "右";

    private static string SideName(WheelBuild build, Side side)
    {
        var tags = new List<string>(2);
        if (build.Hub.RotorSide == side) tags.Add("ローター側");
        if (build.Position == WheelPosition.Rear && side == Side.Right) tags.Add("ドライブ側");
        return tags.Count > 0 ? $"{Label(side)}（{string.Join("・", tags)}）" : Label(side);
    }

    public static List<Finding> Collect(CalculateRequest request, SideResult left, SideResult right, double ratio, Side highSide, IReadOnlyList<Side> sides)
    {
        WheelBuild build = request.Wheel;
        var output = new List<Finding>();
        void Add(Severity severity, string message) => output.Add(new Finding(severity, message));

        if (build.Lacing != Lacing.OneToOne && build.Holes % 3 != 0)
        {
            Add(Severity.Error, $"2:1組みは穴数が3の倍数のときだけ組めます（{build.Holes}H）。1:1として計算しています");
        }

        foreach (Side side in sides)
        {
            SideResult s = side == Side.Left ? left : right;
            SideSpec spec = build.Of(side);
            string name = SideName(build, side);

            if (spec.Cross > s.MaxCross)
            {
                Add(Severity.Error, $"{name}の{spec.Cross}クロスはスポークがフランジの接線を越えます（出口角{Fixed0(s.ExitAngleDeg)}°）。この寸法では{s.MaxCross}クロスまでです");
            }
            else if (s.ExitAngleDeg > 88)
            {
                Add(Severity.Warn, $"{name}はほぼ接線方向に出ます（{Fixed0(s.ExitAngleDeg)}°）。隣のスポーク頭との干渉を確認してください");
            }

            bool rotorRadial = build.Hub.RotorSide == side && spec.Cross == 0;
            bool driveRadial = build.Position == WheelPosition.Rear && side == Side.Right && spec.Cross == 0;
            if (rotorRadial) Add(Severity.Error, $"{name}がラジアル組みです。制動トルクを伝えられないため交差組みが必要です");
            if (driveRadial) Add(Severity.Error, $"{name}がラジアル組みです。駆動トルクを伝えられないため交差組みが必要です");

            SideParts parts = request.Parts.Of(side);
            if (parts.Spoke.Thread != parts.Nipple.Thread)
            {
                Add(Severity.Error, $"{name}のスポーク（ネジ径{Num(parts.Spoke.Thread)}mm）とニップル（{Num(parts.Nipple.Thread)}mm）のネジ径が合いません");
            }
        }

        if (build.Rim.MaxTensionKgf is double max && build.TargetTensionKgf > max)
        {
            Add(Severity.Error, $"目標張力{Num(build.TargetTensionKgf)}kgfがリムの上限{Num(max)}kgfを超えています");
        }

        SideResult low = highSide == Side.Left ? right : left;
        if (ratio < 0.5)
        {
            Add(Severity.Warn, $"張力比が{Fixed0(ratio * 100)}%です。低張力側（{Fixed0(low.TensionKgf)}kgf）が荷重で緩みやすくなります");
        }

        if (build.Rim.MaxTensionKgf is null)
        {
            Add(Severity.Info, "リムの許容張力が未入力です。メーカー値か、元の組みで使っていた張力を上限の目安にしてください");
        }
        return output;
    }
}
