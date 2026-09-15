# M365 Self Help App

Microsoft 365 Self-Help (Preview) コネクターを利用した Power Apps Code Apps サンプルアプリです。

Microsoft 365 製品に関する質問を入力すると、Microsoft 365 Self-Help API からセルフヘルプ情報を取得し、HTML 形式で分かりやすく表示します。

Teams、Outlook、OneDrive、SharePoint など Microsoft 365 製品のトラブルシューティングを自己解決できるセルフサポートアプリです。

---

## ✨ 主な機能

- Microsoft 365 に関する質問入力
- Microsoft 365 Self-Help API 呼び出し
- AI による解決策取得
- HTML形式レスポンス表示
- 関連サポートリンク表示
- 回答コピー機能
- レスポンシブ対応
- Fluent UI を利用した Microsoft ライクな UI

---

## 📷 アプリイメージ

### 質問入力

```text
Microsoft Teams でカメラが利用できません
```

### 解決方法取得

```text
✅ 原因の説明

✅ 対処手順

✅ 関連ドキュメント

✅ Microsoft サポート情報
```

---

## 🏗 システム構成

```text
┌─────────────────────┐
│ Power Apps Code App │
└─────────┬───────────┘
          │
          ▼
┌──────────────────┐
│ Microsoft365Self │
│ HelpService      │
└─────────┬────────┘
          │
          ▼
┌──────────────────┐
│ M365 Self Help   │
│ Connector        │
└─────────┬────────┘
          │
          ▼
┌──────────────────┐
│ Microsoft Self   │
│ Help Service     │
└──────────────────┘
```

---

## 🧰 使用技術

| 技術 | 内容 |
|--------|--------|
| Power Apps Code Apps | アプリ基盤 |
| React | UI |
| TypeScript | アプリケーション開発 |
| Vite | ビルド環境 |
| Fluent UI React Icons | アイコン |
| DOMPurify | HTMLサニタイズ |
| Microsoft 365 Self-Help Connector | 問い合わせエンジン |

---

## 📁 プロジェクト構成

```text
src
├─ generated
│  ├─ models
│  │   └─ Microsoft365Self_HelpModel.ts
│  └─ services
│      └─ Microsoft365Self_HelpService.ts
│
├─ App.tsx
├─ main.tsx
├─ index.css
└─ assets
```

---

## 🚀 セットアップ

### 1. リポジトリ取得

```bash
git clone <repository-url>

cd my-m365self-app
```

### 2. パッケージインストール

```bash
npm install
```

### 3. 追加ライブラリ

```bash
npm install dompurify
npm install @fluentui/react-icons
```

---

## 🔐 Power Platform 接続

Power Platform 環境へ接続します。

```bash
pac auth create --deviceCode
```

環境選択

```bash
pac env select --environment <Environment-ID>
```

---

## 🔌 Microsoft 365 Self-Help コネクター追加

事前に Power Apps Maker Portal で

```text
Microsoft 365 Self-Help (Preview)
```

接続を作成してください。

接続確認

```bash
pac connection list
```

コネクター追加

```bash
pac code add-data-source \
-a alchemy \
-c <Connection-ID>
```

成功するとサービスコードが自動生成されます。

```text
src/generated/services/
└─ Microsoft365Self_HelpService.ts
```

---

## 📦 ビルド

```bash
npm run build
```

成功例

```text
vite v7.x.x building client environment for production ...

✓ built in 1.7s
```

---

## ☁️ Power Platform へ公開

```bash
pac code push
```

公開後は Power Apps の Code Apps から実行できます。

---

## 🔍 HTMLレスポンス表示

Microsoft 365 Self-Help の回答は HTML 形式で返却されます。

例

```html
<h3>対処手順</h3>

<ol>
  <li>USBカメラ接続確認</li>
  <li>Teams Rooms設定確認</li>
</ol>
```

本アプリでは DOMPurify を利用して安全に描画しています。

```tsx
import DOMPurify from "dompurify";

<div
  className="answer-content html-content"
  dangerouslySetInnerHTML={{
    __html: DOMPurify.sanitize(result.answer),
  }}
/>
```

---

## 🤖 Microsoft 365 Self-Help コネクターとは

Microsoft 365 Self-Help は、Microsoft が提供するセルフサポート API です。

ユーザーからの質問を元に、

- Microsoft ナレッジベース
- トラブルシューティング手順
- サポート記事
- AI による回答

を取得できます。

活用例

- 社内 IT ヘルプデスク
- Teams サポートボット
- Copilot Studio エージェント
- Power Automate FAQ ボット
- 自己解決ポータル

特に Copilot Studio との組み合わせは非常に相性が良く、Microsoft 365 に特化した AI エージェントを比較的簡単に構築できます。

---

## 🔮 今後の拡張予定

- Copilot Studio 連携
- Teams アプリ化
- Power Automate 連携
- 質問履歴保存
- お気に入り登録
- FAQ機能
- 音声入力対応
- フィードバック評価

---

## 📝 関連記事

- Power Apps Code Apps + Dataverse
- Power Apps Code Apps + SharePoint
- Power Apps Code Apps + Office 365 Users
- Power Apps Code Apps + Microsoft 365 Self-Help

---

## 📄 ライセンス

MIT License

---

## 👤 Author

**Shinichi Kawara**

Power Platform / Copilot Studio / Power Apps Code Apps

- note: https://note.com/kagen_shin

Microsoft Learn と Power Platform を中心に技術情報を発信しています。
