import { findNipple, findSpoke } from '../lib/parts';
import type { WheelBuild } from '../lib/types';
import { wheelResultsSchema, type CalculateRequest, type WheelResult } from './contract';

/** C# の WheelInterop が公開する関数 */
interface WasmExports {
  MyWheel: { Wasm: { WheelInterop: { CalculateMany(requestsJson: string): string } } };
}

/** 起動にかかった時間などの計測値。メリット・デメリットの検証用に画面のフッターに出す */
export interface EngineStats {
  bootMs: number;
}

let calculateMany: ((json: string) => string) | null = null;
let stats: EngineStats | null = null;

/**
 * .NET ランタイムを読み込む。計算は同期で呼びたいので、描画の前に一度だけ await する。
 * dotnet.js は Vite の public/dotnet/ に置いた静的ファイルで、バンドルには含めない。
 */
export async function initEngine(): Promise<EngineStats> {
  if (stats) return stats;
  const started = performance.now();
  const url = `${import.meta.env.BASE_URL}dotnet/dotnet.js`;
  const { dotnet } = await import(/* @vite-ignore */ url);
  const runtime = await dotnet.create();
  const exports: WasmExports = await runtime.getAssemblyExports(runtime.getConfig().mainAssemblyName);
  calculateMany = exports.MyWheel.Wasm.WheelInterop.CalculateMany;
  stats = { bootMs: performance.now() - started };
  return stats;
}

export function engineStats(): EngineStats | null {
  return stats;
}

function toRequest(wheel: WheelBuild): CalculateRequest {
  return {
    wheel,
    parts: {
      left: { spoke: findSpoke(wheel.left.spokeId), nipple: findNipple(wheel.left.nippleId) },
      right: { spoke: findSpoke(wheel.right.spokeId), nipple: findNipple(wheel.right.nippleId) },
    },
  };
}

/** 複数のホイールをまとめて計算する。境界をまたぐのは1回だけ */
export function calculateWheels(wheels: WheelBuild[]): WheelResult[] {
  if (!calculateMany) throw new Error('計算エンジンが未初期化です。initEngine() を先に呼んでください');
  const raw = calculateMany(JSON.stringify(wheels.map(toRequest)));
  return wheelResultsSchema.parse(JSON.parse(raw));
}

export function calculateWheel(wheel: WheelBuild): WheelResult {
  return calculateWheels([wheel])[0];
}

export type { Finding, SideResult, WheelResult } from './contract';
