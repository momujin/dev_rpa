/**
 * 販売管理システム - Preloadスクリプト
 * セキュアなIPC通信のためのブリッジ
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // ファイル操作
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  readCSVFile: (filePath) => ipcRenderer.invoke('file:readCSV', filePath),

  // データ操作
  saveOrders: (data) => ipcRenderer.invoke('data:save', data),
  loadOrders: () => ipcRenderer.invoke('data:load'),

  // アプリ情報
  getAppInfo: () => ipcRenderer.invoke('app:getInfo')
});
