// ========================================
// Content Script for URL Tools Extension
// Google Docs変換用UI表示
// ========================================

function setStyle(el, css) {
  el.style.cssText = css;
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    return false;
  }
}

// Google Docs変換UI
function showGoogleDocsMenu() {
  const url = window.location.href;
  const hostname = window.location.hostname;
  const isGoogleFile = hostname.endsWith('google.com') && url.includes('/d/');
  const isSheet = url.includes('/spreadsheets/d/');

  if (!isGoogleFile || !url.includes('/edit')) {
    return false;
  }

  // Check if menu already exists
  const existing = document.getElementById('url-tools-google-docs-menu');
  if (existing) {
    existing.remove();
    return true;
  }

  const div = document.createElement('div');
  div.id = 'url-tools-google-docs-menu';
  setStyle(div, 'position:fixed; top:20px; right:20px; z-index:999999; background:#222; color:#fff; padding:12px; border-radius:8px; box-shadow:0 4px 15px rgba(0,0,0,0.5); font-family:sans-serif; width:220px; text-align:left;');

  const header = document.createElement('div');
  setStyle(header, 'display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid #555; padding-bottom:5px; font-weight:bold;');
  
  const title = document.createElement('span');
  title.textContent = '共有URLをコピー';
  
  const closeBtn = document.createElement('span');
  closeBtn.textContent = '×';
  setStyle(closeBtn, 'cursor:pointer; padding:0 5px; font-size:18px;');
  closeBtn.onclick = function() { div.remove(); };
  
  header.appendChild(title);
  header.appendChild(closeBtn);
  div.appendChild(header);

  function createBtn(label, suffix) {
    const btn = document.createElement('button');
    btn.textContent = label;
    setStyle(btn, 'display:block; width:100%; padding:10px; margin:5px 0; background:#444; color:#fff; border:1px solid #666; border-radius:4px; cursor:pointer; text-align:left; font-size:13px;');
    
    btn.onmouseover = function() { this.style.background = '#666'; };
    btn.onmouseout = function() { this.style.background = '#444'; };
    
    btn.onclick = async function() {
      const newUrl = url.replace(/\/edit.*$/, suffix);
      const success = await copyToClipboard(newUrl);
      if (success) {
        btn.textContent = '✅ コピー完了！';
        btn.style.background = '#28a745';
        setTimeout(function() { div.remove(); }, 1200);
      } else {
        alert('コピーに失敗しました');
      }
    };
    
    div.appendChild(btn);
  }

  createBtn('1. 強制コピーモード', '/copy');
  createBtn('2. PDFでダウンロード', '/export?format=pdf');
  if (isSheet) {
    createBtn('3. Excelでダウンロード', '/export?format=xlsx');
  }

  document.body.appendChild(div);
  return true;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'show-google-docs-menu') {
    const success = showGoogleDocsMenu();
    sendResponse({ success });
  }
});
