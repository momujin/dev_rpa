/**
 * CSV出力モジュール
 * 各ECサイト形式でCSVを生成・ダウンロード
 */

const CSVExporter = {
  // CSVエスケープ処理
  escapeCSV(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  },

  // 配列をCSV行に変換
  arrayToCSVRow(arr) {
    return arr.map(v => this.escapeCSV(v)).join(',');
  },

  // CSVダウンロード
  downloadCSV(content, filename) {
    // BOMを追加してExcelで文字化けしないようにする
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * 楽天RMS形式CSV出力
   * 約40カラムの注文データ
   */
  exportRakutenCSV(orders, filename = 'rakuten_orders.csv') {
    const headers = [
      '受注番号', '受注ステータス', '注文日時', '注文者名', '注文者名カナ',
      '注文者郵便番号', '注文者住所1', '注文者住所2', '注文者住所3',
      '注文者電話番号', '注文者メールアドレス',
      '送付先名', '送付先名カナ', '送付先郵便番号', '送付先住所1', '送付先住所2', '送付先住所3',
      '送付先電話番号', '配送方法', '配送希望日', '配送希望時間帯',
      '商品ID', '商品名', '商品番号', '単価', '数量', '小計',
      '送料', 'ポイント利用額', 'クーポン利用額', '消費税', '合計金額',
      '決済方法', '備考', '店舗備考', 'ギフト設定',
      'のし設定', 'ラッピング', '領収書希望', '請求書希望',
      '楽天注文番号'
    ];

    const rows = [headers];

    orders.forEach(order => {
      order.items.forEach((item, index) => {
        rows.push([
          order.orderId,
          order.status,
          order.orderDate.dateTimeStr,
          order.customer.fullName,
          order.customer.fullNameKana,
          order.customer.postalCode,
          order.customer.prefecture,
          order.customer.city,
          order.customer.address1 + order.customer.address2,
          order.customer.phone,
          order.customer.email,
          order.customer.fullName, // 送付先（同じとする）
          order.customer.fullNameKana,
          order.customer.postalCode,
          order.customer.prefecture,
          order.customer.city,
          order.customer.address1 + order.customer.address2,
          order.customer.phone,
          order.shipping.method,
          '', // 配送希望日
          '', // 配送希望時間帯
          item.code,
          item.name,
          item.code,
          item.price,
          item.quantity,
          item.subtotal,
          index === 0 ? order.shipping.price : 0,
          index === 0 ? (order.pointUsed || 0) : 0,
          index === 0 ? (order.couponDiscount || 0) : 0,
          index === 0 ? order.amounts.tax : 0,
          index === 0 ? order.amounts.total : 0,
          order.payment.method,
          '', // 備考
          '', // 店舗備考
          '', // ギフト設定
          '', // のし設定
          '', // ラッピング
          '', // 領収書希望
          '', // 請求書希望
          order.rakutenOrderId
        ]);
      });
    });

    const csv = rows.map(row => this.arrayToCSVRow(row)).join('\n');
    this.downloadCSV(csv, filename);
    return csv;
  },

  /**
   * Amazon形式CSV出力
   * 約30カラムの注文レポート
   */
  exportAmazonCSV(orders, filename = 'amazon_orders.csv') {
    const headers = [
      'amazon-order-id', 'merchant-order-id', 'purchase-date', 'last-updated-date',
      'order-status', 'fulfillment-channel', 'sales-channel',
      'ship-service-level', 'product-name', 'sku', 'asin',
      'item-status', 'quantity', 'currency', 'item-price', 'item-tax',
      'shipping-price', 'shipping-tax', 'gift-wrap-price', 'gift-wrap-tax',
      'item-promotion-discount', 'ship-promotion-discount',
      'ship-city', 'ship-state', 'ship-postal-code', 'ship-country',
      'recipient-name', 'buyer-email', 'buyer-name', 'buyer-phone-number'
    ];

    const rows = [headers];

    orders.forEach(order => {
      order.items.forEach((item, index) => {
        rows.push([
          order.amazonOrderId,
          order.merchantOrderId || '',
          order.orderDate.dateTimeStr,
          order.orderDate.dateTimeStr,
          order.status === '完了' ? 'Shipped' : 'Pending',
          order.fulfillmentChannel || 'MFN',
          order.salesChannel || 'Amazon.co.jp',
          order.shipping.method,
          item.name,
          item.code,
          `B${DataGenerator.randomInt(100000000, 999999999)}`, // ASIN風
          'Unshipped',
          item.quantity,
          'JPY',
          item.price,
          Math.floor(item.price * 0.1),
          index === 0 ? order.shipping.price : 0,
          index === 0 ? Math.floor(order.shipping.price * 0.1) : 0,
          0, // gift-wrap-price
          0, // gift-wrap-tax
          0, // item-promotion-discount
          0, // ship-promotion-discount
          order.customer.city,
          order.customer.prefecture,
          order.customer.postalCode,
          'JP',
          order.customer.fullName,
          order.customer.email,
          order.customer.fullName,
          order.customer.phone
        ]);
      });
    });

    const csv = rows.map(row => this.arrayToCSVRow(row)).join('\n');
    this.downloadCSV(csv, filename);
    return csv;
  },

  /**
   * Yahoo形式CSV出力（注文情報）
   */
  exportYahooOrderCSV(orders, filename = 'yahoo_orders.csv') {
    const headers = [
      '注文ID', 'ストアID', '注文日時', '注文ステータス', '入金ステータス',
      '注文者名', '注文者名フリガナ', '注文者郵便番号', '注文者都道府県',
      '注文者市区町村', '注文者住所', '注文者電話番号', '注文者メールアドレス',
      '送付先名', '送付先名フリガナ', '送付先郵便番号', '送付先都道府県',
      '送付先市区町村', '送付先住所', '送付先電話番号',
      '配送方法', '配送希望日', '配送希望時間',
      '決済方法', '商品合計', '送料', 'Tポイント利用', '消費税', '合計金額',
      '備考', '店舗用メモ'
    ];

    const rows = [headers];

    orders.forEach(order => {
      rows.push([
        order.yahooOrderId || order.orderId,
        order.storeId || 'store0001',
        order.orderDate.dateTimeStr,
        order.status,
        order.paymentStatus || '入金済み',
        order.customer.fullName,
        order.customer.fullNameKana,
        order.customer.postalCode,
        order.customer.prefecture,
        order.customer.city,
        order.customer.address1 + order.customer.address2,
        order.customer.phone,
        order.customer.email,
        order.customer.fullName,
        order.customer.fullNameKana,
        order.customer.postalCode,
        order.customer.prefecture,
        order.customer.city,
        order.customer.address1 + order.customer.address2,
        order.customer.phone,
        order.shipping.method,
        '',
        '',
        order.payment.method,
        order.amounts.subtotal,
        order.shipping.price,
        order.tPointUsed || 0,
        order.amounts.tax,
        order.amounts.total,
        '',
        ''
      ]);
    });

    const csv = rows.map(row => this.arrayToCSVRow(row)).join('\n');
    this.downloadCSV(csv, filename);
    return csv;
  },

  /**
   * Yahoo形式CSV出力（商品明細）
   */
  exportYahooItemCSV(orders, filename = 'yahoo_items.csv') {
    const headers = [
      '注文ID', '商品ID', '商品コード', '商品名', 'カテゴリ',
      '単価', '数量', '小計', '商品オプション', '備考'
    ];

    const rows = [headers];

    orders.forEach(order => {
      order.items.forEach(item => {
        rows.push([
          order.yahooOrderId || order.orderId,
          `ITEM-${DataGenerator.randomInt(10000, 99999)}`,
          item.code,
          item.name,
          item.category,
          item.price,
          item.quantity,
          item.subtotal,
          '',
          ''
        ]);
      });
    });

    const csv = rows.map(row => this.arrayToCSVRow(row)).join('\n');
    this.downloadCSV(csv, filename);
    return csv;
  },

  /**
   * 汎用形式CSV出力（販売管理システムインポート用）
   */
  exportGenericCSV(orders, filename = 'orders.csv') {
    const headers = [
      '注文番号', '注文日', 'ECサイト', 'ステータス',
      '顧客名', '郵便番号', '住所', '電話番号', 'メールアドレス',
      '商品コード', '商品名', '数量', '単価', '小計',
      '送料', '消費税', '合計金額', '決済方法', '配送方法'
    ];

    const rows = [headers];

    orders.forEach(order => {
      const ecSite = order.rakutenOrderId ? '楽天' :
                     order.amazonOrderId ? 'Amazon' :
                     order.yahooOrderId ? 'Yahoo' : 'その他';

      order.items.forEach((item, index) => {
        rows.push([
          order.orderId,
          order.orderDate.dateStr,
          ecSite,
          order.status,
          order.customer.fullName,
          order.customer.postalCode,
          order.customer.fullAddress,
          order.customer.phone,
          order.customer.email,
          item.code,
          item.name,
          item.quantity,
          item.price,
          item.subtotal,
          index === 0 ? order.shipping.price : 0,
          index === 0 ? order.amounts.tax : 0,
          index === 0 ? order.amounts.total : 0,
          order.payment.method,
          order.shipping.method
        ]);
      });
    });

    const csv = rows.map(row => this.arrayToCSVRow(row)).join('\n');
    this.downloadCSV(csv, filename);
    return csv;
  },

  /**
   * CSV文字列を生成（ダウンロードせず文字列のみ返す）
   */
  generateCSVString(orders, format = 'generic') {
    const tempDownload = this.downloadCSV;
    let result = '';

    this.downloadCSV = (content) => { result = content; };

    switch (format) {
      case 'rakuten':
        this.exportRakutenCSV(orders);
        break;
      case 'amazon':
        this.exportAmazonCSV(orders);
        break;
      case 'yahoo-order':
        this.exportYahooOrderCSV(orders);
        break;
      case 'yahoo-item':
        this.exportYahooItemCSV(orders);
        break;
      default:
        this.exportGenericCSV(orders);
    }

    this.downloadCSV = tempDownload;
    return result;
  }
};

// グローバルに公開
if (typeof window !== 'undefined') {
  window.CSVExporter = CSVExporter;
}

// Node.js環境用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CSVExporter;
}
