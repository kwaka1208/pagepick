// ========================================
// PagePick - Main Logic
// ========================================

// Clean tracking parameters from URL
function cleanURL(urlStr) {
  try {
    const url = new URL(urlStr);
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
  
    cleanParams(url.searchParams);
    
    if (url.hash && url.hash.includes('?')) {
      const [h, q] = url.hash.split('?');
      const sp = new URLSearchParams(q);
      cleanParams(sp);
      const newQuery = sp.toString();
      url.hash = newQuery ? `${h}?${newQuery}` : h;
    }
    
    return url.toString();
  } catch (e) {
    return urlStr;
  }
}

// Copy helper
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
  if (!msgEl) return;
  msgEl.textContent = text;
  msgEl.className = `message ${type}`;
  setTimeout(() => { msgEl.className = 'message'; }, 3000);
}

// ========================================
// Main Features
// ========================================

// Google Docs Converter
async function googleDocsConverter(tab) {
  if (!tab || !tab.url) return;

  const urlStr = tab.url;
  const baseUrlMatch = urlStr.match(/^(.*?\/d\/[a-zA-Z0-9-_]+)/);
  if (!baseUrlMatch) return;
  const baseUrl = baseUrlMatch[1];

  document.getElementById('main-menu').style.display = 'none';
  const gdMenu = document.getElementById('gd-menu');
  gdMenu.style.display = 'flex';

  const isSheet = urlStr.includes('/spreadsheets/');
  gdMenu.querySelector('[data-action="gd-excel"]').style.display = isSheet ? 'block' : 'none';
  gdMenu.querySelector('[data-action="gd-csv"]').style.display = isSheet ? 'block' : 'none';

  document.getElementById('gd-back-btn').onclick = () => {
    gdMenu.style.display = 'none';
    document.getElementById('main-menu').style.display = 'flex';
  };

  gdMenu.querySelectorAll('.menu-item').forEach(btn => {
    btn.onclick = async () => {
      const action = btn.dataset.action;
      let suffix = '';
      let label = btn.textContent;

      switch (action) {
        case 'gd-copy': suffix = '/copy'; break;
        case 'gd-pdf':  suffix = '/export?format=pdf'; break;
        case 'gd-excel': suffix = '/export?format=xlsx'; break;
        case 'gd-csv':   suffix = '/export?format=csv'; break;
      }

      let finalUrl = baseUrl + suffix;

      if (isSheet && suffix === '/copy') {
        try {
          const urlObj = new URL(urlStr);
          const gid = urlObj.searchParams.get('gid') || urlObj.hash.match(/gid=(\d+)/)?.[1];
          if (gid) {
            finalUrl += (finalUrl.includes('?') ? '&' : '?') + `gid=${gid}`;
          }
        } catch (e) {
          console.error('GID解析エラー', e);
        }
      }

      await copyToClipboard(finalUrl);
      showMessage(`✅ ${label.split('.')[1] || label} をコピーしました`);
      setTimeout(() => window.close(), 1500);
    };
  });
}

// OGP画像のURLを取得してコピー
async function copyOGPUrl(tab) {
  try {
    showMessage('⏳ OGP取得中...', 'success');
    const response = await fetch(tab.url);
    const htmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    const ogImage = doc.querySelector('meta[property="og:image"]');
    
    if (ogImage && ogImage.content) {
      await copyToClipboard(ogImage.content);
      showMessage('✅ OGP画像URLをコピーしました', 'success');
      setTimeout(() => window.close(), 1500);
    } else {
      showMessage('⚠️ OGP画像が見つかりません', 'error');
    }
  } catch (err) {
    console.error(err);
    showMessage('❌ 取得に失敗しました', 'error');
  }
}

// 汎用コピー処理
async function handleUrlCopy(tab, format) {
  try {
    const clean = cleanURL(tab.url);
    const title = tab.title;
    let text = '';
    let msg = '';

    switch (format) {
      case 'tsv':
        text = `${title}\t${clean}`;
        msg = 'TSV形式';
        break;
      case 'text':
        text = `${title}\n${clean}`;
        msg = '改行区切り形式';
        break;
      case 'markdown':
        text = `[${title}](${clean})`;
        msg = 'Markdown形式';
        break;
    }

    const success = await copyToClipboard(text);
    if (success) {
      showMessage(`✅ ${msg}でコピーしました`, 'success');
    } else {
      showMessage('❌ コピーに失敗しました', 'error');
    }
  } catch (e) {
    console.error(e);
    showMessage('❌ エラーが発生しました', 'error');
  }
}

// ========================================
// Initialization
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const isGoogleFile = tab.url && tab.url.includes('google.com') && tab.url.includes('/d/');
  const gdBtn = document.querySelector('[data-action="google-docs"]');
  if (gdBtn) {
    gdBtn.style.display = isGoogleFile ? 'flex' : 'none';
  }

  document.querySelectorAll('#main-menu .menu-item').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const action = e.currentTarget.dataset.action;
      switch (action) {
        case 'google-docs': await googleDocsConverter(tab); break;
        case 'ogp-image':   await copyOGPUrl(tab); break;
        case 'url-tsv':     await handleUrlCopy(tab, 'tsv'); break;
        case 'url-text':    await handleUrlCopy(tab, 'text'); break;
        case 'url-markdown': await handleUrlCopy(tab, 'markdown'); break;
      }
    });
  });
});
