/**
 * 販売管理システム - メインアプリケーション
 */

// グローバル変数
let orders = [];
let filteredOrders = [];
let currentPage = 1;
const itemsPerPage = 10;
let editingOrderId = null;
let selectedFilePath = null;
let csvData = null;

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
  // 日付表示
  updateHeaderDate();

  // 注文データ読み込み
  await loadOrders();

  // イベントリスナー設定
  setupEventListeners();

  // 初期商品行追加
  addItemRow();

  // 今日の日付をデフォルト設定
  document.getElementById('input-order-date').value = new Date().toISOString().split('T')[0];

  // アプリ情報取得
  try {
    const info = await window.electronAPI.getAppInfo();
    document.getElementById('app-version').textContent = `Version ${info.version || '1.0.0'}`;
  } catch (e) {
    console.log('Running in browser mode');
  }

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

// 注文データ読み込み
async function loadOrders() {
  try {
    const result = await window.electronAPI.loadOrders();
    if (result.success) {
      orders = result.data || [];
      filteredOrders = [...orders];
      renderOrders();
      updateStatistics();
    }
  } catch (e) {
    // ブラウザモードの場合はローカルストレージから
    const saved = localStorage.getItem('orders');
    orders = saved ? JSON.parse(saved) : [];
    filteredOrders = [...orders];
    renderOrders();
    updateStatistics();
  }
}

// 注文データ保存
async function saveOrdersToStorage() {
  try {
    await window.electronAPI.saveOrders(orders);
  } catch (e) {
    localStorage.setItem('orders', JSON.stringify(orders));
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
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #999; padding: 40px;">データがありません</td></tr>';
    document.getElementById('result-count').textContent = 0;
    renderPagination();
    return;
  }

  pageOrders.forEach((order, index) => {
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
      <td class="order-id" data-rpa-field="order-id-${index}">${order.orderId || '-'}</td>
      <td>${order.orderDate || '-'}</td>
      <td>${order.ecSite || '-'}</td>
      <td>${order.customerName || '-'}</td>
      <td>${itemsText}</td>
      <td>¥${(order.total || 0).toLocaleString()}</td>
      <td><span class="badge ${badgeClass}">${order.status || '新規受付'}</span></td>
      <td>
        <button class="btn btn-small btn-outline" onclick="showOrderDetail('${order.orderId}')" data-rpa-field="detail-btn-${index}">
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
async function deleteOrder() {
  if (!confirm('この注文を削除しますか？')) return;

  orders = orders.filter(o => o.orderId !== editingOrderId);
  await saveOrdersToStorage();
  filteredOrders = [...orders];
  renderOrders();
  closeModal('modal-order-detail');
  editingOrderId = null;
}

// 全件削除
async function deleteAllOrders() {
  if (!confirm('すべての注文データを削除しますか？この操作は取り消せません。')) return;

  orders = [];
  await saveOrdersToStorage();
  filteredOrders = [];
  renderOrders();
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
  const rows = document.querySelectorAll('.item-row');
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

  await saveOrdersToStorage();
  filteredOrders = [...orders];

  form.setAttribute('data-status', 'success');

  setTimeout(() => {
    form.setAttribute('data-status', 'ready');
    clearForm();
    showScreen('list');
    renderOrders();
  }, 500);
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

// ファイル選択
async function selectFile() {
  try {
    const result = await window.electronAPI.openFileDialog();
    if (!result.canceled && result.filePaths.length > 0) {
      selectedFilePath = result.filePaths[0];
      document.getElementById('input-file-path').value = selectedFilePath;
      document.getElementById('btn-import').disabled = false;

      // CSVを読み込んでプレビュー
      const fileResult = await window.electronAPI.readCSVFile(selectedFilePath);
      if (fileResult.success) {
        csvData = parseCSV(fileResult.content);
        showPreview();
      }
    }
  } catch (e) {
    // ブラウザモードの場合
    alert('ファイル選択はElectronアプリでのみ使用できます。');
  }
}

// CSV解析
function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
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
async function importCSV() {
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

  await saveOrdersToStorage();
  filteredOrders = [...orders];
  renderOrders();

  // 結果表示
  const resultCard = document.getElementById('import-result-card');
  const resultDiv = document.getElementById('import-result');

  resultDiv.innerHTML = `
    <h4>インポート完了</h4>
    <ul>
      <li class="success">成功: ${importedCount}件</li>
      <li class="error">エラー: ${errorCount}件</li>
    </ul>
    ${errors.length > 0 ? `<div class="mt-10"><strong>エラー詳細:</strong><ul>${errors.slice(0, 5).map(e => `<li>${e}</li>`).join('')}</ul></div>` : ''}
  `;

  resultCard.style.display = 'block';
  card.setAttribute('data-status', 'success');

  setTimeout(() => {
    card.setAttribute('data-status', 'ready');
  }, 2000);
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
