// ============================================================
// Keita Task Management — Google Apps Script Backend
// ============================================================

const SPREADSHEET_ID = '1YdOiIw9SHM3xIxHMPY4QwTKk9PyYz88FJLifo_HxxuI';
const TASK_SHEET = 'Task list';
const CATEGORY_SHEET = 'Category master';
const STATUS_SHEET = 'Status master';
const NOTIFICATION_EMAIL = 'keita.ishida@coconala.com';

// APIトークン（初回セットアップ時に setApiToken() を実行）
function getApiToken() {
  return PropertiesService.getScriptProperties().getProperty('API_TOKEN');
}

// 初回セットアップ: Apps Script エディタで実行してトークンを設定
function setApiToken() {
  const token = Utilities.getUuid();
  PropertiesService.getScriptProperties().setProperty('API_TOKEN', token);
  Logger.log('APIトークン: ' + token);
  Logger.log('このトークンをアプリのログイン画面に入力してください');
}

// 通知トリガーセットアップ: 毎朝7:00に実行
function setupNotificationTrigger() {
  // 既存トリガーを削除
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'sendDailyNotification') {
      ScriptApp.deleteTrigger(t);
    }
  });
  // 新規トリガー作成
  ScriptApp.newTrigger('sendDailyNotification')
    .timeBased()
    .everyDays(1)
    .atHour(7)
    .create();
  Logger.log('通知トリガーを設定しました（毎朝7:00）');
}

// ============================================================
// Web API エントリポイント
// ============================================================

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    const params = e.parameter || {};
    let body = {};
    if (e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }

    // 認証チェック
    const token = params.token || body.token;
    if (token !== getApiToken()) {
      return jsonResponse({ success: false, error: '認証エラー' });
    }

    const action = params.action || body.action;

    switch (action) {
      case 'getTasks':
        return jsonResponse({ success: true, data: getTasks() });
      case 'getCategories':
        return jsonResponse({ success: true, data: getCategories() });
      case 'getStatuses':
        return jsonResponse({ success: true, data: getStatuses() });
      case 'addTask':
        return jsonResponse({ success: true, data: addTask(body) });
      case 'updateTask':
        return jsonResponse({ success: true, data: updateTask(body) });
      case 'deleteTask':
        return jsonResponse({ success: true, data: deleteTask(body) });
      case 'addCategory':
        return jsonResponse({ success: true, data: addCategory(body) });
      case 'deleteCategory':
        return jsonResponse({ success: true, data: deleteCategory(body) });
      default:
        return jsonResponse({ success: false, error: '不明なアクション: ' + action });
    }
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// タスク CRUD
// ============================================================

function getTasks() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TASK_SHEET);
  const data = sheet.getDataRange().getValues();
  const headers = data[0]; // 大カテゴリ, 小カテゴリ, タスク, 期日, ステータス
  const tasks = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[2]) continue; // タスク名が空なら飛ばす
    tasks.push({
      rowIndex: i + 1, // 1-indexed (スプレッドシートの行番号)
      majorCategory: row[0],
      minorCategory: row[1],
      task: row[2],
      dueDate: formatDate(row[3]),
      status: row[4],
    });
  }
  return tasks;
}

function addTask(body) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TASK_SHEET);
  sheet.appendRow([
    body.majorCategory,
    body.minorCategory,
    body.task,
    body.dueDate,
    body.status || '未着手',
  ]);
  return getTasks();
}

function updateTask(body) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TASK_SHEET);
  const row = body.rowIndex;
  if (!row || row < 2) throw new Error('無効な行番号');

  sheet.getRange(row, 1).setValue(body.majorCategory);
  sheet.getRange(row, 2).setValue(body.minorCategory);
  sheet.getRange(row, 3).setValue(body.task);
  sheet.getRange(row, 4).setValue(body.dueDate);
  sheet.getRange(row, 5).setValue(body.status);
  return getTasks();
}

function deleteTask(body) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TASK_SHEET);
  const row = body.rowIndex;
  if (!row || row < 2) throw new Error('無効な行番号');
  sheet.deleteRow(row);
  return getTasks();
}

// ============================================================
// カテゴリ CRUD
// ============================================================

function getCategories() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(CATEGORY_SHEET);
  const data = sheet.getDataRange().getValues();
  const categories = [];

  for (let i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    categories.push({
      rowIndex: i + 1,
      majorCategory: data[i][0],
      minorCategory: data[i][1],
    });
  }
  return categories;
}

function addCategory(body) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(CATEGORY_SHEET);
  sheet.appendRow([body.majorCategory, body.minorCategory]);
  return getCategories();
}

function deleteCategory(body) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(CATEGORY_SHEET);
  const row = body.rowIndex;
  if (!row || row < 2) throw new Error('無効な行番号');
  sheet.deleteRow(row);
  return getCategories();
}

// ============================================================
// ステータス取得
// ============================================================

function getStatuses() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(STATUS_SHEET);
  const data = sheet.getDataRange().getValues();
  const statuses = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) statuses.push(data[i][0]);
  }
  return statuses;
}

// ============================================================
// 通知（毎朝7:00トリガー）
// ============================================================

function sendDailyNotification() {
  const tasks = getTasks();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const excludeStatuses = ['完了', 'キャンセル'];

  const dueTasks = tasks.filter(t => {
    if (excludeStatuses.includes(t.status)) return false;
    const d = parseTaskDate(t.dueDate);
    if (!d) return false;
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime() || d.getTime() === tomorrow.getTime();
  });

  if (dueTasks.length === 0) return;

  const todayTasks = dueTasks.filter(t => {
    const d = parseTaskDate(t.dueDate);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });

  const tomorrowTasks = dueTasks.filter(t => {
    const d = parseTaskDate(t.dueDate);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === tomorrow.getTime();
  });

  let body = '📋 タスクリマインド\n\n';

  if (todayTasks.length > 0) {
    body += '🔴 本日期日のタスク:\n';
    todayTasks.forEach(t => {
      body += `  • [${t.status}] ${t.minorCategory} / ${t.task}\n`;
    });
    body += '\n';
  }

  if (tomorrowTasks.length > 0) {
    body += '🟡 明日期日のタスク:\n';
    tomorrowTasks.forEach(t => {
      body += `  • [${t.status}] ${t.minorCategory} / ${t.task}\n`;
    });
  }

  MailApp.sendEmail({
    to: NOTIFICATION_EMAIL,
    subject: `【タスク通知】本日${todayTasks.length}件・明日${tomorrowTasks.length}件`,
    body: body,
  });
}

// ============================================================
// ユーティリティ
// ============================================================

function formatDate(value) {
  if (!value) return '';
  if (value instanceof Date) {
    const m = value.getMonth() + 1;
    const d = value.getDate();
    return m + '/' + d;
  }
  return String(value);
}

function parseTaskDate(dateStr) {
  if (!dateStr) return null;
  const str = String(dateStr);

  // "M/D" 形式 → 今年の日付として解釈
  const match = str.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (match) {
    const year = new Date().getFullYear();
    return new Date(year, parseInt(match[1]) - 1, parseInt(match[2]));
  }

  // "YYYY/M/D" or "YYYY-MM-DD" 形式
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}
