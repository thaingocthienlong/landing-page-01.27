// Charts for the Story series. Seeded data, so every export draws the same picture.
window.VPN = (function () {
  function prng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6d2b79f5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function gaussFrom(rand) { return function () { return Math.sqrt(-2 * Math.log(rand() || 1e-9)) * Math.cos(2 * Math.PI * rand()); }; }

  // Route of the 3 courses: simulated scatter around a rising fit line, band, three course milestones.
  // opts.crisp redraws the line and milestones without the glow filter on top, so vector exports keep them as vectors.
  function route(id, opts) {
    opts = opts || {};
    var rand = prng(20270108), gauss = gaussFrom(rand);
    var L = 30, R = 930, T = 8, B = 108;
    function fit(x) { return 99 - (x - L) / (R - L) * 78; }
    var s = '';
    for (var g = 1; g <= 2; g++) s += '<line x1="' + L + '" x2="' + R + '" y1="' + (T + g * 33) + '" y2="' + (T + g * 33) + '" stroke="rgba(255,255,255,.09)"/>';
    for (var v = 1; v <= 5; v++) s += '<line y1="' + T + '" y2="' + B + '" x1="' + (L + v * 150) + '" x2="' + (L + v * 150) + '" stroke="rgba(255,255,255,.09)"/>';
    var up = [], lo = [];
    for (var x = L; x <= R; x += 30) { var w = 8 + Math.abs(x - 480) / 450 * 8; up.push(x + ',' + (fit(x) - w).toFixed(1)); lo.unshift(x + ',' + (fit(x) + w).toFixed(1)); }
    s += '<polygon points="' + up.concat(lo).join(' ') + '" fill="#5ad8ff" fill-opacity=".16"/>';
    for (var i = 0; i < 64; i++) {
      var px = L + 10 + rand() * (R - L - 20), py = Math.min(B - 6, Math.max(T + 6, fit(px) + gauss() * 10));
      s += '<circle cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="4.6" fill="#cfe0ff" fill-opacity=".7"/>';
    }
    s += '<line x1="' + L + '" y1="' + fit(L) + '" x2="' + R + '" y2="' + fit(R) + '" stroke="#5ad8ff" stroke-width="' + (opts.crisp ? 2.5 : 4) + '" style="filter: drop-shadow(0 0 6px rgba(90,216,255,.8))"/>';
    if (opts.crisp) s += '<line x1="' + L + '" y1="' + fit(L) + '" x2="' + R + '" y2="' + fit(R) + '" stroke="#5ad8ff" stroke-width="4"/>';
    s += '<path d="M' + L + ' ' + T + 'V' + B + 'H' + (R + 6) + '" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2"/>';
    s += '<path d="M' + (R + 6) + ' ' + (B - 6) + 'l12 6-12 6z" fill="rgba(255,255,255,.55)"/><path d="M' + (L - 6) + ' ' + T + 'l6-12 6 12z" fill="rgba(255,255,255,.55)"/>';
    var ms = [[157, '#5ad8ff'], [470, '#3f86ff'], [783, '#c3dbff']];
    ms.forEach(function (m) {
      var y = fit(m[0]);
      s += '<line x1="' + m[0] + '" x2="' + m[0] + '" y1="' + (y + 16) + '" y2="' + (B + 16) + '" stroke="' + m[1] + '" stroke-width="2.5" stroke-dasharray="6 6"/>';
      s += '<circle cx="' + m[0] + '" cy="' + y + '" r="' + (opts.crisp ? 14 : 15) + '" fill="' + m[1] + '"' + (opts.crisp ? '' : ' stroke="#fff" stroke-width="4"') + ' style="filter: drop-shadow(0 0 10px ' + m[1] + ')"/>';
      if (opts.crisp) s += '<circle cx="' + m[0] + '" cy="' + y + '" r="15" fill="' + m[1] + '" stroke="#fff" stroke-width="4"/>';
    });
    document.getElementById(id).innerHTML = s;
  }

  // Small figure per course, 180 x 120: regression (K1), cost-effectiveness plane (K2), forecast (K3).
  function mini(id, kind, color) {
    var W = 180, H = 120, L = 12, R = 172, T = 10, B = 108, s = '';
    var axis = 'stroke="rgba(255,255,255,.55)" stroke-width="2" fill="none"';
    var rand, gauss, i;
    if (kind === 'reg') {
      rand = prng(1101); gauss = gaussFrom(rand);
      var fit = function (x) { return B - 12 - (x - L) / (R - L) * 70; };
      var up = [], lo = [];
      for (var x = L; x <= R; x += 16) { var w = 6 + Math.abs(x - 92) / 80 * 6; up.push(x + ',' + (fit(x) - w).toFixed(1)); lo.unshift(x + ',' + (fit(x) + w).toFixed(1)); }
      s += '<polygon points="' + up.concat(lo).join(' ') + '" fill="' + color + '" fill-opacity=".2"/>';
      for (i = 0; i < 26; i++) { var px = L + 6 + rand() * (R - L - 12); s += '<circle cx="' + px.toFixed(1) + '" cy="' + (fit(px) + gauss() * 9).toFixed(1) + '" r="3.2" fill="#fff" fill-opacity=".8"/>'; }
      s += '<line x1="' + L + '" y1="' + fit(L) + '" x2="' + R + '" y2="' + fit(R) + '" stroke="' + color + '" stroke-width="3.5"/>';
      s += '<path d="M' + L + ' ' + T + 'V' + B + 'H' + R + '" ' + axis + '/>';
    } else if (kind === 'cea') {
      rand = prng(1201); gauss = gaussFrom(rand);
      var cx = (L + R) / 2, cy = (T + B) / 2;
      s += '<polygon points="' + cx + ',' + cy + ' ' + R + ',' + (cy - 44) + ' ' + R + ',' + B + ' ' + cx + ',' + B + '" fill="' + color + '" fill-opacity=".16"/>';
      s += '<line x1="' + L + '" x2="' + R + '" y1="' + cy + '" y2="' + cy + '" ' + axis + '/><line x1="' + cx + '" x2="' + cx + '" y1="' + T + '" y2="' + B + '" ' + axis + '/>';
      var me = 0, mc = 0;
      for (i = 0; i < 46; i++) {
        var ex = cx + 34 + gauss() * 14, cyy = cy - 18 + gauss() * 12;
        me += ex / 46; mc += cyy / 46;
        s += '<circle cx="' + ex.toFixed(1) + '" cy="' + cyy.toFixed(1) + '" r="2.6" fill="#fff" fill-opacity=".75"/>';
      }
      s += '<line x1="' + L + '" y1="' + (cy + 44) + '" x2="' + R + '" y2="' + (cy - 44) + '" stroke="' + color + '" stroke-width="3" stroke-dasharray="8 6"/>';
      s += '<circle cx="' + me.toFixed(1) + '" cy="' + mc.toFixed(1) + '" r="7" fill="#0a2f7f" stroke="' + color + '" stroke-width="3"/>';
    } else if (kind === 'ts') {
      rand = prng(1301); gauss = gaussFrom(rand);
      var n = 30, m = 9, step = (R - L) / (n + m - 1);
      var y = function (t) { return B - 24 - t * 1.1 - Math.sin(t / 6 * Math.PI) * 14; };
      var hist = [], fc = [], upb = [], lob = [];
      for (i = 0; i < n; i++) hist.push((L + i * step).toFixed(1) + ',' + (y(i) + gauss() * 3).toFixed(1));
      for (i = n - 1; i < n + m; i++) {
        var X = (L + i * step).toFixed(1), band = 3 + (i - n + 1) * 2.2;
        fc.push(X + ',' + y(i).toFixed(1)); upb.push(X + ',' + (y(i) - band).toFixed(1)); lob.unshift(X + ',' + (y(i) + band).toFixed(1));
      }
      s += '<polygon points="' + upb.concat(lob).join(' ') + '" fill="' + color + '" fill-opacity=".22"/>';
      s += '<polyline points="' + hist.join(' ') + '" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="2.6" stroke-linejoin="round"/>';
      s += '<polyline points="' + fc.join(' ') + '" fill="none" stroke="' + color + '" stroke-width="3" stroke-dasharray="7 5"/>';
      s += '<path d="M' + L + ' ' + T + 'V' + B + 'H' + R + '" ' + axis + '/>';
    }
    var el = document.getElementById(id);
    el.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    el.innerHTML = s;
  }

  return { route: route, mini: mini };
})();
