/**
 * 旧 TypeScript 実装（src/lib/calc.ts @ eeaeedf）から golden fixtures を作るスクリプト。
 * C# への移植時に一度だけ実行し、出力 JSON をそのまま仕様として固定した。
 * 旧実装は削除済み。再生成するときは `git show eeaeedf:src/lib/calc.ts` を tools/golden/legacy-calc.ts に置き、
 * import パスを '../../src/lib/...' に直してから実行する。
 *
 *   npx tsx tools/golden/generate.ts > domain/MyWheel.Domain.Tests/golden.json
 */
import { calculateWheel } from './legacy-calc';
import { HUB_PRESETS, NIPPLES, RIM_PRESETS, SPOKES, findNipple, findSpoke } from '../../src/lib/parts';
import { hubFromPreset, rimFromPreset } from '../../src/store/useBuildStore';
import type { Lacing, WheelBuild } from '../../src/lib/types';

// 再現性のある疑似乱数（mulberry32）
let seed = 0x5eed;
const rand = () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)];

const LACINGS: Lacing[] = ['1:1', '2:1-left', '2:1-right'];
const builds: WheelBuild[] = [];

function randomBuild(): WheelBuild {
  const hubPreset = pick(HUB_PRESETS);
  const rimPreset = pick(RIM_PRESETS);
  const holes = pick([16, 18, 20, 21, 24, 28, 32]);
  const offset = pick([0, 0, 0, 2, -2.5, 3.5]);
  const rim = rimFromPreset(rimPreset.id, offset);
  if (rand() < 0.2) rim.maxTensionKgf = pick([100, 110, 120, 130]);
  const hub = hubFromPreset(hubPreset.id);
  if (rand() < 0.2) hub.rotorSide = null;
  // ハブ寸法も少し揺らして、出口角が接線に近いケースを拾えるようにする
  if (rand() < 0.3) {
    hub.pcdLeft += pick([-6, 4, 12, 20]);
    hub.pcdRight += pick([-6, 4, 12, 20]);
  }
  return {
    position: hubPreset.position,
    holes,
    lacing: pick(LACINGS),
    rim,
    hub,
    left: { spokeId: pick(SPOKES).id, nippleId: pick(NIPPLES).id, cross: pick([0, 1, 2, 3, 4, 5]) },
    right: { spokeId: pick(SPOKES).id, nippleId: pick(NIPPLES).id, cross: pick([0, 1, 2, 3, 4, 5]) },
    targetTensionKgf: pick([90, 100, 110, 115, 120, 125.5, 140]),
    extraMass: pick([0, 0, 25, 42.5]),
  };
}

for (let i = 0; i < 400; i++) builds.push(randomBuild());

// 出現しにくい判定（ほぼ接線）を最低限含める
let nearTangent = 0;
for (let i = 0; i < 200_000 && nearTangent < 5; i++) {
  const b = randomBuild();
  b.hub.pcdLeft = 30 + rand() * 90;
  b.hub.pcdRight = 30 + rand() * 90;
  if (calculateWheel(b).findings.some((f) => f.message.includes('ほぼ接線'))) {
    builds.push(b);
    nearTangent++;
  }
}
if (nearTangent === 0) throw new Error('ほぼ接線のケースが見つかりませんでした');

const cases = builds.map((wheel) => ({
  request: {
    wheel,
    parts: {
      left: { spoke: findSpoke(wheel.left.spokeId), nipple: findNipple(wheel.left.nippleId) },
      right: { spoke: findSpoke(wheel.right.spokeId), nipple: findNipple(wheel.right.nippleId) },
    },
  },
  expected: calculateWheel(wheel),
}));

process.stdout.write(JSON.stringify(cases, null, 1));
