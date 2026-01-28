/**
 * 販売管理システム（ブラウザ版）- メインアプリケーション
 */

// グローバル変数
let orders = [];
let filteredOrders = [];
let currentPage = 1;
const itemsPerPage = 10;
let editingOrderId = null;
let csvData = null;

// ストレージキー
const STORAGE_KEY = 'sales_management_orders';

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
  // 日付表示
  updateHeaderDate();

  // 注文データ読み込み
  loadOrders();

  // イベントリスナー設定
  setupEventListeners();

  // 初期商品行追加
  addItemRow();

  // 今日の日付をデフォルト設定
  document.getElementById('input-order-date').value = new Date().toISOString().split('T')[0];

  updateStatistics();
});

// ヘッダー日付更新
function updateHeaderDate() {
  const now = new Date();
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
  document.getElementById('header-date').textContent = dateStr;
}

// イベントリスナー設定
function setupEventListeners() {
  // サイドバーナビゲーション
  document.querySelectorAll('.sidebar-nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const screen = e.currentTarget.dataset.screen;
      showScreen(screen);
    });
  });

  // フォーム送信
  document.getElementById('form-order').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveOrder();
  });

  // モーダル外クリックで閉じる
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
      }
    });
  });
}

// 画面切り替え
function showScreen(screenId) {
  // ナビゲーション更新
  document.querySelectorAll('.sidebar-nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.screen === screenId) {
      item.classList.add('active');
    }
  });

  // 画面切り替え
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  document.getElementById(`screen-${screenId}`).classList.add('active');

  // 入力画面の場合、タイトルをリセット
  if (screenId === 'input' && !editingOrderId) {
    document.getElementById('input-title').textContent = '新規注文入力';
    clearForm();
  }
}

// 注文データ読み込み（LocalStorage）
function loadOrders() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    orders = saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('Failed to load orders:', e);
    orders = [];
  }
  filteredOrders = [...orders];
  renderOrders();
  updateStatistics();
}

// 注文データ保存（LocalStorage）
function saveOrdersToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('Failed to save orders:', e);
    showToast('保存に失敗しました', 'error');
  }
  updateStatistics();
}

// 統計更新
function updateStatistics() {
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter(o => o.orderDate === today);
  const processingOrders = orders.filter(o => o.status === '新規受付' || o.status === '処理中');
  const totalAmount = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  document.getElementById('stat-total').textContent = orders.length;
  document.getElementById('stat-today').textContent = todayOrders.length;
  document.getElementById('stat-processing').textContent = processingOrders.length;
  document.getElementById('stat-total-amount').textContent = '¥' + totalAmount.toLocaleString();
  document.getElementById('header-order-count').textContent = `登録件数: ${orders.length}件`;
}

// 注文一覧描画
function renderOrders() {
  const tbody = document.getElementById('tbody-orders');
  tbody.innerHTML = '';

  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageOrders = filteredOrders.slice(start, end);

  if (pageOrders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #999; padding: 60px;">データがありません<br><small>「サンプルデータ読込」ボタンでテストデータを追加できます</small></td></tr>';
    document.getElementById('result-count').textContent = 0;
    renderPagination();
    return;
  }

  pageOrders.forEach((order, index) => {
    const globalIndex = start + index;
    const badgeClass = {
      '新規受付': 'badge-new',
      '処理中': 'badge-processing',
      '発送済み': 'badge-shipped',
      '完了': 'badge-complete'
    }[order.status] || 'badge-new';

    const itemsText = order.items && order.items.length > 0
      ? order.items[0].name + (order.items.length > 1 ? ` 他${order.items.length - 1}点` : '')
      : '-';

    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="order-id" data-rpa-field="order-id-${globalIndex}">${order.orderId || '-'}</td>
      <td>${order.orderDate || '-'}</td>
      <td>${order.ecSite || '-'}</td>
      <td>${order.customerName || '-'}</td>
      <td>${itemsText}</td>
      <td>¥${(order.total || 0).toLocaleString()}</td>
      <td><span class="badge ${badgeClass}">${order.status || '新規受付'}</span></td>
      <td>
        <button class="btn btn-small btn-outline" onclick="showOrderDetail('${order.orderId}')" data-rpa-field="detail-btn-${globalIndex}">
          詳細
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });

  document.getElementById('result-count').textContent = filteredOrders.length;
  renderPagination();
}

// ページネーション描画
function renderPagination() {
  const pagination = document.getElementById('pagination');
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }

  let html = `<button ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">&lt; 前へ</button>`;

  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
  }

  html += `<button ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">次へ &gt;</button>`;

  pagination.innerHTML = html;
}

// ページ変更
function changePage(page) {
  currentPage = page;
  renderOrders();
}

// 検索
function searchOrders() {
  const orderId = document.getElementById('search-order-id').value.toLowerCase();
  const customer = document.getElementById('search-customer').value.toLowerCase();
  const status = document.getElementById('search-status').value;
  const ecSite = document.getElementById('search-ec-site').value;

  filteredOrders = orders.filter(order => {
    if (orderId && !(order.orderId || '').toLowerCase().includes(orderId)) return false;
    if (customer && !(order.customerName || '').toLowerCase().includes(customer)) return false;
    if (status && order.status !== status) return false;
    if (ecSite && order.ecSite !== ecSite) return false;
    return true;
  });

  currentPage = 1;
  renderOrders();
}

// 検索クリア
function clearSearch() {
  document.getElementById('search-order-id').value = '';
  document.getElementById('search-customer').value = '';
  document.getElementById('search-status').value = '';
  document.getElementById('search-ec-site').value = '';
  filteredOrders = [...orders];
  currentPage = 1;
  renderOrders();
}

// 注文詳細表示
function showOrderDetail(orderId) {
  const order = orders.find(o => o.orderId === orderId);
  if (!order) return;

  editingOrderId = orderId;

  const modal = document.getElementById('modal-order-detail');
  const body = document.getElementById('modal-body-detail');

  const itemsHtml = (order.items || []).map(item => `
    <tr>
      <td>${item.code || '-'}</td>
      <td>${item.name || '-'}</td>
      <td>${item.quantity || 0}</td>
      <td>¥${(item.price || 0).toLocaleString()}</td>
      <td>¥${(item.subtotal || 0).toLocaleString()}</td>
    </tr>
  `).join('');

  body.innerHTML = `
    <div class="section-title">注文情報</div>
    <div class="form-row form-row-3 mb-20">
      <div><strong>注文番号:</strong> ${order.orderId || '-'}</div>
      <div><strong>注文日:</strong> ${order.orderDate || '-'}</div>
      <div><strong>ECサイト:</strong> ${order.ecSite || '-'}</div>
    </div>
    <div class="form-row form-row-2 mb-20">
      <div><strong>ステータス:</strong> ${order.status || '-'}</div>
      <div><strong>決済方法:</strong> ${order.paymentMethod || '-'}</div>
    </div>

    <div class="section-title">顧客情報</div>
    <div class="form-row form-row-2 mb-20">
      <div><strong>顧客名:</strong> ${order.customerName || '-'}</div>
      <div><strong>電話番号:</strong> ${order.phone || '-'}</div>
    </div>
    <div class="mb-20"><strong>住所:</strong> 〒${order.postalCode || ''} ${order.address || '-'}</div>
    <div class="mb-20"><strong>メール:</strong> ${order.email || '-'}</div>

    <div class="section-title">商品情報</div>
    <table class="table">
      <thead>
        <tr>
          <th>商品コード</th>
          <th>商品名</th>
          <th>数量</th>
          <th>単価</th>
          <th>小計</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml || '<tr><td colspan="5" style="text-align: center;">商品情報なし</td></tr>'}
      </tbody>
    </table>

    <div class="section-title mt-20">金額情報</div>
    <div class="form-row form-row-4">
      <div><strong>商品合計:</strong> ¥${(order.subtotal || 0).toLocaleString()}</div>
      <div><strong>送料:</strong> ¥${(order.shippingFee || 0).toLocaleString()}</div>
      <div><strong>消費税:</strong> ¥${(order.tax || 0).toLocaleString()}</div>
      <div style="font-size: 18px;"><strong>合計:</strong> ¥${(order.total || 0).toLocaleString()}</div>
    </div>
  `;

  modal.classList.add('active');
}

// モーダルを閉じる
function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

// 注文編集
function editOrder() {
  const order = orders.find(o => o.orderId === editingOrderId);
  if (!order) return;

  closeModal('modal-order-detail');
  showScreen('input');
  document.getElementById('input-title').textContent = '注文編集';

  // フォームに値をセット
  document.getElementById('input-order-id').value = order.orderId || '';
  document.getElementById('input-order-date').value = order.orderDate || '';
  document.getElementById('input-ec-site').value = order.ecSite || '';
  document.getElementById('input-status').value = order.status || '新規受付';
  document.getElementById('input-payment-method').value = order.paymentMethod || '';
  document.getElementById('input-customer-name').value = order.customerName || '';
  document.getElementById('input-customer-kana').value = order.customerKana || '';
  document.getElementById('input-postal-code').value = order.postalCode || '';
  document.getElementById('input-phone').value = order.phone || '';
  document.getElementById('input-email').value = order.email || '';
  document.getElementById('input-address').value = order.address || '';
  document.getElementById('input-shipping-fee').value = order.shippingFee || 0;
  document.getElementById('input-tax').value = order.tax || 0;
  document.getElementById('input-discount').value = order.discount || 0;
  document.getElementById('input-total').value = order.total || 0;

  // 商品行をセット
  const container = document.getElementById('items-container');
  container.innerHTML = '';
  (order.items || []).forEach(item => {
    addItemRow(item);
  });
  if (!order.items || order.items.length === 0) {
    addItemRow();
  }

  calculateTotal();
}

// 注文削除
function deleteOrder() {
  if (!confirm('この注文を削除しますか？')) return;

  orders = orders.filter(o => o.orderId !== editingOrderId);
  saveOrdersToStorage();
  filteredOrders = [...orders];
  renderOrders();
  closeModal('modal-order-detail');
  editingOrderId = null;
  showToast('削除しました');
}

// 全件削除
function deleteAllOrders() {
  if (!confirm('すべての注文データを削除しますか？\nこの操作は取り消せません。')) return;

  orders = [];
  saveOrdersToStorage();
  filteredOrders = [];
  renderOrders();
  showToast('全件削除しました');
}

// 商品行追加
function addItemRow(item = {}) {
  const container = document.getElementById('items-container');
  const index = container.children.length;

  const row = document.createElement('div');
  row.className = 'item-row';
  row.innerHTML = `
    <input type="text" class="form-control item-code" data-rpa-field="item-code-${index}" placeholder="商品コード" value="${item.code || ''}">
    <input type="text" class="form-control item-name" data-rpa-field="item-name-${index}" placeholder="商品名" value="${item.name || ''}">
    <input type="number" class="form-control item-quantity" data-rpa-field="item-quantity-${index}" placeholder="数量" value="${item.quantity || 1}" min="1" onchange="calculateTotal()">
    <input type="number" class="form-control item-price" data-rpa-field="item-price-${index}" placeholder="単価" value="${item.price || 0}" min="0" onchange="calculateTotal()">
    <input type="text" class="form-control item-subtotal" data-rpa-field="item-subtotal-${index}" value="¥${(item.subtotal || 0).toLocaleString()}" readonly>
    <button type="button" class="btn btn-remove" onclick="removeItemRow(this)">×</button>
  `;
  container.appendChild(row);
  calculateTotal();
}

// 商品行削除
function removeItemRow(btn) {
  const container = document.getElementById('items-container');
  if (container.children.length > 1) {
    btn.parentElement.remove();
    calculateTotal();
  }
}

// 合計計算
function calculateTotal() {
  const rows = document.querySelectorAll('#items-container .item-row');
  let subtotal = 0;

  rows.forEach(row => {
    const quantity = parseInt(row.querySelector('.item-quantity')?.value) || 0;
    const price = parseInt(row.querySelector('.item-price')?.value) || 0;
    const itemSubtotal = quantity * price;

    const subtotalInput = row.querySelector('.item-subtotal');
    if (subtotalInput) {
      subtotalInput.value = '¥' + itemSubtotal.toLocaleString();
    }
    subtotal += itemSubtotal;
  });

  document.getElementById('display-subtotal').textContent = '¥' + subtotal.toLocaleString();

  const shippingFee = parseInt(document.getElementById('input-shipping-fee').value) || 0;
  const tax = parseInt(document.getElementById('input-tax').value) || 0;
  const discount = parseInt(document.getElementById('input-discount').value) || 0;

  const total = subtotal + shippingFee + tax - discount;
  document.getElementById('input-total').value = total;
}

// 注文保存
async function saveOrder() {
  const form = document.getElementById('form-order');
  form.setAttribute('data-status', 'processing');

  // 商品情報収集
  const items = [];
  document.querySelectorAll('#items-container .item-row').forEach(row => {
    const code = row.querySelector('.item-code').value;
    const name = row.querySelector('.item-name').value;
    const quantity = parseInt(row.querySelector('.item-quantity').value) || 0;
    const price = parseInt(row.querySelector('.item-price').value) || 0;

    if (name || code) {
      items.push({
        code,
        name,
        quantity,
        price,
        subtotal: quantity * price
      });
    }
  });

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

  const orderData = {
    orderId: document.getElementById('input-order-id').value,
    orderDate: document.getElementById('input-order-date').value,
    ecSite: document.getElementById('input-ec-site').value,
    status: document.getElementById('input-status').value,
    paymentMethod: document.getElementById('input-payment-method').value,
    customerName: document.getElementById('input-customer-name').value,
    customerKana: document.getElementById('input-customer-kana').value,
    postalCode: document.getElementById('input-postal-code').value,
    phone: document.getElementById('input-phone').value,
    email: document.getElementById('input-email').value,
    address: document.getElementById('input-address').value,
    items,
    subtotal,
    shippingFee: parseInt(document.getElementById('input-shipping-fee').value) || 0,
    tax: parseInt(document.getElementById('input-tax').value) || 0,
    discount: parseInt(document.getElementById('input-discount').value) || 0,
    total: parseInt(document.getElementById('input-total').value) || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 編集か新規かを判定
  const existingIndex = orders.findIndex(o => o.orderId === orderData.orderId);
  if (existingIndex >= 0) {
    orderData.createdAt = orders[existingIndex].createdAt;
    orders[existingIndex] = orderData;
  } else {
    orders.unshift(orderData);
  }

  saveOrdersToStorage();
  filteredOrders = [...orders];

  form.setAttribute('data-status', 'success');

  setTimeout(() => {
    form.setAttribute('data-status', 'ready');
    clearForm();
    showScreen('list');
    renderOrders();
    showToast('保存しました');
  }, 300);
}

// フォームクリア
function clearForm() {
  editingOrderId = null;
  document.getElementById('form-order').reset();
  document.getElementById('input-order-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('items-container').innerHTML = '';
  addItemRow();
  document.getElementById('input-shipping-fee').value = 0;
  document.getElementById('input-tax').value = 0;
  document.getElementById('input-discount').value = 0;
  document.getElementById('input-total').value = 0;
  document.getElementById('display-subtotal').textContent = '¥0';
  document.getElementById('input-title').textContent = '新規注文入力';
}

// ファイル選択（ブラウザAPI）
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  document.getElementById('file-name').textContent = file.name;
  document.getElementById('btn-import').disabled = false;

  const reader = new FileReader();
  reader.onload = function(e) {
    const content = e.target.result;
    csvData = parseCSV(content);
    showPreview();
  };
  reader.readAsText(file, 'UTF-8');
}

// CSV解析
function parseCSV(content) {
  // BOM削除
  content = content.replace(/^\uFEFF/, '');

  const lines = content.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map(line => parseCSVLine(line));

  return { headers, rows };
}

// CSV行解析
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

// プレビュー表示
function showPreview() {
  if (!csvData) return;

  const previewCard = document.getElementById('preview-card');
  const thead = document.getElementById('thead-preview');
  const tbody = document.getElementById('tbody-preview');

  // ヘッダー
  thead.innerHTML = '<tr>' + csvData.headers.slice(0, 10).map(h => `<th>${h}</th>`).join('') + '</tr>';

  // ボディ（最大10行）
  tbody.innerHTML = csvData.rows.slice(0, 10).map(row =>
    '<tr>' + row.slice(0, 10).map(cell => `<td>${cell}</td>`).join('') + '</tr>'
  ).join('');

  document.getElementById('preview-count').textContent = `${csvData.rows.length}件`;
  previewCard.style.display = 'block';
}

// CSVインポート
function importCSV() {
  if (!csvData) return;

  const format = document.getElementById('select-import-format').value;
  const card = document.getElementById('import-card');
  card.setAttribute('data-status', 'processing');

  let importedCount = 0;
  let errorCount = 0;
  const errors = [];

  csvData.rows.forEach((row, index) => {
    try {
      const order = convertRowToOrder(row, csvData.headers, format);
      if (order && order.orderId) {
        // 重複チェック
        const existingIndex = orders.findIndex(o => o.orderId === order.orderId);
        if (existingIndex >= 0) {
          orders[existingIndex] = order;
        } else {
          orders.unshift(order);
        }
        importedCount++;
      }
    } catch (e) {
      errorCount++;
      errors.push(`行${index + 2}: ${e.message}`);
    }
  });

  saveOrdersToStorage();
  filteredOrders = [...orders];
  renderOrders();

  // 結果表示
  const resultCard = document.getElementById('import-result-card');
  const resultDiv = document.getElementById('import-result');

  resultDiv.innerHTML = `
    <h4>インポート完了</h4>
    <ul>
      <li class="success">✓ 成功: ${importedCount}件</li>
      ${errorCount > 0 ? `<li class="error">✗ エラー: ${errorCount}件</li>` : ''}
    </ul>
    ${errors.length > 0 ? `<div class="mt-10"><strong>エラー詳細:</strong><ul>${errors.slice(0, 5).map(e => `<li class="error">${e}</li>`).join('')}</ul></div>` : ''}
  `;

  resultCard.style.display = 'block';
  card.setAttribute('data-status', 'success');

  setTimeout(() => {
    card.setAttribute('data-status', 'ready');
  }, 2000);

  showToast(`${importedCount}件インポートしました`);
}

// CSVデータを注文データに変換
function convertRowToOrder(row, headers, format) {
  const getValue = (columnName) => {
    const index = headers.findIndex(h => h.includes(columnName));
    return index >= 0 ? row[index] : '';
  };

  let order = {};

  if (format === 'rakuten') {
    order = {
      orderId: getValue('受注番号') || getValue('楽天注文番号'),
      orderDate: getValue('注文日時')?.split(' ')[0] || new Date().toISOString().split('T')[0],
      ecSite: '楽天',
      status: getValue('受注ステータス') || '新規受付',
      paymentMethod: getValue('決済方法'),
      customerName: getValue('注文者名'),
      customerKana: getValue('注文者名カナ'),
      postalCode: getValue('注文者郵便番号'),
      phone: getValue('注文者電話番号'),
      email: getValue('注文者メール'),
      address: getValue('注文者住所1') + getValue('注文者住所2') + getValue('注文者住所3'),
      items: [{
        code: getValue('商品ID') || getValue('商品番号'),
        name: getValue('商品名'),
        quantity: parseInt(getValue('数量')) || 1,
        price: parseInt(getValue('単価')) || 0,
        subtotal: parseInt(getValue('小計')) || 0
      }],
      shippingFee: parseInt(getValue('送料')) || 0,
      tax: parseInt(getValue('消費税')) || 0,
      total: parseInt(getValue('合計金額')) || 0
    };
  } else if (format === 'amazon') {
    order = {
      orderId: getValue('amazon-order-id') || getValue('merchant-order-id'),
      orderDate: getValue('purchase-date')?.split(' ')[0] || new Date().toISOString().split('T')[0],
      ecSite: 'Amazon',
      status: getValue('order-status') === 'Shipped' ? '発送済み' : '新規受付',
      customerName: getValue('recipient-name') || getValue('buyer-name'),
      email: getValue('buyer-email'),
      phone: getValue('buyer-phone-number'),
      address: getValue('ship-city') + ' ' + getValue('ship-state'),
      postalCode: getValue('ship-postal-code'),
      items: [{
        code: getValue('sku'),
        name: getValue('product-name'),
        quantity: parseInt(getValue('quantity')) || 1,
        price: parseInt(getValue('item-price')) || 0,
        subtotal: parseInt(getValue('item-price')) * (parseInt(getValue('quantity')) || 1)
      }],
      shippingFee: parseInt(getValue('shipping-price')) || 0,
      tax: parseInt(getValue('item-tax')) || 0,
      total: parseInt(getValue('item-price')) || 0
    };
  } else if (format === 'yahoo') {
    order = {
      orderId: getValue('注文ID'),
      orderDate: getValue('注文日時')?.split(' ')[0] || new Date().toISOString().split('T')[0],
      ecSite: 'Yahoo',
      status: getValue('注文ステータス') || '新規受付',
      paymentMethod: getValue('決済方法'),
      customerName: getValue('注文者名'),
      customerKana: getValue('注文者名フリガナ'),
      postalCode: getValue('注文者郵便番号'),
      phone: getValue('注文者電話番号'),
      email: getValue('注文者メール'),
      address: getValue('注文者都道府県') + getValue('注文者市区町村') + getValue('注文者住所'),
      items: [],
      shippingFee: parseInt(getValue('送料')) || 0,
      tax: parseInt(getValue('消費税')) || 0,
      total: parseInt(getValue('合計金額')) || 0
    };
  } else {
    // 汎用形式
    order = {
      orderId: getValue('注文番号'),
      orderDate: getValue('注文日') || new Date().toISOString().split('T')[0],
      ecSite: getValue('ECサイト') || 'その他',
      status: getValue('ステータス') || '新規受付',
      paymentMethod: getValue('決済方法'),
      customerName: getValue('顧客名'),
      postalCode: getValue('郵便番号'),
      phone: getValue('電話番号'),
      email: getValue('メール'),
      address: getValue('住所'),
      items: [{
        code: getValue('商品コード'),
        name: getValue('商品名'),
        quantity: parseInt(getValue('数量')) || 1,
        price: parseInt(getValue('単価')) || 0,
        subtotal: parseInt(getValue('小計')) || 0
      }],
      shippingFee: parseInt(getValue('送料')) || 0,
      tax: parseInt(getValue('消費税')) || 0,
      total: parseInt(getValue('合計金額')) || 0
    };
  }

  // subtotal計算
  order.subtotal = order.items.reduce((sum, item) => sum + (item.subtotal || item.price * item.quantity), 0);
  order.createdAt = new Date().toISOString();
  order.updatedAt = new Date().toISOString();

  return order;
}

// サンプルデータ読込
function loadSampleData() {
  const sampleOrders = [
    {
      orderId: 'R20260128-001',
      orderDate: '2026-01-28',
      ecSite: '楽天',
      status: '新規受付',
      paymentMethod: 'クレジットカード',
      customerName: '山田太郎',
      customerKana: 'ヤマダタロウ',
      postalCode: '150-0001',
      phone: '03-1234-5678',
      email: 'yamada@example.com',
      address: '東京都渋谷区神宮前1-2-3',
      items: [{ code: 'FOOD-001', name: '有機玄米 5kg', quantity: 2, price: 3980, subtotal: 7960 }],
      subtotal: 7960,
      shippingFee: 600,
      tax: 856,
      total: 9416,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      orderId: 'AMZ-20260128-002',
      orderDate: '2026-01-28',
      ecSite: 'Amazon',
      status: '処理中',
      paymentMethod: '代金引換',
      customerName: '鈴木花子',
      postalCode: '530-0001',
      phone: '06-9876-5432',
      email: 'suzuki@example.com',
      address: '大阪府大阪市北区梅田2-3-4',
      items: [{ code: 'ELEC-001', name: 'ワイヤレスイヤホン TWS-100', quantity: 1, price: 8980, subtotal: 8980 }],
      subtotal: 8980,
      shippingFee: 450,
      tax: 943,
      total: 10373,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      orderId: 'Y-20260128-003',
      orderDate: '2026-01-28',
      ecSite: 'Yahoo',
      status: '発送済み',
      paymentMethod: 'PayPay',
      customerName: '佐藤健一',
      postalCode: '460-0001',
      phone: '052-1111-2222',
      email: 'sato@example.com',
      address: '愛知県名古屋市中区栄3-4-5',
      items: [{ code: 'BEAU-001', name: 'オーガニック化粧水 200ml', quantity: 1, price: 3280, subtotal: 3280 }],
      subtotal: 3280,
      shippingFee: 200,
      tax: 348,
      total: 3828,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      orderId: 'R20260127-004',
      orderDate: '2026-01-27',
      ecSite: '楽天',
      status: '完了',
      paymentMethod: '銀行振込',
      customerName: '高橋美咲',
      postalCode: '812-0001',
      phone: '092-3333-4444',
      email: 'takahashi@example.com',
      address: '福岡県福岡市博多区博多駅前1-2-3',
      items: [{ code: 'DAILY-003', name: 'ステンレスボトル 500ml', quantity: 3, price: 1980, subtotal: 5940 }],
      subtotal: 5940,
      shippingFee: 600,
      tax: 654,
      total: 7194,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      orderId: 'AMZ-20260127-005',
      orderDate: '2026-01-27',
      ecSite: 'Amazon',
      status: '完了',
      paymentMethod: 'クレジットカード',
      customerName: '田中裕子',
      postalCode: '980-0001',
      phone: '022-5555-6666',
      email: 'tanaka@example.com',
      address: '宮城県仙台市青葉区中央1-1-1',
      items: [{ code: 'CLTH-002', name: 'デニムジーンズ 32インチ', quantity: 1, price: 6980, subtotal: 6980 }],
      subtotal: 6980,
      shippingFee: 700,
      tax: 768,
      total: 8448,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // 既存データとマージ（重複は上書き）
  sampleOrders.forEach(sample => {
    const existingIndex = orders.findIndex(o => o.orderId === sample.orderId);
    if (existingIndex >= 0) {
      orders[existingIndex] = sample;
    } else {
      orders.push(sample);
    }
  });

  saveOrdersToStorage();
  filteredOrders = [...orders];
  renderOrders();
  showToast('サンプルデータを読み込みました');
}

// データエクスポート
function exportData() {
  const format = document.getElementById('export-format').value;
  const range = document.getElementById('export-range').value;
  const data = range === 'filtered' ? filteredOrders : orders;

  if (data.length === 0) {
    showToast('エクスポートするデータがありません', 'warning');
    return;
  }

  const now = new Date();
  const dateStr = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}`;

  if (format === 'json') {
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, `orders_${dateStr}.json`, 'application/json');
  } else {
    const csv = convertToCSV(data);
    // BOM付きUTF-8
    const bom = '\uFEFF';
    downloadFile(bom + csv, `orders_${dateStr}.csv`, 'text/csv');
  }

  showToast('エクスポートしました');
}

// JSONからCSVに変換
function convertToCSV(data) {
  const headers = ['注文番号', '注文日', 'ECサイト', 'ステータス', '顧客名', '郵便番号', '住所', '電話番号', 'メール', '商品名', '数量', '単価', '送料', '消費税', '合計金額', '決済方法'];
  const rows = [headers.join(',')];

  data.forEach(order => {
    const item = order.items && order.items[0] ? order.items[0] : {};
    const row = [
      order.orderId || '',
      order.orderDate || '',
      order.ecSite || '',
      order.status || '',
      order.customerName || '',
      order.postalCode || '',
      `"${(order.address || '').replace(/"/g, '""')}"`,
      order.phone || '',
      order.email || '',
      `"${(item.name || '').replace(/"/g, '""')}"`,
      item.quantity || '',
      item.price || '',
      order.shippingFee || 0,
      order.tax || 0,
      order.total || 0,
      order.paymentMethod || ''
    ];
    rows.push(row.join(','));
  });

  return rows.join('\n');
}

// ファイルダウンロード
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// バックアップ
function backupData() {
  if (orders.length === 0) {
    showToast('バックアップするデータがありません', 'warning');
    return;
  }

  const backup = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    orders: orders
  };

  const json = JSON.stringify(backup, null, 2);
  const now = new Date();
  const dateStr = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}`;
  downloadFile(json, `backup_${dateStr}.json`, 'application/json');
  showToast('バックアップを作成しました');
}

// 復元
function restoreData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const backup = JSON.parse(e.target.result);
      if (backup.orders && Array.isArray(backup.orders)) {
        if (!confirm(`${backup.orders.length}件のデータを復元しますか？\n現在のデータは上書きされます。`)) return;

        orders = backup.orders;
        saveOrdersToStorage();
        filteredOrders = [...orders];
        renderOrders();
        showToast('データを復元しました');
      } else {
        showToast('無効なバックアップファイルです', 'error');
      }
    } catch (e) {
      showToast('ファイルの読み込みに失敗しました', 'error');
    }
  };
  reader.readAsText(file);
}

// トースト通知
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const messageEl = document.getElementById('toast-message');

  messageEl.textContent = message;
  toast.style.background = type === 'error' ? '#EF4444' : type === 'warning' ? '#F59E0B' : '#10B981';

  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}
