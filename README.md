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
- 計算: `src/lib/calc.ts`（UI に依存しない純粋関数）

## 開発

```bash
npm install
npm run dev     # http://localhost:5173/my-wheel/
npm run build   # 型チェック + 本番ビルド（dist/）
```

`main` への push で GitHub Actions がビルドし、`gh-pages` ブランチに公開します。
