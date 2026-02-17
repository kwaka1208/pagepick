// ========================================
// URL Tools Chrome Extension
// ========================================

// Clean tracking parameters from URL
function cleanURL(url) {
  const blacklist = new Set([
    'fbclid', 'gclid', 'gclsrc', 'dclid', 'msclkid', 'mibextid',
    'mc_cid', 'mc_eid', 'mkt_tok', 'yclid', '_hsenc', '_hsmi',
    'igshid', 'si', 'ref', 'ref_src', 'ref_url', 'sr_share', 'share',
    'share_id', 'utm_id', 'ved'
  ]);
  
  const normalize = s => s.toLowerCase();
  const cleanParams = sp => {
    for (const k of Array.from(sp.keys())) {
      const k2 = normalize(k);
      if (k2.startsWith('utm_') || blacklist.has(k2) || k2 === 'wt.mc_id' || k2 === 'wt.mc_ev') {
        sp.delete(k);
      }
    }
  };

  const p = url.searchParams;
  cleanParams(p);
  
  if (url.hash && url.hash.includes('?')) {
    const hq = url.hash.split('?');
    const h = hq[0], q = hq[1];
    const sp = new URLSearchParams(q);
    cleanParams(sp);
    url.hash = sp.toString() ? h + '?' + sp : h;
  }
  
  return url.toString();
}

// Copy to clipboard
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    console.error('Clipboard write failed:', e);
    return false;
  }
}

// Show message
function showMessage(text, type = 'success') {
  const msgEl = document.getElementById('message');
  msgEl.textContent = text;
  msgEl.className = `message ${type}`;
  
  setTimeout(() => {
    msgEl.className = 'message';
  }, 3000);
}

// ========================================
// Tool Functions
// ========================================

async function googleDocsConverter(tab) {
  // Validate tab URL first, then inject menu directly into the page
  try {
    const url = (tab && tab.url) ? tab.url : '';
    let isGoogleFile = false;
    try {
      const h = new URL(url).hostname;
      isGoogleFile = h.endsWith('google.com') && url.includes('/d/');
    } catch (e) {
      isGoogleFile = false;
    }

    if (!isGoogleFile || !url.includes('/edit')) {
      showMessage('⚠️ Google Docs/Sheets/Slidesの編集画面で実行してください', 'error');
      setTimeout(() => window.close(), 2000);
      return;
    }

    // Inject script to show the same menu as bookmarklet directly in the page
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: function() {
          function setStyle(el, css) { el.style.cssText = css; }
          async function copyToClipboard(text) { try { await navigator.clipboard.writeText(text); return true; } catch (e) { return false; } }

          const url = window.location.href;
          const hostname = window.location.hostname;
          const isGoogleFile = hostname.endsWith('google.com') && url.includes('/d/');
          if (!isGoogleFile || !url.includes('/edit')) return false;

          const existing = document.getElementById('url-tools-google-docs-menu');
          if (existing) { existing.remove(); return true; }

          const div = document.createElement('div');
          div.id = 'url-tools-google-docs-menu';
          setStyle(div, 'position:fixed; top:20px; right:20px; z-index:999999; background:#222; color:#fff; padding:12px; border-radius:8px; box-shadow:0 4px 15px rgba(0,0,0,0.5); font-family:sans-serif; width:220px; text-align:left;');

          const header = document.createElement('div');
          setStyle(header, 'display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid #555; padding-bottom:5px; font-weight:bold;');
          const title = document.createElement('span'); title.textContent = '共有URLをコピー';
          const closeBtn = document.createElement('span'); closeBtn.textContent = '×'; setStyle(closeBtn, 'cursor:pointer; padding:0 5px; font-size:18px;'); closeBtn.onclick = function() { div.remove(); };
          header.appendChild(title); header.appendChild(closeBtn); div.appendChild(header);

          function createBtn(label, suffix) {
            const btn = document.createElement('button');
            btn.textContent = label;
            setStyle(btn, 'display:block; width:100%; padding:10px; margin:5px 0; background:#444; color:#fff; border:1px solid #666; border-radius:4px; cursor:pointer; text-align:left; font-size:13px;');
            btn.onmouseover = function() { this.style.background = '#666'; };
            btn.onmouseout = function() { this.style.background = '#444'; };
            btn.onclick = async function() {
              const newUrl = url.replace(/\/edit.*$/, suffix);
              const ok = await copyToClipboard(newUrl);
              if (ok) {
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
          if (url.includes('/spreadsheets/d/')) createBtn('3. Excelでダウンロード', '/export?format=xlsx');

          document.body.appendChild(div);
          return true;
        }
      });

      if (results && results[0] && results[0].result) {
        setTimeout(() => window.close(), 500);
      } else {
        showMessage('⚠️ Google Docs/Sheets/Slidesの編集画面で実行してください', 'error');
        setTimeout(() => window.close(), 2000);
      }
    } catch (err) {
      showMessage('表示に失敗しました', 'error');
      setTimeout(() => window.close(), 2000);
    }
  } catch (err) {
    showMessage('エラーが発生しました', 'error');
    setTimeout(() => window.close(), 2000);
  }
}

async function openOGPPicture(tab) {
  // Execute script in content to get og:image
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        const ogImage = document.querySelector('meta[property="og:image"]');
        return ogImage ? ogImage.content : null;
      }
    });
    
    if (results && results[0] && results[0].result) {
      chrome.tabs.create({ url: results[0].result });
      showMessage('✅ OGP画像を新しいタブで開きました', 'success');
    } else {
      showMessage('OGP画像がありません', 'error');
    }
  } catch (err) {
    showMessage('OGP画像の取得に失敗しました', 'error');
  }
}

async function urlAndTitleTSV(tab) {
  try {
    const u = new URL(tab.url);
    const text = tab.title + '\t' + cleanURL(u);
    const success = await copyToClipboard(text);
    
    if (success) {
      showMessage('✅ TSV形式でコピーしました', 'success');
    } else {
      showMessage('コピーに失敗しました', 'error');
    }
  } catch (e) {
    const text = tab.title + '\t' + tab.url;
    const success = await copyToClipboard(text);
    
    if (success) {
      showMessage('✅ TSV形式でコピーしました', 'success');
    } else {
      showMessage('コピーに失敗しました', 'error');
    }
  }
}

async function urlAndTitlePlain(tab) {
  try {
    const u = new URL(tab.url);
    const text = tab.title + '\n' + cleanURL(u);
    const success = await copyToClipboard(text);
    
    if (success) {
      showMessage('✅ テキスト形式でコピーしました', 'success');
    } else {
      showMessage('コピーに失敗しました', 'error');
    }
  } catch (e) {
    const text = tab.title + '\n' + tab.url;
    const success = await copyToClipboard(text);
    
    if (success) {
      showMessage('✅ テキスト形式でコピーしました', 'success');
    } else {
      showMessage('コピーに失敗しました', 'error');
    }
  }
}

async function urlAndTitleMarkdown(tab) {
  try {
    const u = new URL(tab.url);
    const text = '[' + tab.title + '](' + cleanURL(u) + ')';
    const success = await copyToClipboard(text);
    
    if (success) {
      showMessage('✅ Markdown形式でコピーしました', 'success');
    } else {
      showMessage('コピーに失敗しました', 'error');
    }
  } catch (e) {
    const text = '[' + tab.title + '](' + tab.url + ')';
    const success = await copyToClipboard(text);
    
    if (success) {
      showMessage('✅ Markdown形式でコピーしました', 'success');
    } else {
      showMessage('コピーに失敗しました', 'error');
    }
  }
}

// ========================================
// Event Listeners
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Hide Google Docs button when current tab is not a Google file URL
  try {
    const isGoogleFile = (tab && tab.url) ? (new URL(tab.url).hostname.endsWith('google.com') && tab.url.includes('/d/')) : false;
    const gdBtn = document.querySelector('[data-action="google-docs"]');
    if (gdBtn && !isGoogleFile) {
      gdBtn.style.display = 'none';
    }
  } catch (e) {
    // ignore
  }

  // Setup button handlers
  document.querySelectorAll('.menu-item').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const action = e.currentTarget.dataset.action;
      
      try {
        switch (action) {
          case 'google-docs':
            await googleDocsConverter(tab);
            break;
          case 'ogp-image':
            await openOGPPicture(tab);
            break;
          case 'url-tsv':
            await urlAndTitleTSV(tab);
            break;
          case 'url-text':
            await urlAndTitlePlain(tab);
            break;
          case 'url-markdown':
            await urlAndTitleMarkdown(tab);
            break;
        }
      } catch (err) {
        console.error('Tool error:', err);
        showMessage('エラーが発生しました: ' + err.message, 'error');
      }
    });
  });
});
