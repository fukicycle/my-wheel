import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { HUB_PRESETS, RIM_PRESETS } from '../lib/parts';
import type { Build, HubSpec, Position, RimSpec, WheelBuild } from '../lib/types';

export function hubFromPreset(id: string): HubSpec {
  const preset = HUB_PRESETS.find((h) => h.id === id) ?? HUB_PRESETS[0];
  const { id: presetId, position: _p, holes: _h, ...rest } = preset;
  return { presetId, ...rest };
}

export function rimFromPreset(id: string, offset = 0): RimSpec {
  const preset = RIM_PRESETS.find((r) => r.id === id) ?? RIM_PRESETS[0];
  return { presetId: preset.id, name: preset.name, erd: preset.erd, mass: preset.mass, offset, maxTensionKgf: preset.maxTensionKgf };
}

export const DEFAULT_BUILD: Build = {
  name: 'GW-TU38MT × DT 350 ディスク 28H',
  front: {
    position: 'front',
    holes: 28,
    lacing: '1:1',
    rim: rimFromPreset('ganwell-tu38'),
    hub: hubFromPreset('dt350-f-100-cl'),
    left: { spokeId: 'dt-competition-race-1816', nippleId: 'alu-18-12', cross: 3 },
    right: { spokeId: 'dt-competition-race-1816', nippleId: 'alu-18-12', cross: 3 },
    targetTensionKgf: 110,
    extraMass: 0,
  },
  rear: {
    position: 'rear',
    holes: 28,
    lacing: '1:1',
    rim: rimFromPreset('ganwell-tu38'),
    hub: hubFromPreset('dt350-r-142-cl'),
    left: { spokeId: 'dt-competition-race-1816', nippleId: 'alu-18-12', cross: 3 },
    right: { spokeId: 'dt-competition-2018', nippleId: 'alu-20-12', cross: 2 },
    targetTensionKgf: 115,
    extraMass: 0,
  },
};

export interface SavedBuild extends Build {
  id: string;
  savedAt: string;
}

interface BuildStore {
  build: Build;
  saved: SavedBuild[];
  setName: (name: string) => void;
  updateWheel: (position: Position, patch: Partial<WheelBuild>) => void;
  replaceBuild: (build: Build) => void;
  saveCurrent: () => void;
  removeSaved: (id: string) => void;
  reset: () => void;
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

export const useBuildStore = create<BuildStore>()(
  persist(
    (set) => ({
      build: clone(DEFAULT_BUILD),
      saved: [],
      setName: (name) => set((s) => ({ build: { ...s.build, name } })),
      updateWheel: (position, patch) =>
        set((s) => ({ build: { ...s.build, [position]: { ...s.build[position], ...patch } } })),
      replaceBuild: (build) => set({ build: clone(build) }),
      saveCurrent: () =>
        set((s) => {
          const entry: SavedBuild = {
            ...clone(s.build),
            id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
            savedAt: new Date().toISOString(),
          };
          return { saved: [entry, ...s.saved] };
        }),
      removeSaved: (id) => set((s) => ({ saved: s.saved.filter((b) => b.id !== id) })),
      reset: () => set({ build: clone(DEFAULT_BUILD) }),
    }),
    { name: 'my-wheel/v2', version: 1 },
  ),
);

/** URL の #b=... に埋め込む共有用エンコード */
export function encodeBuild(build: Build): string {
  const json = JSON.stringify(build);
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeBuild(code: string): Build | null {
  try {
    const bin = atob(code.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as Build;
    if (!parsed?.front?.rim || !parsed?.rear?.hub) return null;
    return parsed;
  } catch {
    return null;
  }
}
