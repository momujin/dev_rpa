/**
 * ダミーデータ生成モジュール
 * RPA練習用のリアルな注文データを生成
 */

const DataGenerator = {
  // 日本の名字
  lastNames: [
    '佐藤', '鈴木', '高橋', '田中', '伊藤', '渡辺', '山本', '中村', '小林', '加藤',
    '吉田', '山田', '佐々木', '山口', '松本', '井上', '木村', '林', '斎藤', '清水',
    '山崎', '森', '池田', '橋本', '阿部', '石川', '前田', '藤田', '小川', '後藤'
  ],

  // 日本の名前
  firstNames: [
    '太郎', '次郎', '健太', '大輔', '翔太', '拓也', '雄介', '直樹', '和也', '誠',
    '花子', '美咲', '愛', '麻衣', '由美', '真由', '美穂', '彩', '遥', '結衣',
    '陽子', '恵子', '裕子', '明美', '久美子', '智子', '洋子', '幸子', '京子', '真理子'
  ],

  // 都道府県
  prefectures: [
    '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
    '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
    '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
    '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
    '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
  ],

  // 市区町村サンプル
  cities: [
    '札幌市中央区', '仙台市青葉区', 'さいたま市浦和区', '千葉市中央区',
    '新宿区', '渋谷区', '港区', '中央区', '品川区', '世田谷区', '目黒区',
    '横浜市中区', '川崎市川崎区', '名古屋市中区', '京都市中京区',
    '大阪市北区', '大阪市中央区', '神戸市中央区', '福岡市博多区', '那覇市'
  ],

  // 町名サンプル
  towns: [
    '本町', '中央', '駅前', '緑町', '桜町', '若葉', '栄', '旭', '新町', '東町',
    '西町', '南町', '北町', '幸町', '寿町', '富士見', '松原', '竹町', '梅が丘', '花見川'
  ],

  // 商品カテゴリと商品
  products: {
    '食品': [
      { name: '有機玄米 5kg', code: 'FOOD-001', price: 3980 },
      { name: '国産はちみつ 500g', code: 'FOOD-002', price: 2480 },
      { name: 'オリーブオイル 500ml', code: 'FOOD-003', price: 1580 },
      { name: '無添加味噌 1kg', code: 'FOOD-004', price: 980 },
      { name: '有機醤油 500ml', code: 'FOOD-005', price: 680 }
    ],
    '家電': [
      { name: 'ワイヤレスイヤホン TWS-100', code: 'ELEC-001', price: 8980 },
      { name: 'モバイルバッテリー 10000mAh', code: 'ELEC-002', price: 3480 },
      { name: 'USBハブ 7ポート', code: 'ELEC-003', price: 2980 },
      { name: 'LEDデスクライト', code: 'ELEC-004', price: 4980 },
      { name: '卓上加湿器 ミスト', code: 'ELEC-005', price: 2980 }
    ],
    '衣類': [
      { name: 'コットンTシャツ M', code: 'CLTH-001', price: 2980 },
      { name: 'デニムジーンズ 32インチ', code: 'CLTH-002', price: 6980 },
      { name: 'フリースジャケット L', code: 'CLTH-003', price: 4980 },
      { name: 'ウールセーター M', code: 'CLTH-004', price: 7980 },
      { name: 'スポーツソックス 3足組', code: 'CLTH-005', price: 1280 }
    ],
    '日用品': [
      { name: '天然石鹸 3個セット', code: 'DAILY-001', price: 1480 },
      { name: 'バスタオル 2枚組', code: 'DAILY-002', price: 2980 },
      { name: 'ステンレスボトル 500ml', code: 'DAILY-003', price: 1980 },
      { name: 'エコバッグ 大容量', code: 'DAILY-004', price: 980 },
      { name: '竹製カトラリーセット', code: 'DAILY-005', price: 1580 }
    ],
    '美容': [
      { name: 'オーガニック化粧水 200ml', code: 'BEAU-001', price: 3280 },
      { name: '美容液 30ml', code: 'BEAU-002', price: 4980 },
      { name: 'ボディクリーム 200g', code: 'BEAU-003', price: 2480 },
      { name: 'リップバーム 3本セット', code: 'BEAU-004', price: 1280 },
      { name: 'ヘアオイル 100ml', code: 'BEAU-005', price: 1980 }
    ]
  },

  // 支払い方法
  paymentMethods: [
    'クレジットカード',
    '代金引換',
    'コンビニ決済',
    '銀行振込',
    'PayPay',
    '楽天ペイ',
    'Amazon Pay',
    'キャリア決済'
  ],

  // 配送方法
  shippingMethods: [
    { name: '宅急便', price: 600 },
    { name: '宅急便コンパクト', price: 450 },
    { name: 'ネコポス', price: 200 },
    { name: 'ゆうパック', price: 700 },
    { name: 'ゆうパケット', price: 250 },
    { name: '送料無料', price: 0 }
  ],

  // ユーティリティ関数
  random(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },

  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // 電話番号生成
  generatePhone() {
    const area = this.randomInt(10, 99);
    const local = this.randomInt(1000, 9999);
    const number = this.randomInt(1000, 9999);
    return `0${area}-${local}-${number}`;
  },

  // 郵便番号生成
  generatePostalCode() {
    const first = this.randomInt(100, 999);
    const second = this.randomInt(1000, 9999);
    return `${first}-${second}`;
  },

  // メールアドレス生成
  generateEmail(lastName, firstName) {
    const domains = ['example.com', 'test.co.jp', 'sample.ne.jp', 'demo.jp'];
    const romanize = {
      '佐藤': 'sato', '鈴木': 'suzuki', '高橋': 'takahashi', '田中': 'tanaka',
      '伊藤': 'ito', '渡辺': 'watanabe', '山本': 'yamamoto', '中村': 'nakamura'
    };
    const base = romanize[lastName] || 'user';
    const num = this.randomInt(1, 999);
    return `${base}${num}@${this.random(domains)}`;
  },

  // 住所生成
  generateAddress() {
    const prefecture = this.random(this.prefectures);
    const city = this.random(this.cities);
    const town = this.random(this.towns);
    const building = Math.random() > 0.5
      ? ` ${this.random(['ハイツ', 'マンション', 'コーポ', 'ビル'])}${this.randomInt(1, 30)}${this.randomInt(1, 10)}号室`
      : '';
    return {
      prefecture,
      city,
      address1: `${town}${this.randomInt(1, 10)}-${this.randomInt(1, 20)}-${this.randomInt(1, 30)}`,
      address2: building,
      full: `${prefecture}${city}${town}${this.randomInt(1, 10)}-${this.randomInt(1, 20)}-${this.randomInt(1, 30)}${building}`
    };
  },

  // 顧客情報生成
  generateCustomer() {
    const lastName = this.random(this.lastNames);
    const firstName = this.random(this.firstNames);
    const address = this.generateAddress();

    return {
      lastName,
      firstName,
      fullName: `${lastName} ${firstName}`,
      fullNameKana: `${lastName} ${firstName}`, // 実際はカナに変換が必要
      postalCode: this.generatePostalCode(),
      prefecture: address.prefecture,
      city: address.city,
      address1: address.address1,
      address2: address.address2,
      fullAddress: address.full,
      phone: this.generatePhone(),
      email: this.generateEmail(lastName, firstName)
    };
  },

  // 注文商品生成
  generateOrderItems(count = null) {
    const itemCount = count || this.randomInt(1, 4);
    const items = [];
    const categories = Object.keys(this.products);

    for (let i = 0; i < itemCount; i++) {
      const category = this.random(categories);
      const product = this.random(this.products[category]);
      const quantity = this.randomInt(1, 3);

      items.push({
        ...product,
        category,
        quantity,
        subtotal: product.price * quantity
      });
    }

    return items;
  },

  // 注文番号生成
  generateOrderNumber(prefix = '') {
    const date = new Date();
    const dateStr = date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0');
    const random = this.randomInt(100000, 999999);
    return `${prefix}${dateStr}-${random}`;
  },

  // 日付生成（過去N日以内）
  generateDate(daysBack = 30) {
    const now = new Date();
    const past = new Date(now.getTime() - this.randomInt(0, daysBack) * 24 * 60 * 60 * 1000);
    return {
      date: past,
      dateStr: past.toISOString().split('T')[0],
      dateTimeStr: past.toISOString().replace('T', ' ').substring(0, 19),
      jpDateStr: `${past.getFullYear()}年${past.getMonth() + 1}月${past.getDate()}日`
    };
  },

  // 注文データ生成（汎用）
  generateOrder(options = {}) {
    const customer = this.generateCustomer();
    const items = this.generateOrderItems(options.itemCount);
    const orderDate = this.generateDate(options.daysBack || 30);
    const shipping = this.random(this.shippingMethods);
    const payment = this.random(this.paymentMethods);

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = Math.floor(subtotal * 0.1);
    const total = subtotal + shipping.price + tax;

    return {
      orderId: this.generateOrderNumber(options.prefix || ''),
      orderDate,
      customer,
      items,
      shipping: {
        method: shipping.name,
        price: shipping.price
      },
      payment: {
        method: payment
      },
      amounts: {
        subtotal,
        shippingFee: shipping.price,
        tax,
        total
      },
      status: this.random(['新規受付', '処理中', '発送準備中', '発送済み', '完了'])
    };
  },

  // 複数注文生成
  generateOrders(count = 10, options = {}) {
    const orders = [];
    for (let i = 0; i < count; i++) {
      orders.push(this.generateOrder(options));
    }
    return orders;
  },

  // 楽天RMS形式の注文生成
  generateRakutenOrder() {
    const order = this.generateOrder({ prefix: 'R' });
    return {
      ...order,
      rakutenOrderId: `${this.randomInt(100000000, 999999999)}-${this.randomInt(10000000, 99999999)}-${this.randomInt(10000000, 99999999)}`,
      shopCode: `shop${this.randomInt(10000, 99999)}`,
      pointUsed: this.randomInt(0, 500),
      couponDiscount: Math.random() > 0.7 ? this.randomInt(100, 1000) : 0
    };
  },

  // Amazon形式の注文生成
  generateAmazonOrder() {
    const order = this.generateOrder({ prefix: '' });
    return {
      ...order,
      amazonOrderId: `${this.randomInt(100, 999)}-${this.randomInt(1000000, 9999999)}-${this.randomInt(1000000, 9999999)}`,
      merchantOrderId: `AMZ-${order.orderId}`,
      fulfillmentChannel: this.random(['MFN', 'AFN']),
      salesChannel: 'Amazon.co.jp'
    };
  },

  // Yahoo形式の注文生成
  generateYahooOrder() {
    const order = this.generateOrder({ prefix: 'Y' });
    return {
      ...order,
      yahooOrderId: `${this.random(['store'])}-${this.randomInt(10000000, 99999999)}`,
      storeId: `store${this.randomInt(1000, 9999)}`,
      paymentStatus: this.random(['入金済み', '未入金', '入金確認中']),
      tPointUsed: this.randomInt(0, 300)
    };
  }
};

// グローバルに公開
if (typeof window !== 'undefined') {
  window.DataGenerator = DataGenerator;
}

// Node.js環境用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataGenerator;
}
