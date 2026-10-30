import { useSyncExternalStore } from 'react';
import { findNipple, findSpoke } from '../lib/parts';
import type { WheelBuild } from '../lib/types';
import { wheelResultsSchema, type CalculateRequest, type WheelResult } from './contract';

/** C# の WheelInterop が公開する関数 */
interface WasmExports {
  MyWheel: { Wasm: { WheelInterop: { CalculateMany(requestsJson: string): string } } };
}

export type EngineState =
  | { status: 'loading'; loaded: number; total: number }
  | { status: 'ready'; bootMs: number }
  | { status: 'error' };

/** エンジン（.NET ランタイム）の置き場所。ビルドごとにハッシュ付きディレクトリが変わる */
export const ENGINE_BASE = `${import.meta.env.BASE_URL}dotnet/${__ENGINE_DIR__}/`;

let state: EngineState = { status: 'loading', loaded: 0, total: 0 };
let calculateMany: ((json: string) => string) | null = null;
let started: Promise<void> | null = null;
const listeners = new Set<() => void>();

function setState(next: EngineState) {
  state = next;
  listeners.forEach((l) => l());
}

/**
 * .NET ランタイムを読み込む。画面は待たずに描画し、読み込み状態は useEngine() で購読する。
 * dotnet.js は Vite の public/dotnet/ に置いた静的ファイルで、バンドルには含めない。
 */
export function startEngine(): Promise<void> {
  started ??= (async () => {
    const t0 = performance.now();
    try {
      const { dotnet } = await import(/* @vite-ignore */ `${ENGINE_BASE}dotnet.js`);
      const runtime = await dotnet
        .withModuleConfig({
          onDownloadResourceProgress: (loaded: number, total: number) => setState({ status: 'loading', loaded, total }),
        })
        .create();
      const exports: WasmExports = await runtime.getAssemblyExports(runtime.getConfig().mainAssemblyName);
      calculateMany = exports.MyWheel.Wasm.WheelInterop.CalculateMany;
      setState({ status: 'ready', bootMs: performance.now() - t0 });
    } catch (error) {
      console.error(error);
      setState({ status: 'error' });
    }
  })();
  return started;
}

export function useEngine(): EngineState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
  );
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

/**
 * 複数のホイールをまとめて計算する。境界をまたぐのは1回だけ。
 * エンジンの準備ができていなければ null（呼び出し側は useEngine() で再描画される）
 */
export function calculateWheels(wheels: WheelBuild[]): WheelResult[] | null {
  if (!calculateMany) return null;
  const raw = calculateMany(JSON.stringify(wheels.map(toRequest)));
  return wheelResultsSchema.parse(JSON.parse(raw));
}

export function calculateWheel(wheel: WheelBuild): WheelResult | null {
  return calculateWheels([wheel])?.[0] ?? null;
}

export type { Finding, SideResult, WheelResult } from './contract';
