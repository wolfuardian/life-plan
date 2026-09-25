// 勾選保存與同步：本機 localStorage + Google 試算表（SYNC_URL）
const SYNC_URL = 'https://script.google.com/macros/s/AKfycbz5veLASgbL_BTn7BaUJE-149fNsdjp2jk17RQCYHSCfivQMyxRFvioBF08cW-Yx0BB/exec'; // 填入 Apps Script 網頁應用程式網址
(function(){
  const page = location.pathname.split('/').pop().replace('.html','') || 'index';
  const LKEY = 'lp-check-' + page;
  const boxes = [...document.querySelectorAll('ul.check input[type=checkbox]')];
  const idOf = b => {
    const lab = b.closest('label').cloneNode(true);
    lab.querySelectorAll('.step,.detail,.tag,.who,input').forEach(x => x.remove());
    return lab.textContent.replace(/\s+/g,' ').trim().slice(0,80);
  };
  boxes.forEach(b => b.dataset.id = idOf(b));
  let local = {};
  try { local = JSON.parse(localStorage.getItem(LKEY) || '{}'); } catch(e) {}
  const status = document.createElement('div');
  status.style.cssText = 'font-size:.8rem;color:#6b6b6b;margin:6px 0 0';
  const hdr = document.querySelector('header'); if (hdr) hdr.appendChild(status);
  const setStatus = t => status.textContent = t;
  function apply(state){ boxes.forEach(b => { if (b.dataset.id in state) b.checked = !!state[b.dataset.id]; }); upd(); }
  function upd(){
    document.querySelectorAll('.progress').forEach(p => {
      const g = document.querySelector('ul[data-group="' + p.dataset.for + '"]'); if (!g) return;
      const all = g.querySelectorAll('input'); const done = [...all].filter(x => x.checked).length;
      p.textContent = '已完成 ' + done + ' / ' + all.length;
    });
  }
  apply(local);
  async function pull(){
    if (!SYNC_URL) { setStatus('勾選只保存在這台裝置'); return; }
    try {
      const r = await fetch(SYNC_URL + '?page=' + encodeURIComponent(page), {cache:'no-store'});
      const remote = await r.json();
      local = Object.assign({}, local, remote);
      localStorage.setItem(LKEY, JSON.stringify(local));
      apply(local);
      setStatus('已和另一半同步 ' + new Date().toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'}));
    } catch(e) { setStatus('暫時無法同步，勾選先存在這台裝置'); }
  }
  boxes.forEach(b => b.addEventListener('change', async () => {
    local[b.dataset.id] = b.checked; localStorage.setItem(LKEY, JSON.stringify(local)); upd();
    if (!SYNC_URL) return;
    setStatus('同步中…');
    try {
      await fetch(SYNC_URL, {method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body: JSON.stringify({page, id:b.dataset.id, v:b.checked})});
      setStatus('已同步');
    } catch(e) { setStatus('同步失敗，稍後重新整理再試'); }
  }));
  pull();
  setInterval(() => { if (document.visibilityState === 'visible') pull(); }, 30000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') pull(); });
})();
