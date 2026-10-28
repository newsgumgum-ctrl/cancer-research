(function () {
  var root = document.documentElement;
  function getSaved() { try { return localStorage.getItem('onb-lang'); } catch (e) { return null; } }
  function setLang(l) {
    root.setAttribute('data-lang', l);
    root.setAttribute('lang', l === 'en' ? 'en' : 'sr-Latn');
    var btns = document.querySelectorAll('.lang [data-set-lang]');
    for (var i = 0; i < btns.length; i++) btns[i].setAttribute('aria-pressed', String(btns[i].getAttribute('data-set-lang') === l));
    try { localStorage.setItem('onb-lang', l); } catch (e) {}
    document.dispatchEvent(new CustomEvent('langchange'));
  }
  var gate = document.getElementById('gate');
  function openGate() { if (!gate) return; gate.hidden = false; document.body.classList.add('gated'); var b = document.getElementById('gate-sr'); if (b) b.focus(); }
  function closeGate() { if (!gate) return; gate.hidden = true; document.body.classList.remove('gated'); }

  var saved = getSaved();
  if (saved === 'sr' || saved === 'en') { setLang(saved); closeGate(); }
  else { setLang('sr'); if (gate) openGate(); }

  var all = document.querySelectorAll('[data-set-lang]');
  for (var i = 0; i < all.length; i++) {
    all[i].addEventListener('click', function (ev) { setLang(ev.currentTarget.getAttribute('data-set-lang')); closeGate(); });
  }
  var ch = document.getElementById('change-lang');
  if (ch) ch.addEventListener('click', function () {
    if (gate) openGate();
    else setLang(root.getAttribute('data-lang') === 'en' ? 'sr' : 'en');
  });

  var more = document.getElementById('more-menu');
  if (more) {
    document.addEventListener('click', function (ev) { if (more.open && !more.contains(ev.target)) more.open = false; });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && more.open) { more.open = false; more.querySelector('summary').focus(); } });
  }

  /* open an accordion when a link points into it */
  function openFromHash() {
    var id = decodeURIComponent((location.hash || '').slice(1));
    if (!id) return;
    var el = document.getElementById(id);
    if (!el) return;
    var d = el.tagName === 'DETAILS' ? el : el.closest('details');
    if (d && !d.open) { d.open = true; setTimeout(function () { el.scrollIntoView(); }, 0); }
  }
  openFromHash();
  window.addEventListener('hashchange', openFromHash);

  function isEn() { return root.getAttribute('data-lang') === 'en'; }
  function fmt(n, d) { return n.toLocaleString(isEn() ? 'en-US' : 'sr-Latn-RS', { minimumFractionDigits: d, maximumFractionDigits: d }); }

  /* copy buttons: data-copy="baseId" copies the list baseId-sr or baseId-en */
  var copyBtns = document.querySelectorAll('[data-copy]');
  for (var c = 0; c < copyBtns.length; c++) {
    copyBtns[c].addEventListener('click', function (ev) {
      var base = ev.currentTarget.getAttribute('data-copy');
      var list = document.getElementById(base + (isEn() ? '-en' : '-sr'));
      var msg = document.getElementById(base + '-msg');
      if (!list) return;
      var items = list.querySelectorAll('li');
      var lines = [];
      for (var j = 0; j < items.length; j++) lines.push('- ' + items[j].textContent.trim());
      var out = lines.join('\n');
      function done(ok) { if (msg) msg.textContent = ok ? (isEn() ? 'Copied.' : 'Kopirano.') : (isEn() ? 'Copy failed. The list is selected, press Ctrl+C.' : 'Kopiranje nije uspelo. Lista je označena, pritisnite Ctrl+C.'); }
      function fallback() {
        try { var r = document.createRange(); r.selectNodeContents(list); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); } catch (e) {}
        done(false);
      }
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(out).then(function () { done(true); }, fallback);
        else fallback();
      } catch (e) { fallback(); }
    });
  }

  /* GKI calculator */
  var gki = document.getElementById('gki-calc');
  if (gki) {
    var gIn = document.getElementById('gki-glucose'), uIn = document.getElementById('gki-unit'), kIn = document.getElementById('gki-ketone');
    var outN = document.getElementById('gki-out'), outT = document.getElementById('gki-text');
    function calcGki() {
      var g = parseFloat(String(gIn.value).replace(',', '.')), k = parseFloat(String(kIn.value).replace(',', '.'));
      if (!(g > 0) || !(k > 0)) { outN.textContent = '—'; outT.textContent = isEn() ? 'Enter both values.' : 'Unesite obe vrednosti.'; return; }
      var gm = uIn.value === 'mgdl' ? g / 18 : g;
      var r = gm / k;
      outN.textContent = fmt(r, 1);
      outT.textContent = isEn()
        ? 'Glucose ' + fmt(gm, 1) + ' mmol/L ÷ ketones ' + fmt(k, 1) + ' mmol/L. Lower numbers mean deeper ketosis.'
        : 'Glukoza ' + fmt(gm, 1) + ' mmol/L ÷ ketoni ' + fmt(k, 1) + ' mmol/L. Što je broj manji, ketoza je dublja.';
    }
    [gIn, uIn, kIn].forEach(function (el) { el.addEventListener('input', calcGki); el.addEventListener('change', calcGki); });
    document.addEventListener('langchange', calcGki);
    calcGki();
  }

  /* protein calculator */
  var pc = document.getElementById('protein-calc');
  if (pc) {
    var w = document.getElementById('protein-weight'), pLo = document.getElementById('protein-lo'), pHi = document.getElementById('protein-hi'), pHealthy = document.querySelectorAll('.protein-healthy');
    function calcP() {
      var kg = parseFloat(String(w.value).replace(',', '.'));
      if (!(kg > 0)) { pLo.textContent = '—'; pHi.textContent = '—'; pHealthy.forEach(function (e) { e.textContent = '—'; }); return; }
      pLo.textContent = fmt(Math.round(kg * 1.2), 0);
      pHi.textContent = fmt(Math.round(kg * 1.5), 0);
      pHealthy.forEach(function (e) { e.textContent = fmt(Math.round(kg * 0.8), 0); });
    }
    w.addEventListener('input', calcP);
    document.addEventListener('langchange', calcP);
    calcP();
  }

  /* radiation (mSv) calculator */
  var rc = document.getElementById('msv-calc');
  if (rc) {
    var inputs = rc.querySelectorAll('input[data-msv]');
    var tot = document.getElementById('msv-total'), xr = document.querySelectorAll('.msv-xray'), note = document.getElementById('msv-note');
    function calcR() {
      var sum = 0;
      for (var q = 0; q < inputs.length; q++) {
        var n = parseInt(inputs[q].value, 10);
        if (n > 0) sum += n * parseFloat(inputs[q].getAttribute('data-msv'));
      }
      tot.textContent = fmt(sum, sum < 1 ? 2 : 1);
      xr.forEach(function (e) { e.textContent = fmt(Math.round(sum / 0.02), 0); });
      var pct = Math.min(100, sum);
      note.textContent = isEn()
        ? (sum < 100 ? 'Below the 100 mSv level where, statistically, cancer risk starts to rise.' : 'At or above 100 mSv. Talk to your doctor about alternatives such as MRI or ultrasound.')
        : (sum < 100 ? 'Ispod 100 mSv, granice iznad koje statistički raste rizik od raka.' : 'Na ili iznad 100 mSv. Pitajte lekara za alternative kao što su MR ili ultrazvuk.');
      var bar = document.getElementById('msv-bar');
      if (bar) bar.style.width = pct + '%';
    }
    for (var q = 0; q < inputs.length; q++) inputs[q].addEventListener('input', calcR);
    document.addEventListener('langchange', calcR);
    calcR();
  }
})();
