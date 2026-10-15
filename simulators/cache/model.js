/* Cache model shared by the page and by the no-JavaScript table checks.
   Units: KB for size, seconds for time. The same input always gives the same result. */
(function (root) {
  var SCENARIOS = [
    {
      id: 'avatar',
      name: 'Same avatar on every row',
      story: 'A feed shows one avatar next to every post, so the avatar is used again and again. Each post photo is used once.',
      capacity: 250, ttl: 0, policy: 'fifo',
      items: {
        avatar: { size: 50, priority: 1, label: 'avatar' },
        p1: { size: 100, priority: 1, label: 'photo 1' }, p2: { size: 100, priority: 1, label: 'photo 2' },
        p3: { size: 100, priority: 1, label: 'photo 3' }, p4: { size: 100, priority: 1, label: 'photo 4' },
        p5: { size: 100, priority: 1, label: 'photo 5' }, p6: { size: 100, priority: 1, label: 'photo 6' }
      },
      seq: ['avatar', 'p1', 'avatar', 'p2', 'avatar', 'p3', 'avatar', 'p4', 'avatar', 'p5', 'avatar', 'p6', 'avatar'],
      gap: 5
    },
    {
      id: 'big',
      name: 'One big file arrives',
      story: 'A list of small thumbnails is cached. Then the user opens one large image, and goes back to the list.',
      capacity: 500, ttl: 0, policy: 'lru',
      items: {
        s1: { size: 50, priority: 1, label: 'thumb 1' }, s2: { size: 50, priority: 1, label: 'thumb 2' },
        s3: { size: 50, priority: 1, label: 'thumb 3' }, s4: { size: 50, priority: 1, label: 'thumb 4' },
        s5: { size: 50, priority: 1, label: 'thumb 5' }, s6: { size: 50, priority: 1, label: 'thumb 6' },
        big: { size: 350, priority: 1, label: 'big image' }
      },
      seq: ['s1', 's2', 's3', 's4', 's5', 's6', 'big', 's1', 's2', 's3', 's4', 's5', 's6'],
      gap: 5
    },
    {
      id: 'price',
      name: 'A price that changes',
      story: 'A screen shows one price. The server changes the price at 25 s and at 65 s. The screen asks for it every 20 s.',
      capacity: 100, ttl: 0, policy: 'lru',
      items: { price: { size: 5, priority: 1, label: 'price', changes: [25, 65] } },
      seq: ['price', 'price', 'price', 'price', 'price', 'price'],
      gap: 20
    },
    {
      id: 'timetable',
      name: 'Offline timetable',
      story: 'The timetable must work with no network. Map tiles come and go as the user pans. The timetable is needed again at the end, and then the phone has no network.',
      capacity: 500, ttl: 0, policy: 'lru',
      items: {
        timetable: { size: 200, priority: 3, label: 'timetable', critical: true },
        t1: { size: 100, priority: 1, label: 'tile 1' }, t2: { size: 100, priority: 1, label: 'tile 2' },
        t3: { size: 100, priority: 1, label: 'tile 3' }, t4: { size: 100, priority: 1, label: 'tile 4' },
        t5: { size: 100, priority: 1, label: 'tile 5' }, t6: { size: 100, priority: 1, label: 'tile 6' },
        t7: { size: 100, priority: 1, label: 'tile 7' }, t8: { size: 100, priority: 1, label: 'tile 8' }
      },
      seq: ['timetable', 't1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 'timetable'],
      gap: 5
    }
  ];
  var POLICIES = [
    { id: 'lru', name: 'Least recently used (LRU)', short: 'LRU' },
    { id: 'fifo', name: 'Oldest first (FIFO)', short: 'FIFO' },
    { id: 'largest', name: 'Largest first (size-based)', short: 'Largest' },
    { id: 'priority', name: 'Lowest priority first', short: 'Priority' }
  ];

  function version(item, t) {
    var v = 0, c = item.changes || [];
    for (var i = 0; i < c.length; i++) if (t >= c[i]) v = i + 1;
    return v;
  }

  // Pick the entry to remove. Ties go to the entry used longest ago.
  function victim(entries, policy) {
    var best = null;
    entries.forEach(function (e) {
      if (!best) { best = e; return; }
      var better = false;
      if (policy === 'lru') better = e.used < best.used;
      else if (policy === 'fifo') better = e.added < best.added;
      else if (policy === 'largest') better = e.size > best.size || (e.size === best.size && e.used < best.used);
      else if (policy === 'priority') better = e.priority < best.priority || (e.priority === best.priority && e.used < best.used);
      if (better) best = e;
    });
    return best;
  }

  function run(sc, cfg) {
    var cache = [], tick = 0, out = { steps: [], hits: 0, misses: 0, expired: 0, stale: 0, evictions: 0, net: 0, critical: 0, requests: sc.seq.length };
    sc.seq.forEach(function (key, i) {
      var t = i * sc.gap, it = sc.items[key], step = { key: key, label: it.label, t: t, kind: '', evicted: [], note: '' };
      tick++;
      var idx = -1;
      cache.forEach(function (e, j) { if (e.key === key) idx = j; });
      var fetch = true;
      if (idx >= 0) {
        var e = cache[idx];
        if (cfg.ttl > 0 && t - e.fetched >= cfg.ttl) {
          cache.splice(idx, 1); out.expired++; step.kind = 'expired'; step.note = 'Too old, so it is fetched again.';
        } else {
          e.used = tick; fetch = false; out.hits++;
          step.kind = 'hit'; step.note = 'Served from the cache.';
          if (e.version !== version(it, t)) { out.stale++; step.stale = true; step.note = 'Served from the cache, but the server has a newer value.'; }
        }
      } else { step.kind = 'miss'; step.note = 'Not in the cache, so it is fetched.'; }
      if (fetch) {
        if (step.kind === 'miss') out.misses++;
        if (it.critical && i > 0) { out.critical++; step.note += ' With no network, this would be an empty screen.'; }
        out.net += it.size;
        if (it.size > cfg.capacity) { step.note += ' It is bigger than the whole cache, so it is not saved.'; }
        else {
          var total = cache.reduce(function (s, e) { return s + e.size; }, 0);
          while (total + it.size > cfg.capacity) {
            var v = victim(cache, cfg.policy);
            cache.splice(cache.indexOf(v), 1); total -= v.size; out.evictions++; step.evicted.push(sc.items[v.key].label);
          }
          cache.push({ key: key, size: it.size, priority: it.priority, added: tick, used: tick, fetched: t, version: version(it, t) });
        }
      }
      step.contents = cache.map(function (e) { return { key: e.key, label: sc.items[e.key].label, size: e.size }; });
      out.steps.push(step);
    });
    out.contents = out.steps.length ? out.steps[out.steps.length - 1].contents : [];
    return out;
  }

  var api = { SCENARIOS: SCENARIOS, POLICIES: POLICIES, run: run };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.CacheModel = api;
})(this);
