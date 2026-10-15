/* Interactive diagrams: click a box for details, or step through a flow.
   Markup: <figure data-ix='{"flows":[{"name","cum","steps":[{"on":[ids],"t":"text"}]}]}'>
   Boxes are .nd[data-id][data-title][data-info]. Arrows and rows are .ed[data-id]. */
(function () {
  function h(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function init(fig) {
    var cfg;
    try { cfg = JSON.parse(fig.getAttribute('data-ix')); } catch (e) { return; }
    var flows = cfg.flows || [];
    var items = [].slice.call(fig.querySelectorAll('[data-id]'));
    var nodes = [].slice.call(fig.querySelectorAll('.nd'));
    var flow = 0, step = 0, sel = null;
    var box = h('div', 'ixc');
    var tabs = h('div', 'ixt');
    var tabBtns = [];
    if (flows.length > 1) {
      tabs.setAttribute('role', 'group');
      tabs.setAttribute('aria-label', 'Choose a case');
      flows.forEach(function (f, i) {
        var b = h('button', '', f.name);
        b.type = 'button';
        b.addEventListener('click', function () { flow = i; step = 1; render(); });
        tabBtns.push(b); tabs.appendChild(b);
      });
      box.appendChild(tabs);
    }
    var bar = h('div', 'ixb');
    var back = h('button', '', 'Back'), next = h('button', 'go', ''), reset = h('button', '', 'Reset');
    back.type = next.type = reset.type = 'button';
    var count = h('span', 'ixn');
    bar.appendChild(back); bar.appendChild(next); bar.appendChild(reset); bar.appendChild(count);
    box.appendChild(bar);
    var panel = h('p', 'ixp');
    panel.setAttribute('role', 'status');
    box.appendChild(panel);
    var cap = fig.querySelector('figcaption');
    fig.insertBefore(box, cap);

    function steps() { return flows[flow].steps; }
    function render() {
      var on = {}, seen = {};
      fig.classList.toggle('ixon', step > 0 || !!sel);
      items.forEach(function (e) { e.classList.remove('hot', 'seen', 'sel'); });
      nodes.forEach(function (n) { n.classList.remove('sel'); });
      if (step > 0) {
        var s = steps();
        s.forEach(function (st, i) {
          st.on.forEach(function (id) {
            if (i === step - 1) on[id] = 1; else if (i < step - 1 && flows[flow].cum) seen[id] = 1;
          });
        });
        items.forEach(function (e) {
          var id = e.getAttribute('data-id');
          if (on[id]) e.classList.add('hot'); else if (seen[id]) e.classList.add('seen');
        });
        panel.textContent = s[step - 1].t;
        count.textContent = 'Step ' + step + ' of ' + s.length;
        next.textContent = step < s.length ? 'Next' : 'Again';
      } else {
        if (sel) { sel.classList.add('sel'); panel.textContent = ''; var t = h('strong', '', sel.getAttribute('data-title') + '. '); panel.appendChild(t); panel.appendChild(document.createTextNode(sel.getAttribute('data-info'))); }
        else panel.textContent = (nodes.length ? 'Tap a box for details. ' : '') + 'Or step through ' + (flows.length > 1 ? 'a case' : 'it') + '.';
        count.textContent = '';
        next.textContent = flows.length > 1 ? 'Start' : 'Start: ' + flows[0].name;
      }
      back.disabled = step < 2;
      reset.hidden = step === 0 && !sel;
      tabBtns.forEach(function (b, i) { b.setAttribute('aria-pressed', step > 0 && i === flow ? 'true' : 'false'); });
    }
    next.addEventListener('click', function () {
      sel = null;
      if (step === 0 || step >= steps().length) step = 1; else step++;
      render();
    });
    back.addEventListener('click', function () { if (step > 1) { step--; render(); } });
    reset.addEventListener('click', function () { step = 0; sel = null; render(); });
    nodes.forEach(function (n) {
      function pick() { step = 0; sel = (sel === n) ? null : n; render(); }
      n.addEventListener('click', pick);
      n.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); }
      });
    });
    fig.classList.add('ix');
    render();
  }
  [].slice.call(document.querySelectorAll('figure[data-ix]')).forEach(init);
})();
