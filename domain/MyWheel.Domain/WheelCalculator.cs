namespace MyWheel.Domain;

/// <summary>
/// 手組みホイールの計算。UI にも JSON にも依存しない純粋関数だけで構成する。
/// </summary>
public static class WheelCalculator
{
    /// <summary>ステンレススポークのヤング率 (N/mm²)</summary>
    private const double ESteel = 200_000;
    /// <summary>ステンレスの密度 (g/mm³)</summary>
    private const double DensitySteel = 7.9e-3;
    /// <summary>バテッドスポークの太い部分の合計長（頭側＋ネジ側, mm）</summary>
    private const double ButtLength = 70;
    public const double Kgf = 9.80665;

    private static double Deg(double rad) => rad * 180 / Math.PI;
    private static double Rad(double deg) => deg * Math.PI / 180;
    private static double Area(double d) => Math.PI * d * d / 4;

    private static readonly Side[] Sides = [Side.Left, Side.Right];

    public static (double Left, double Right) SideCounts(int holes, Lacing lacing)
    {
        if (lacing == Lacing.OneToOne || holes % 3 != 0) return (holes / 2.0, holes / 2.0);
        double many = holes * 2 / 3.0;
        double few = holes / 3.0;
        return lacing == Lacing.TwoToOneLeft ? (many, few) : (few, many);
    }

    public static double SpokeMass(SpokeSpec spoke, double length)
    {
        ArgumentNullException.ThrowIfNull(spoke);
        double butt = ButtedLength(spoke, length);
        double volume = Area(spoke.EndDiameter) * butt + Area(spoke.CenterDiameter) * (length - butt);
        return volume * DensitySteel;
    }

    public static double SpokeAxialStiffness(SpokeSpec spoke, double length)
    {
        ArgumentNullException.ThrowIfNull(spoke);
        double butt = ButtedLength(spoke, length);
        double compliance = butt / (ESteel * Area(spoke.EndDiameter)) + (length - butt) / (ESteel * Area(spoke.CenterDiameter));
        return 1 / compliance;
    }

    private static double ButtedLength(SpokeSpec spoke, double length) =>
        spoke.EndDiameter == spoke.CenterDiameter ? length : Math.Min(length, ButtLength);

    public readonly record struct Geometry(
        double HubAngleDeg,
        double ExitAngleDeg,
        int MaxCross,
        double GeometricLength,
        double Length,
        double SinBracing);

    public static Geometry SideGeometry(double erd, double pcd, double flangeDistance, double count, int cross, double holeDiameter)
    {
        double bigR = erd / 2;
        double r = pcd / 2;
        double alpha = count > 0 ? 2 * Math.PI * cross / count : 0;
        double chord = Math.Sqrt(bigR * bigR + r * r - 2 * bigR * r * Math.Cos(alpha));
        double geometricLength = Math.Sqrt(chord * chord + flangeDistance * flangeDistance);
        double cosExit = (bigR * Math.Cos(alpha) - r) / chord;
        double exitAngle = Deg(Math.Acos(Math.Clamp(cosExit, -1, 1)));
        double tangentAlpha = Math.Acos(r / bigR);
        // 接線角を超えない最大の整数クロス数
        int maxCross = count > 0 ? (int)Math.Max(0, Math.Ceiling(tangentAlpha * count / (2 * Math.PI)) - 1) : 0;
        return new Geometry(
            HubAngleDeg: Deg(alpha),
            ExitAngleDeg: exitAngle,
            MaxCross: maxCross,
            GeometricLength: geometricLength,
            Length: geometricLength - holeDiameter / 2,
            SinBracing: flangeDistance / geometricLength);
    }

    public static WheelResult Calculate(CalculateRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);
        WheelBuild build = request.Wheel;
        RimSpec rim = build.Rim;
        HubSpec hub = build.Hub;

        var (countLeft, countRight) = SideCounts(build.Holes, build.Lacing);
        double Count(Side s) => s == Side.Left ? countLeft : countRight;
        double Flange(Side s) => s == Side.Left ? hub.FlangeLeft - rim.Offset : hub.FlangeRight + rim.Offset;

        Geometry geoLeft = SideGeometry(rim.Erd, hub.PcdLeft, Flange(Side.Left), countLeft, build.Left.Cross, hub.HoleDiameter);
        Geometry geoRight = SideGeometry(rim.Erd, hub.PcdRight, Flange(Side.Right), countRight, build.Right.Cross, hub.HoleDiameter);
        Geometry Geo(Side s) => s == Side.Left ? geoLeft : geoRight;

        // リム上の横方向の釣り合い: n_L · T_L · sinβ_L = n_R · T_R · sinβ_R
        double pullLeft = countLeft * geoLeft.SinBracing;
        double pullRight = countRight * geoRight.SinBracing;
        Side highSide = pullLeft <= pullRight ? Side.Left : Side.Right;
        double pullHigh = highSide == Side.Left ? pullLeft : pullRight;
        double pullLow = highSide == Side.Left ? pullRight : pullLeft;
        double tensionRatio = pullLow > 0 ? pullHigh / pullLow : 0;
        double Tension(Side s) => s == highSide ? build.TargetTensionKgf : build.TargetTensionKgf * tensionRatio;

        SideResult SideResultOf(Side side)
        {
            Geometry g = Geo(side);
            SideParts parts = request.Parts.Of(side);
            double tensionKgf = Tension(side);
            double tensionN = tensionKgf * Kgf;
            double k = SpokeAxialStiffness(parts.Spoke, g.Length);
            return new SideResult
            {
                Side = side,
                Count = Count(side),
                HubAngleDeg = g.HubAngleDeg,
                ExitAngleDeg = g.ExitAngleDeg,
                MaxCross = g.MaxCross,
                FlangeDistance = Flange(side),
                GeometricLength = g.GeometricLength,
                Length = g.Length,
                BracingDeg = Deg(Math.Asin(g.SinBracing)),
                TensionKgf = tensionKgf,
                TensionN = tensionN,
                AxialStiffness = k,
                Elongation = tensionN / k,
                SpokeMass = SpokeMass(parts.Spoke, g.Length),
                NippleMass = parts.Nipple.Mass,
            };
        }

        SideResult left = SideResultOf(Side.Left);
        SideResult right = SideResultOf(Side.Right);

        double lateralIndex = 0;
        double radialIndex = 0;
        foreach (SideResult s in (SideResult[])[left, right])
        {
            lateralIndex += s.Count * s.AxialStiffness * Math.Pow(Math.Sin(Rad(s.BracingDeg)), 2);
            radialIndex += s.Count * s.AxialStiffness * Math.Pow(Math.Cos(Rad(s.BracingDeg)), 2);
        }
        radialIndex /= 2;

        double spokesMass = left.Count * left.SpokeMass + right.Count * right.SpokeMass;
        double nipplesMass = left.Count * left.NippleMass + right.Count * right.NippleMass;

        return new WheelResult
        {
            Left = left,
            Right = right,
            TensionRatio = tensionRatio,
            HighSide = highSide,
            LateralIndex = lateralIndex,
            RadialIndex = radialIndex,
            Mass = new MassBreakdown
            {
                Rim = rim.Mass,
                Hub = hub.Mass,
                Spokes = spokesMass,
                Nipples = nipplesMass,
                Extra = build.ExtraMass,
                Total = rim.Mass + hub.Mass + spokesMass + nipplesMass + build.ExtraMass,
            },
            Findings = FindingRules.Collect(request, left, right, tensionRatio, highSide, Sides),
        };
    }
}
