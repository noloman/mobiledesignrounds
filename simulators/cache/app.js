(function () {
  var M = window.CacheModel;
  var root = document.getElementById('cx-app');
  if (!M || !root) return;
  var LESSON = {
    avatar: 'FIFO removes the avatar because it was saved first, even though it is the most used item. LRU keeps it, because every use moves it to the front. Try FIFO, then LRU.',
    big: 'One large item can push out many small ones. LRU counts the big image as the newest item, so it keeps it and drops the thumbnails. Largest first loses fewer thumbnails here, but it still drops three when the big image arrives, and it would remove the big image first next time. Raise the size to 1000 KB and see when the problem goes away.',
    price: 'With no expiry the screen shows the old price. A short expiry shows the right price but uses the network more. Try 10, 30 and 60 seconds and compare the stale count with the KB fetched.',
    timetable: 'Some data must stay even when it is used rarely. LRU drops the timetable because the tiles were used after it. A priority rule keeps it, so the last request works with no network.'
  };
  var $ = function (id) { return document.getElementById(id); };
  var sel = { s: 0 }, cfg = {};
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function sc() { return M.SCENARIOS[sel.s]; }
  function setScenario(i) {
    sel.s = i;
    var s = sc();
    cfg = { policy: s.policy, capacity: s.capacity, ttl: s.ttl };
    $('cx-policy').value = cfg.policy; $('cx-cap').value = String(cfg.capacity); $('cx-ttl').value = String(cfg.ttl);
    [].forEach.call(document.querySelectorAll('#cx-pre button'), function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
    $('cx-story').textContent = s.story;
    render();
  }
  function stat(dt, dd, cls) { var d = el('div', cls); d.appendChild(el('dt', '', dt)); d.appendChild(el('dd', '', dd)); return d; }
  function bar(contents, cap) {
    var b = el('div', 'bar'), used = 0;
    b.setAttribute('role', 'img');
    contents.forEach(function (c) {
      used += c.size;
      var s = el('span', 'seg', c.label); s.style.width = (c.size / cap * 100) + '%'; s.title = c.label + ', ' + c.size + ' KB'; b.appendChild(s);
    });
    b.setAttribute('aria-label', 'Cache holds ' + (contents.length ? contents.map(function (c) { return c.label; }).join(', ') : 'nothing') + '. ' + used + ' of ' + cap + ' KB used.');
    return { node: b, used: used };
  }
  function render() {
    var s = sc(), r = M.run(s, cfg), pol = M.POLICIES.filter(function (p) { return p.id === cfg.policy; })[0];
    var res = $('cx-res'); res.textContent = '';
    res.appendChild(stat('Hits', r.hits + ' of ' + r.requests, ''));
    res.appendChild(stat('Fetched', r.net + ' KB', ''));
    res.appendChild(stat('Removed to make room', String(r.evictions), ''));
    res.appendChild(stat('Old values shown', String(r.stale), r.stale ? 'bad' : 'good'));
    if (s.seq.some(function (k) { return s.items[k].critical; })) res.appendChild(stat('Must-have misses', String(r.critical), r.critical ? 'bad' : 'good'));
    var say = pol.short + ', cache of ' + cfg.capacity + ' KB, ' + (cfg.ttl ? 'expiry ' + cfg.ttl + ' s' : 'no expiry') + ': ' + r.hits + (r.hits === 1 ? ' hit' : ' hits') + ' out of ' + r.requests + ' requests, ' + r.net + ' KB fetched, ' + r.evictions + ' removed to make room, ' + r.stale + (r.stale === 1 ? ' old value' : ' old values') + ' shown.';
    $('cx-say').textContent = say;
    var tl = $('cx-tl'); tl.textContent = '';
    r.steps.forEach(function (st, i) {
      var kind = st.kind === 'hit' ? (st.stale ? 'old' : 'ok') : (st.kind === 'expired' ? 'exp' : 'bad');
      var li = el('li', kind);
      var h = el('p', 'h'); h.appendChild(el('b', '', 'Request ' + (i + 1) + ': ' + st.label));
      h.appendChild(el('span', 'tm', ' at ' + st.t + ' s'));
      var tag = st.kind === 'hit' ? (st.stale ? 'Hit, but old' : 'Hit') : (st.kind === 'expired' ? 'Expired' : 'Miss');
      h.appendChild(el('span', 'pill', tag));
      li.appendChild(h);
      li.appendChild(el('p', 'n', st.note + (st.evicted.length ? ' Removed to make room: ' + st.evicted.join(', ') + '.' : '')));
      var b = bar(st.contents, cfg.capacity);
      li.appendChild(b.node);
      li.appendChild(el('p', 'u', 'Cache: ' + b.used + ' of ' + cfg.capacity + ' KB' + (st.contents.length ? ' (' + st.contents.map(function (c) { return c.label; }).join(', ') + ')' : '')));
      tl.appendChild(li);
    });
    var body = $('cx-cmp'); body.textContent = '';
    var rows = M.POLICIES.map(function (p) { return { p: p, r: M.run(s, { policy: p.id, capacity: cfg.capacity, ttl: cfg.ttl }) }; });
    var best = Math.min.apply(null, rows.map(function (x) { return x.r.net; }));
    rows.forEach(function (x) {
      var tr = el('tr', x.p.id === cfg.policy ? 'cur' : '');
      var th = el('th', '', x.p.name); th.scope = 'row'; tr.appendChild(th);
      tr.appendChild(el('td', '', String(x.r.hits)));
      tr.appendChild(el('td', '', x.r.net + ' KB' + (x.r.net === best ? ' (lowest)' : '')));
      tr.appendChild(el('td', '', String(x.r.evictions)));
      body.appendChild(tr);
    });
    $('cx-why').textContent = LESSON[s.id];
  }
  function fill(id, opts) {
    var s = $(id);
    opts.forEach(function (o) { var e = el('option', '', o[1]); e.value = String(o[0]); s.appendChild(e); });
  }
  fill('cx-policy', M.POLICIES.map(function (p) { return [p.id, p.name]; }));
  fill('cx-cap', [100, 150, 200, 250, 300, 400, 500, 600, 800, 1000].map(function (n) { return [n, n + ' KB']; }));
  fill('cx-ttl', [[0, 'No expiry'], [10, '10 seconds'], [30, '30 seconds'], [60, '60 seconds']]);
  $('cx-policy').addEventListener('change', function (e) { cfg.policy = e.target.value; render(); });
  $('cx-cap').addEventListener('change', function (e) { cfg.capacity = +e.target.value; render(); });
  $('cx-ttl').addEventListener('change', function (e) { cfg.ttl = +e.target.value; render(); });
  var pre = $('cx-pre');
  M.SCENARIOS.forEach(function (s, i) {
    var b = el('button', '', s.name); b.type = 'button'; b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', function () { setScenario(i); });
    pre.appendChild(b);
  });
  root.hidden = false;
  setScenario(0);
})();
