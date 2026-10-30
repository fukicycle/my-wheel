import { AlertTriangle, Info, OctagonAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { calculateWheel, type Finding, type SideResult, type WheelResult } from '../domain/engine';
import { HUB_PRESETS, NIPPLES, RIM_PRESETS, SPOKES } from '../lib/parts';
import type { HubSpec, Lacing, RimSpec, Side, SideSpec, WheelBuild } from '../lib/types';
import { hubFromPreset, rimFromPreset, useBuildStore } from '../store/useBuildStore';
import { DishDiagram } from './DishDiagram';
import { Group, NumberField, SelectField } from './fields';
import { LacingDiagram } from './LacingDiagram';

const TITLE = { front: '前輪', rear: '後輪' } as const;
const HOLES = [16, 18, 20, 24, 28, 32, 36];
const CUSTOM = 'custom';

export function sideLabel(build: WheelBuild, side: Side): string {
  const tags: string[] = [];
  if (build.hub.rotorSide === side) tags.push('ローター側');
  if (build.position === 'rear') tags.push(side === 'right' ? 'ドライブ側' : '反ドライブ側');
  return tags.join('・');
}

export function WheelPanel({ position }: { position: 'front' | 'rear' }) {
  const build = useBuildStore((s) => s.build[position]);
  const updateWheel = useBuildStore((s) => s.updateWheel);
  const result = calculateWheel(build);
  const update = (patch: Partial<WheelBuild>) => updateWheel(position, patch);

  return (
    <section aria-labelledby={`${position}-title`} className="min-w-0">
      <header className="mb-4 flex items-baseline justify-between gap-3">
        <h2 id={`${position}-title`} className="m-0 text-2xl font-semibold tracking-tight">
          {TITLE[position]}
          <span className="ml-2 text-base font-medium text-muted num">
            {build.holes}H・{build.lacing === '1:1' ? '1:1' : '2:1'}
          </span>
        </h2>
        <p className="m-0 text-right">
          <span className="num text-2xl font-semibold">{result.mass.total.toFixed(0)}</span>
          <span className="ml-0.5 text-sm text-muted">g</span>
        </p>
      </header>

      <div className="rounded-xl border border-rule bg-surface p-4 sm:p-5">
        <DishDiagram build={build} result={result} />
        <ResultTable build={build} result={result} />
        <Findings findings={result.findings} />
      </div>

      <div className="mt-4 rounded-xl border border-rule bg-surface p-4 sm:p-5">
        <h3 className="m-0 mb-3 text-sm font-semibold">組み図</h3>
        <LacingDiagram build={build} result={result} />
        <Breakdown result={result} />
      </div>

      <div className="mt-4 space-y-4 rounded-xl border border-rule bg-surface p-4 sm:p-5">
        <h3 className="m-0 text-sm font-semibold">部品と組み方</h3>
        <SpokeInputs build={build} result={result} update={update} />
        <BuildInputs build={build} update={update} />
        <RimInputs rim={build.rim} update={(rim) => update({ rim })} />
        <HubInputs position={position} hub={build.hub} update={(hub) => update({ hub })} />
      </div>
    </section>
  );
}

function ResultTable({ build, result }: { build: WheelBuild; result: WheelResult }) {
  const row = (label: string, render: (s: SideResult) => ReactNode, note?: string) => (
    <tr className="border-t border-rule">
      <th scope="row" className="py-2 pr-3 text-left align-top text-[13px] font-normal text-muted">
        {label}
        {note && <span className="block text-[11px] leading-snug">{note}</span>}
      </th>
      <td className="num py-2 pr-2 text-right align-top">{render(result.left)}</td>
      <td className="num py-2 text-right align-top">{render(result.right)}</td>
    </tr>
  );

  const head = (side: Side) => (
    <th scope="col" className={`pb-2 text-right align-bottom ${side === 'left' ? 'pr-2 text-side-l' : 'text-side-r'}`}>
      <span className="block text-sm font-semibold">{side === 'left' ? '左' : '右'}</span>
      <span className="block text-[11px] font-normal">{sideLabel(build, side) || ' '}</span>
    </th>
  );

  return (
    <div className="mt-3">
      <table className="w-full border-collapse text-[15px]">
        <thead>
          <tr>
            <td />
            {head('left')}
            {head('right')}
          </tr>
        </thead>
        <tbody>
          {row(
            'スポーク長',
            (s) => (
              <>
                <span className="text-2xl font-semibold">{s.length.toFixed(1)}</span>
                <span className="ml-0.5 text-xs text-muted">mm</span>
              </>
            ),
            'ハブ穴径の半分を差し引いた値',
          )}
          {row('本数', (s) => `${s.count}本`)}
          {row(
            '張力',
            (s) => (
              <>
                {s.tensionKgf.toFixed(0)}
                <span className="ml-0.5 text-xs text-muted">kgf</span>
                <span className="block text-xs text-muted">{s.tensionN.toFixed(0)} N</span>
              </>
            ),
            `高い側を目標${build.targetTensionKgf}kgfに設定`,
          )}
          <tr className="border-t border-rule">
            <th scope="row" className="py-2 pr-3 text-left text-[13px] font-normal text-muted">
              張力比
              <span className="block text-[11px] leading-snug">低い側 ÷ 高い側</span>
            </th>
            <td colSpan={2} className="num py-2 text-right">
              <span className={`text-2xl font-semibold ${result.tensionRatio < 0.5 ? 'text-warn' : ''}`}>
                {(result.tensionRatio * 100).toFixed(1)}
              </span>
              <span className="ml-0.5 text-xs text-muted">%</span>
            </td>
          </tr>
          {row('支え角', (s) => `${s.bracingDeg.toFixed(2)}°`)}
          {row(
            '出口角',
            (s) => (
              <>
                <span className={s.exitAngleDeg >= 90 ? 'font-semibold text-bad' : ''}>{s.exitAngleDeg.toFixed(1)}°</span>
                <span className="block text-xs text-muted">最大{s.maxCross}クロス</span>
              </>
            ),
            '0°=放射、90°=フランジの接線',
          )}
          {row('張力による伸び', (s) => `${s.elongation.toFixed(2)} mm`)}
          {row('1本の重量', (s) => `${s.spokeMass.toFixed(2)} g`, 'ニップル別・概算')}
        </tbody>
      </table>
    </div>
  );
}

const FINDING_STYLE = {
  error: { icon: OctagonAlert, cls: 'bg-bad-soft text-bad' },
  warn: { icon: AlertTriangle, cls: 'bg-warn-soft text-warn' },
  info: { icon: Info, cls: 'bg-sunken text-muted' },
} as const;

function Findings({ findings }: { findings: Finding[] }) {
  if (findings.length === 0) return null;
  const order = { error: 0, warn: 1, info: 2 };
  return (
    <ul className="m-0 mt-4 list-none space-y-2 p-0" aria-label="チェック結果">
      {[...findings]
        .sort((a, b) => order[a.severity] - order[b.severity])
        .map((f, i) => {
          const { icon: Icon, cls } = FINDING_STYLE[f.severity];
          return (
            <li key={i} className={`flex gap-2 rounded-lg px-3 py-2 text-[13px] leading-relaxed ${cls}`}>
              <Icon size={16} className="mt-0.5 shrink-0" aria-hidden />
              <span className={f.severity === 'info' ? '' : 'text-ink'}>{f.message}</span>
            </li>
          );
        })}
    </ul>
  );
}

function Breakdown({ result }: { result: WheelResult }) {
  const m = result.mass;
  const items: [string, number][] = [
    ['リム', m.rim],
    ['ハブ', m.hub],
    ['スポーク', m.spokes],
    ['ニップル', m.nipples],
    ['その他', m.extra],
  ];
  return (
    <dl className="m-0 mt-4 grid grid-cols-2 gap-x-6 gap-y-1 border-t border-rule pt-3 text-[13px] sm:grid-cols-3">
      {items.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-2">
          <dt className="text-muted">{k}</dt>
          <dd className="num m-0">{v.toFixed(0)} g</dd>
        </div>
      ))}
      <div className="col-span-full mt-2 flex justify-between gap-2 border-t border-rule pt-2">
        <dt className="text-muted">
          スポーク系の横剛性指標
          <span className="block text-[11px] leading-snug">リムを剛体とした全周合計。組み方同士の比較用</span>
        </dt>
        <dd className="num m-0 text-right font-semibold">{result.lateralIndex.toFixed(0)} N/mm</dd>
      </div>
    </dl>
  );
}

interface UpdateProps {
  build: WheelBuild;
  update: (patch: Partial<WheelBuild>) => void;
}

function SpokeInputs({ build, result, update }: UpdateProps & { result: WheelResult }) {
  const setSide = (side: Side, patch: Partial<SideSpec>) => update({ [side]: { ...build[side], ...patch } });
  const column = (side: Side) => {
    const r = result[side];
    return (
      <div className={`space-y-2.5 rounded-lg p-3 ${side === 'left' ? 'bg-side-l-soft' : 'bg-side-r-soft'}`}>
        <p className={`m-0 text-sm font-semibold ${side === 'left' ? 'text-side-l' : 'text-side-r'}`}>
          {side === 'left' ? '左' : '右'}
          <span className="ml-1.5 text-xs font-normal">{sideLabel(build, side)}</span>
        </p>
        <SelectField
          label="スポーク"
          value={build[side].spokeId}
          onChange={(spokeId) => setSide(side, { spokeId })}
          options={SPOKES.map((s) => ({ value: s.id, label: s.name }))}
        />
        <SelectField
          label="ニップル"
          value={build[side].nippleId}
          onChange={(nippleId) => setSide(side, { nippleId })}
          options={NIPPLES.map((n) => ({ value: n.id, label: n.name }))}
        />
        <SelectField
          label="クロス数"
          value={String(build[side].cross)}
          onChange={(v) => setSide(side, { cross: Number(v) })}
          options={[0, 1, 2, 3, 4].map((c) => ({
            value: String(c),
            label: `${c === 0 ? 'ラジアル（0）' : `${c}クロス`}${c > r.maxCross ? '　接線超え' : ''}`,
          }))}
        />
      </div>
    );
  };
  return (
    <Group title="スポーク">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {column('left')}
        {column('right')}
      </div>
    </Group>
  );
}

function BuildInputs({ build, update }: UpdateProps) {
  const lacingOptions: { value: Lacing; label: string; disabled?: boolean }[] = [
    { value: '1:1', label: '1:1（左右同数）' },
    { value: '2:1-left', label: '2:1（左が多い）', disabled: build.holes % 3 !== 0 },
    { value: '2:1-right', label: '2:1（右が多い）', disabled: build.holes % 3 !== 0 },
  ];
  return (
    <Group title="穴数と張力">
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="穴数"
          value={String(build.holes)}
          onChange={(v) => {
            const holes = Number(v);
            update({ holes, lacing: holes % 3 === 0 ? build.lacing : '1:1' });
          }}
          options={HOLES.map((h) => ({ value: String(h), label: `${h}H` }))}
        />
        <SelectField label="左右の配分" value={build.lacing} onChange={(lacing) => update({ lacing })} options={lacingOptions} />
        <NumberField
          label="目標張力（高い側）"
          unit="kgf"
          step={1}
          min={1}
          max={300}
          value={build.targetTensionKgf}
          onChange={(v) => v !== null && update({ targetTensionKgf: v })}
        />
        <NumberField
          label="テープ・バルブなど"
          unit="g"
          step={1}
          min={0}
          value={build.extraMass}
          onChange={(v) => v !== null && update({ extraMass: v })}
        />
      </div>
    </Group>
  );
}

function RimInputs({ rim, update }: { rim: RimSpec; update: (rim: RimSpec) => void }) {
  const preset = RIM_PRESETS.find((p) => p.id === rim.presetId);
  const edited = preset && (preset.erd !== rim.erd || preset.mass !== rim.mass || preset.maxTensionKgf !== rim.maxTensionKgf);
  const set = (patch: Partial<RimSpec>) => update({ ...rim, ...patch });
  return (
    <Group title="リム" aside={edited ? 'プリセットから編集済み' : undefined}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <SelectField
            label="プリセット"
            value={preset ? rim.presetId : CUSTOM}
            onChange={(id) => (id === CUSTOM ? set({ presetId: CUSTOM, name: 'カスタムリム' }) : update(rimFromPreset(id, rim.offset)))}
            options={[...RIM_PRESETS.map((p) => ({ value: p.id, label: p.name })), { value: CUSTOM, label: 'カスタム（手入力）' }]}
          />
          {preset && <p className="m-0 mt-1 text-xs text-muted">{preset.note}</p>}
        </div>
        <NumberField label="ERD" unit="mm" value={rim.erd} min={300} max={700} onChange={(v) => v !== null && set({ erd: v })} />
        <NumberField label="リム重量" unit="g" step={1} min={0} value={rim.mass} onChange={(v) => v !== null && set({ mass: v })} />
        <NumberField
          label="穴の左右オフセット"
          unit="mm"
          value={rim.offset}
          min={-10}
          max={10}
          onChange={(v) => v !== null && set({ offset: v })}
        />
        <NumberField
          label="許容張力"
          unit="kgf"
          step={1}
          allowEmpty
          placeholder="不明"
          value={rim.maxTensionKgf}
          onChange={(v) => set({ maxTensionKgf: v })}
        />
        <p className="col-span-2 m-0 text-xs text-muted">オフセットは + で穴が左に寄ります（非対称リム用）</p>
      </div>
    </Group>
  );
}

function HubInputs({ position, hub, update }: { position: 'front' | 'rear'; hub: HubSpec; update: (hub: HubSpec) => void }) {
  const presets = HUB_PRESETS.filter((h) => h.position === position);
  const preset = presets.find((p) => p.id === hub.presetId);
  const edited =
    preset &&
    (['pcdLeft', 'pcdRight', 'flangeLeft', 'flangeRight', 'holeDiameter', 'mass'] as const).some((k) => preset[k] !== hub[k]);
  const set = (patch: Partial<HubSpec>) => update({ ...hub, ...patch });
  return (
    <Group title="ハブ" aside={edited ? 'プリセットから編集済み' : undefined}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <SelectField
            label="プリセット"
            value={preset ? hub.presetId : CUSTOM}
            onChange={(id) => (id === CUSTOM ? set({ presetId: CUSTOM, name: 'カスタムハブ' }) : update(hubFromPreset(id)))}
            options={[...presets.map((p) => ({ value: p.id, label: p.name })), { value: CUSTOM, label: 'カスタム（手入力）' }]}
          />
        </div>
        <NumberField label="PCD 左" unit="mm" value={hub.pcdLeft} min={10} max={120} onChange={(v) => v !== null && set({ pcdLeft: v })} />
        <NumberField label="PCD 右" unit="mm" value={hub.pcdRight} min={10} max={120} onChange={(v) => v !== null && set({ pcdRight: v })} />
        <NumberField
          label="フランジ距離 左"
          unit="mm"
          value={hub.flangeLeft}
          min={1}
          max={60}
          onChange={(v) => v !== null && set({ flangeLeft: v })}
        />
        <NumberField
          label="フランジ距離 右"
          unit="mm"
          value={hub.flangeRight}
          min={1}
          max={60}
          onChange={(v) => v !== null && set({ flangeRight: v })}
        />
        <NumberField
          label="スポーク穴径"
          unit="mm"
          value={hub.holeDiameter}
          min={1}
          max={5}
          onChange={(v) => v !== null && set({ holeDiameter: v })}
        />
        <NumberField label="ハブ重量" unit="g" step={1} min={0} value={hub.mass} onChange={(v) => v !== null && set({ mass: v })} />
        <div className="col-span-2">
          <SelectField
            label="ディスクローター"
            value={hub.rotorSide ?? 'none'}
            onChange={(v) => set({ rotorSide: v === 'none' ? null : (v as Side) })}
            options={[
              { value: 'none', label: 'なし（リムブレーキ）' },
              { value: 'left', label: '左側' },
              { value: 'right', label: '右側' },
            ]}
          />
        </div>
      </div>
    </Group>
  );
}
