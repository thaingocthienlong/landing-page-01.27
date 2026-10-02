// Seeded synthetic figures in the landing-page vocabulary (see dist/app.js).
// Same seed, same picture on every export. Drawn white for a cobalt field.
window.VPNFigures = (function () {
  function prng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6d2b79f5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function gauss(rand) { return Math.sqrt(-2 * Math.log(rand() || 1e-9)) * Math.cos(2 * Math.PI * rand()); }
  var INK = "#ffffff", SOFT = "#cfe0ff";

  function frame(w, h, pad) {
    return {
      L: pad.l, R: w - pad.r, T: pad.t, B: h - pad.b,
      axes: function () {
        return '<line x1="' + this.L + '" x2="' + this.R + '" y1="' + this.B + '" y2="' + this.B + '" stroke="' + INK + '" stroke-width="1.5"/>' +
          '<line x1="' + this.L + '" x2="' + this.L + '" y1="' + this.T + '" y2="' + this.B + '" stroke="' + INK + '" stroke-width="1.5"/>';
      }
    };
  }
  function text(x, y, s, size, anchor, rotate) {
    return '<text x="' + x + '" y="' + y + '" fill="' + SOFT + '" font-size="' + size + '" font-family="Source Sans 3, sans-serif" font-weight="600"' +
      (anchor ? ' text-anchor="' + anchor + '"' : '') + (rotate ? ' transform="rotate(-90 ' + x + ' ' + y + ')"' : '') + '>' + s + '</text>';
  }

  // Hình 1: linear regression, fit line, 95% confidence band.
  function regression(w, h, o) {
    o = o || {};
    var rand = prng(20270108), n = 48, xs = [], ys = [], i;
    for (i = 0; i < n; i++) { var x = rand() * 10; xs.push(x); ys.push(2 + 0.6 * x + gauss(rand) * 1.1); }
    var mx = 0, my = 0; for (i = 0; i < n; i++) { mx += xs[i] / n; my += ys[i] / n; }
    var sxx = 0, sxy = 0; for (i = 0; i < n; i++) { sxx += (xs[i] - mx) * (xs[i] - mx); sxy += (xs[i] - mx) * (ys[i] - my); }
    var b = sxy / sxx, a = my - b * mx, sse = 0;
    for (i = 0; i < n; i++) { var r = ys[i] - a - b * xs[i]; sse += r * r; }
    var s = Math.sqrt(sse / (n - 2));
    var f = frame(w, h, o.pad || { l: 8, r: 8, t: 8, b: 8 });
    var px = function (x) { return f.L + x / 10 * (f.R - f.L); }, py = function (y) { return f.B - y / 10 * (f.B - f.T); };
    var up = [], lo = [], k;
    for (k = 0; k <= 20; k++) {
      var xx = k / 2, se = s * Math.sqrt(1 / n + (xx - mx) * (xx - mx) / sxx) * 2.01, yy = a + b * xx;
      up.push(px(xx) + "," + py(yy + se)); lo.unshift(px(xx) + "," + py(yy - se));
    }
    var out = '<polygon points="' + up.concat(lo).join(" ") + '" fill="' + INK + '" fill-opacity=".2"/>';
    for (i = 0; i < n; i++) out += '<circle cx="' + px(xs[i]).toFixed(1) + '" cy="' + py(ys[i]).toFixed(1) + '" r="' + (o.r || 4) + '" fill="' + INK + '" fill-opacity=".85"/>';
    out += '<line x1="' + px(0) + '" y1="' + py(a) + '" x2="' + px(10) + '" y2="' + py(a + 10 * b) + '" stroke="' + INK + '" stroke-width="' + (o.stroke || 2.6) + '"/>';
    out += f.axes();
    if (o.labels) out += text(f.R, f.B + 30, "x", 20, "end") + text(f.L - 14, f.T + 4, "y", 20, "end", true);
    return out;
  }

  // Hình 2: cost-effectiveness plane, simulated draws, willingness-to-pay line through origin.
  function cePlane(w, h, o) {
    o = o || {};
    var rand = prng(20270112), n = 160, i;
    var f = frame(w, h, o.pad || { l: 8, r: 8, t: 8, b: 8 });
    var cx = (f.L + f.R) / 2, cy = (f.T + f.B) / 2;
    var sx = (f.R - f.L) / 2, sy = (f.B - f.T) / 2;
    var px = function (e) { return cx + e * sx; }, py = function (c) { return cy - c * sy; };
    var out = '<line x1="' + f.L + '" x2="' + f.R + '" y1="' + cy + '" y2="' + cy + '" stroke="' + INK + '" stroke-width="1.5"/>' +
      '<line x1="' + cx + '" x2="' + cx + '" y1="' + f.T + '" y2="' + f.B + '" stroke="' + INK + '" stroke-width="1.5"/>';
    out += '<polygon points="' + cx + ',' + cy + ' ' + f.R + ',' + py(0.75) + ' ' + f.R + ',' + f.B + ' ' + cx + ',' + f.B + '" fill="' + INK + '" fill-opacity=".12"/>';
    var me = 0, mc = 0;
    for (i = 0; i < n; i++) {
      var e = 0.5 + gauss(rand) * 0.2, c = 0.28 + gauss(rand) * 0.2;
      me += e / n; mc += c / n;
      out += '<circle cx="' + px(e).toFixed(1) + '" cy="' + py(c).toFixed(1) + '" r="' + (o.r || 3.2) + '" fill="' + INK + '" fill-opacity=".7"/>';
    }
    out += '<line x1="' + px(-1) + '" y1="' + py(-0.75) + '" x2="' + px(1) + '" y2="' + py(0.75) + '" stroke="' + INK + '" stroke-width="' + (o.stroke || 2.4) + '" stroke-dasharray="10 7"/>';
    out += '<circle cx="' + px(me) + '" cy="' + py(mc) + '" r="' + ((o.r || 3.2) * 2.4) + '" fill="#0a3d91" stroke="' + INK + '" stroke-width="3"/>';
    if (o.labels) out += text(f.R, cy - 12, "ΔE", 20, "end") + text(cx + 12, f.T + 18, "ΔC", 20);
    return out;
  }

  // Hình 3: monthly series with seasonality, 12-month forecast and band.
  function series(w, h, o) {
    o = o || {};
    var rand = prng(20270115), n = 60, m = 12, ys = [], i;
    for (i = 0; i < n; i++) ys.push(4 + i * 0.045 + Math.sin(i / 12 * 2 * Math.PI) * 1.5 + gauss(rand) * 0.22);
    var f = frame(w, h, o.pad || { l: 8, r: 8, t: 8, b: 8 });
    var px = function (t) { return f.L + t / (n + m - 1) * (f.R - f.L); }, py = function (y) { return f.B - (y - 1) / 9 * (f.B - f.T); };
    var hist = ys.map(function (y, t) { return px(t).toFixed(1) + "," + py(y).toFixed(1); });
    var fc = [], up = [], lo = [];
    for (i = 0; i < m; i++) {
      var t = n + i, y = 4 + t * 0.045 + Math.sin(t / 12 * 2 * Math.PI) * 1.5, band = 0.45 + i * 0.07;
      fc.push(px(t).toFixed(1) + "," + py(y).toFixed(1));
      up.push(px(t).toFixed(1) + "," + py(y + band).toFixed(1)); lo.unshift(px(t).toFixed(1) + "," + py(y - band).toFixed(1));
    }
    var out = '<polygon points="' + up.concat(lo).join(" ") + '" fill="' + INK + '" fill-opacity=".2"/>';
    out += '<line x1="' + px(n - 0.5) + '" x2="' + px(n - 0.5) + '" y1="' + f.T + '" y2="' + f.B + '" stroke="' + SOFT + '" stroke-opacity=".6" stroke-dasharray="4 6"/>';
    out += '<polyline points="' + hist.join(" ") + '" fill="none" stroke="' + INK + '" stroke-width="' + (o.stroke || 2.4) + '" stroke-linejoin="round"/>';
    out += '<polyline points="' + [hist[n - 1]].concat(fc).join(" ") + '" fill="none" stroke="' + INK + '" stroke-width="' + (o.stroke || 2.4) + '" stroke-dasharray="9 6"/>';
    out += f.axes();
    if (o.labels) out += text(f.R, f.B + 30, "tháng", 20, "end");
    return out;
  }

  function draw(id, kind, o) {
    var el = document.getElementById(id), vb = el.viewBox.baseVal;
    el.innerHTML = { regression: regression, ce: cePlane, series: series }[kind](vb.width, vb.height, o);
  }
  return { draw: draw };
})();
