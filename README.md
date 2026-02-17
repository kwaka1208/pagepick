# URL Tools Chrome拡張

bookmarklet版と同じ機能をChrome拡張として実装したバージョンです。

## 機能

### 1. Google Docs URL変換
Google ドキュメント、スプレッドシート、スライドの編集画面で使用可能。共有URLをコピーします。
- 強制コピーモード（`/copy`）
- PDFでダウンロード（`/export?format=pdf`）
- Excelでダウンロード（`/export?format=xlsx`）※スプレッドシートのみ

### 2. OGP画像を開く
現在のページのOGP画像（`og:image`メタタグ）を新しいタブで開きます。

### 3. URL+タイトル（複数形式対応）
現在のページのタイトルとURLを、複数の形式でコピーできます：
- **TSV形式**：`タイトル[TAB]URL`
- **テキスト形式**：`タイトル[改行]URL`
- **Markdown形式**：`[タイトル](URL)`

全形式で以下の処理を自動実行：
- トラッキングパラメータ（utm_* など）の自動削除
- fbclid、gclid などの広告パラメータの自動削除

## インストール方法

### 開発者モードでのインストール（デバッグ時）

1. Chrome を開き、`chrome://extensions/` にアクセス
2. 右上の「デベロッパー モード」をオンにする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. このフォルダ（`chrome-extension`）を選択
5. 拡張機能がインストールされます

### リリース用パッケージの作成

```bash
# フォルダをZIPに圧縮（拡張機能の配布用）
zip -r url-tools-chrome.zip ./* -x "*.md"
```

## 使用方法

1. Chrome の拡張機能アイコン（パズルピース）をクリック
2. 「URL Tools」をクリック
3. ポップアップメニューが表示されます
4. 実行したいツールを選択
5. 処理が完了すると、ポップアップに完了メッセージが表示されます

## ファイル構成

```
chrome-extension/
├── manifest.json       # 拡張機能の設定ファイル
├── popup.html         # ポップアップUI
├── popup.css          # ポップアップスタイル
├── popup.js           # ポップアップスクリプト
├── README.md          # このファイル
└── icons/             # アイコン（現在は空です）
```

## 権限について

この拡張機能は以下の権限を使用します：

- **activeTab**: 現在のタブ情報を取得
- **scripting**: ページ内でスクリプトを実行（OGP画像取得用）
- **clipboardWrite**: クリップボードへのコピー
- **host_permissions**: すべてのサイトにアクセス可能

## トラッキングパラメータの削除対象

**ホワイトリスト：**
- `fbclid`, `gclid`, `gclsrc`, `dclid`, `msclkid`, `mibextid`
- `mc_cid`, `mc_eid`, `mkt_tok`, `yclid`, `_hsenc`, `_hsmi`
- `igshid`, `si`, `ref`, `ref_src`, `ref_url`, `sr_share`, `share`
- `share_id`, `utm_id`, `ved`

**ブラックリスト：**
- `utm_*`で始まるすべてのパラメータ
- `wt.mc_id`, `wt.mc_ev`

## トラブルシューティング

### ポップアップが表示されない
- Chrome を再起動してみてください
- 拡張機能が有効になっているか確認してください

### コピーが失敗する
- ブラウザのセキュリティ設定を確認
- HTTPSサイトでの使用を推奨

### Google Docs変換が動作しない
- Google Docs/Sheets/Slidesの**編集画面**で実行してください
- プレビュー画面では動作しません

## 開発情報

### Manifest v3について
この拡張機能はChrome拡張の最新仕様 Manifest v3 を使用しています。

### requirements
- Chrome 88以上

## bookmarklet版との違い

| 項目 | bookmarklet | Chrome拡張 |
|-----|----------|---------|
| インストール | ブックマークバーに追加 | Chrome拡張としてインストール |
| UI | オーバーレイメニュー | ポップアップメニュー |
| 使いやすさ | ワンクリック | ワンクリック |
| アクセス | ブックマークバーが必要 | 常に拡張機能から利用可能 |
| ファイルサイズ | 約5KB | 約10KB |

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

---

**最終更新：** 2026年2月12日
