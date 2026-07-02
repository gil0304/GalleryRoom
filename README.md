# GalleryRoom.js

**Web Exhibition Library**

GalleryRoom.js は、作品一覧をカードUIではなく、**展示空間として見せるためのWebギャラリーライブラリ**です。
画像、動画、YouTube、Webサイト（iframe）、テキスト作品を、美術館や文化祭展示のような見た目で配置できます。
展示室マップ、カテゴリフィルター、CSS transform による3D風展示にも対応しています。

依存ライブラリなし。JavaScript と CSS だけで動作します。

## インストール

### CDN / script タグで使う

```html
<link rel="stylesheet" href="dist/gallery-room.css">
<script src="dist/gallery-room.js"></script>
```

### npm で使う

```bash
npm install gallery-room-js
```

```js
import GalleryRoom from "gallery-room-js";
import "gallery-room-js/dist/gallery-room.css";
```

## 基本の使い方

```html
<div id="gallery"></div>
<script>
GalleryRoom.create("#gallery", {
  title: "My Works Exhibition",
  subtitle: "Web Exhibition Library",
  theme: "white-cube",
  layout: "horizontal",
  enableMap: true,
  enableFilter: true,
  enableDepth: true,
  works: [
    {
      id: "work-01",
      title: "Sound Map",
      type: "image",
      src: "sound-map.png",
      year: "2026",
      category: "Web",
      caption: "位置情報と音を使ったWeb作品",
      author: "Ryogo",
      link: "https://example.com"
    }
  ]
});
</script>
```

## options

| オプション | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `title` | string | `"Gallery Room"` | 展示室のタイトル |
| `subtitle` | string | なし | サブタイトル（未指定なら非表示） |
| `theme` | string | `"white-cube"` | 展示テーマ |
| `layout` | string | `"horizontal"` | 展示レイアウト |
| `enableMap` | boolean | `true` | 展示室マップを表示 |
| `enableFilter` | boolean | `true` | カテゴリフィルターを表示 |
| `enableDepth` | boolean | `true` | 3D風展示を有効化 |
| `scroll.wheelToHorizontal` | boolean | `true` | 縦ホイールを横スクロールに変換 |
| `scroll.snap` | boolean | `true` | scroll-snap を有効化 |
| `scroll.smooth` | boolean | `true` | スムーズスクロール |
| `works` | array | `[]` | 作品データの配列 |

## works データ構造

```js
{
  id: "work-01",          // 必須: 一意なID
  title: "作品タイトル",   // 必須
  type: "image",          // 必須: image / video / youtube / iframe / text
  src: "work.png",        // image/video/youtube/iframe で必須
  content: "本文",         // text で必須
  year: "2026",           // 任意: 制作年
  category: "Web",        // 任意: カテゴリ（フィルターに使用）
  caption: "作品説明文",   // 任意
  author: "Ryogo",        // 任意: 作者名
  link: "https://...",    // 任意: 外部リンク
  thumbnail: "thumb.png", // 任意: サムネイル
  size: "800 × 600",      // 任意: 作品サイズ表記
  tags: ["tag1"],         // 任意: タグ配列
  qr: "qr.png",           // 任意: QRコード画像URL
  depth: 80,              // 任意: 3D配置の奥行き(px)
  rotate: -6,             // 任意: 作品の傾き(deg)
  height: -10             // 任意: 壁上の高さ(px)
}
```

## 対応メディアタイプ

| type | 生成される要素 | 必須プロパティ |
| --- | --- | --- |
| `image` | `<img loading="lazy">` | `src` |
| `video` | `<video controls muted playsinline>` | `src` |
| `youtube` | `<iframe allowfullscreen>` | `src`（embed URL） |
| `iframe` | `<iframe>` | `src` |
| `text` | `<div class="gr-text-work">` | `content` |

`src` / `content` が無い場合はプレースホルダーを、未知の `type` は "Unsupported work type." を表示します（作品はスキップされません）。

## テーマ一覧

| テーマ | 雰囲気 | 3D強度 |
| --- | --- | --- |
| `white-cube` | 白い美術館。余白広め・薄い影 | 弱め |
| `dark-room` | 黒背景の映像展示。作品が光る | 中 |
| `zine-wall` | 紙とテープの手作り展示 | 中 |
| `portfolio-clean` | 情報が読みやすいポートフォリオ | 弱め |
| `school-exhibition` | 作品番号・作者名・QR欄つきの展示プレート | 弱め |
| `museum` | 額縁とプレートのクラシック美術館 | 中 |

## レイアウト一覧

| レイアウト | 説明 |
| --- | --- |
| `horizontal` | 横スクロール展示（推奨）。scroll-snap・ホイール変換・スワイプ対応 |
| `grid` | 画面幅に合わせたグリッド一覧 |
| `walkthrough` | CSS transform による奥行きのある擬似3D展示 |

## フィルター機能

`works` の `category` から自動でボタンを生成します。カテゴリを押すと対象作品のみ表示され、
マップも表示中の作品だけに更新されます。0件のときは空状態を表示します。

## 展示室マップ機能

作品数分の点を表示し、スクロール位置から「いま中央に見えている作品」を判定してハイライトします。
点をクリックすると該当作品へスムーズスクロールします。

## 3D風展示機能

WebGL は使わず、CSS の `perspective` / `translateZ` / `rotateY` で奥行きを表現します。
作品ごとに `--gr-depth` / `--gr-rotate-y` / `--gr-height` が自動付与され、
`depth` / `rotate` / `height` プロパティで手動指定もできます。
テーマごとに強度が変わり、スマホでは無効化されます。

## API

```js
const gallery = GalleryRoom.create("#gallery", options); // 生成（インスタンスを返す）

gallery.filter("Web");     // カテゴリで絞り込み（"all" で全表示）
gallery.goTo("work-01");   // 指定IDの作品へスクロール
gallery.open("work-01");   // 指定IDの作品をモーダルで開く
gallery.close();           // モーダルを閉じる
gallery.update({ theme: "dark-room", works: newWorks }); // 設定を更新して再描画
gallery.destroy();         // HTMLとイベントリスナーを削除
```

## イベント

ルート要素（`create` に渡したセレクタの要素）にカスタムイベントが発火します。

```js
const el = document.querySelector("#gallery");
el.addEventListener("gr:ready", (e) => console.log(e.detail.instance));
el.addEventListener("gr:workOpen", (e) => console.log(e.detail.work));
el.addEventListener("gr:workClose", (e) => console.log(e.detail.work));
el.addEventListener("gr:filterChange", (e) => console.log(e.detail.category));
el.addEventListener("gr:currentWorkChange", (e) => console.log(e.detail.work));
```

## キーボード操作

| キー | 動作 |
| --- | --- |
| Tab | ボタン・作品にフォーカス |
| Enter / Space | フォーカス中の作品を開く |
| Escape | モーダルを閉じる |
| ArrowRight / ArrowLeft | 次・前の作品へ移動 |

`prefers-reduced-motion` にも対応しています。

## デモページ

ローカルサーバーを起動して確認できます。

```bash
npm run dev
# → http://localhost:8080
```

| デモ | テーマ | 内容 |
| --- | --- | --- |
| [index.html](index.html) | white-cube | ライブラリ紹介 + 基本ギャラリー |
| [demo/portfolio.html](demo/portfolio.html) | white-cube | 個人ポートフォリオ展示 |
| [demo/photo.html](demo/photo.html) | museum | 写真展 |
| [demo/movie.html](demo/movie.html) | dark-room | 映像展示（mp4 / YouTube / iframe） |
| [demo/school.html](demo/school.html) | school-exhibition | 文化祭・卒業制作展示 |
| [demo/walkthrough.html](demo/walkthrough.html) | white-cube | 擬似3Dウォークスルー展示 |

## 開発

```bash
node scripts/build.js   # src/ から dist/ を再生成
```

`src/` の ES モジュールを、依存なしのビルドスクリプトで
`dist/gallery-room.js`（IIFE）/ `dist/gallery-room.esm.js`（ESM）/
`dist/gallery-room.min.js` / `dist/gallery-room.css`（テーマ込み）に束ねています。

## 注意事項

- `type: "iframe"` は指定したURLをそのまま埋め込みます。**信頼できるURLのみ指定してください。**
- タイトル・キャプション・作者名などのテキストはすべてHTMLエスケープされます。
- 対応ブラウザ: Chrome / Safari / Firefox / Edge の最新版、iOS Safari、Android Chrome。IEは非対応です。

## ライセンス

[MIT](LICENSE)
