# my-wheel

手組みホイールの設計を前後セットで計算・分析するツールです。
公開ページ: https://fukicycle.github.io/my-wheel/

## できること

- **スポーク長**：ERD・PCD・フランジ距離・クロス数から、DT SWISS と同じ方式（幾何長からハブ穴径の半分を差し引く）で計算
- **左右の張力**：リム上の横方向の釣り合い（本数 × 張力 × 支え角の sin）から、高い側を目標張力にしたときの低い側の張力と張力比を算出
- **クロス数の限界**：スポークがフランジを出る角度（出口角、90° = 接線）を求め、接線を越える組み方を「組めない」と判定
- **ブレーキ・駆動の確認**：ローター側やドライブ側のラジアル組み、スポークとニップルのネジ径の不一致、リムの許容張力超えを警告
- **重量**：リム・ハブ・スポーク（バテッド形状から概算）・ニップル・その他を合計し、前後セットの重量を表示
- **スポーク系の横剛性指標**：Σ(軸剛性 × sin²支え角)。リムを剛体と仮定した値で、組み方同士の比較用
- **図**：横方向を4倍にしたおちょこ断面図（線の太さ＝張力）、ホイール正面の組み図、ハブ周りの拡大図
- **保存と比較**：ビルドをブラウザに保存して、重量・張力比・横剛性指標を並べて比較。共有リンク（URL に設定を埋め込み）にも対応

## 部品プリセット

| 種類 | 収録内容 |
| --- | --- |
| ハブ | DT SWISS 350 前 100mm / 後 135・142mm センターロック（DT SWISS Spoke Calculator の登録値） |
| リム | GAN WELL GW-TU38MT、Carbonal RT38D / RT38W、Origin8 Bolt、HUNT 36、TNI ROAD 38 TU |
| スポーク | DT Champion / Competition / Competition Race / Revolution / Aerolite、Sapim Race / Laser / CX-Ray |
| ニップル | アルミ・真鍮（2.0 / 1.8、12mm） |

プリセットを選んだあとも、すべての寸法を手入力で上書きできます。GW-TU38MT は ERD が公表されていないため、38mm カーボンの代表値 569mm を仮置きしています。実測値に置き換えてください。

部品データは `src/lib/parts.ts` にあります。

## 構成

- React 18 / TypeScript / Vite
- 状態管理: Zustand（`persist` でブラウザに保存）
- スタイル: Tailwind CSS
- 計算: C#（.NET 10）を WebAssembly にして呼ぶ

### 計算エンジン（C# / WebAssembly）

| 場所 | 役割 |
| --- | --- |
| `domain/MyWheel.Domain` | 計算と判定。UI にも JSON にも依存しない純粋関数 |
| `domain/MyWheel.Domain/Contract` | JS との境界の JSON 契約（ソース生成） |
| `domain/MyWheel.Domain.Tests` | golden テスト（旧 TypeScript 実装の出力 405 ケースと一致するか）と、壊れた入力を拒否するかの契約テスト |
| `domain/MyWheel.Wasm` | `[JSExport]` で `CalculateMany`（入力の配列 → 結果の配列）だけを公開 |
| `src/domain/contract.ts` | 戻り値を検証する zod スキーマ。結果の型はここから導出する |
| `src/domain/engine.ts` | エンジンの読み込みと呼び出し |
| `public/sw.js` | エンジンだけをキャッシュする Service Worker（2回目以降の読み込みを速くする） |

画面はエンジンを待たずに表示し、結果欄は読み込みが終わってから出ます。エンジンは `public/dotnet/<中身のハッシュ>/` に置くので、
同じ URL の中身は変わらず、Service Worker はキャッシュを優先して読みます。新しいビルドを読み込むと古いキャッシュは消えます。

計算を変えるときは C# 側を直し、`npm run test:domain` を通してください。

## 開発

.NET 10 SDK と WebAssembly のビルドツールが必要です。

```bash
dotnet workload install wasm-tools
npm install
npm run test:domain   # C# の golden / 契約テスト
npm run dev           # http://localhost:5173/my-wheel/（初回はエンジンもビルド）
npm run build         # エンジンのビルド + 型チェック + 本番ビルド（dist/）
```

`main` への push で GitHub Actions がテスト・ビルドし、`gh-pages` ブランチに公開します。
それ以外のブランチはビルド結果を `preview/<ブランチ名>` に置くだけで、公開はしません。
