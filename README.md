# RPA Practice Environment

RPA（Robotic Process Automation）の練習・トレーニング用環境です。実際のECサイト管理画面を模したモックサイトと、販売管理システムを提供します。

## 概要

このプロジェクトは以下の2つのコンポーネントで構成されています：

### 1. モックECサイト（mock-ec-site）
実際のECサイト管理画面を模したWebアプリケーション：
- **楽天RMS風** - 楽天市場の店舗管理システム（約40カラムCSV対応）
- **Amazon セラーセントラル風** - Amazonマーケットプレイスの販売者管理画面（約30カラムCSV対応）
- **Yahoo!ストアクリエイター風** - Yahoo!ショッピングの店舗管理ツール（注文+商品の2ファイル対応）

### 2. 販売管理システム（sales-management）
Electronベースのデスクトップアプリケーションで、CSVファイルの取り込みと売上データの管理ができます。

## セットアップ

### 必要な環境
- Node.js 18以上

### インストール

```bash
# 依存パッケージを一括インストール
npm run install:all
```

## 使い方

### モックECサイトのみ起動
```bash
npm run start:web
```
ブラウザで http://localhost:8080 にアクセス

### 販売管理アプリのみ起動
```bash
npm run start:app
```

### 両方同時に起動
```bash
npm run dev
```

## ディレクトリ構成

```
dev_rpa/
├── mock-ec-site/       # モックECサイト
│   ├── amazon/         # Amazon セラーセントラル風
│   ├── rakuten/        # 楽天RMS風
│   ├── yahoo/          # Yahoo!ストアクリエイター風
│   ├── css/            # スタイルシート
│   └── js/             # JavaScript（CSV出力、データ生成）
├── sales-management/   # 販売管理Electronアプリ
│   └── renderer/       # フロントエンド
├── sample-data/        # サンプルCSVデータ
│   ├── amazon/
│   ├── rakuten/
│   └── yahoo/
└── docs/               # ドキュメント
```

## ライセンス

MIT
