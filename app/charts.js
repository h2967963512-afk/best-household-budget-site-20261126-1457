/* HomeBudget charts: small inline-SVG charts drawn from the real figures —
   a spending donut and a six-month income-vs-spending bar chart. No library. */

var HB = HB || {};

HB.donutChart = function (spentByCat) {
  var total = 0, parts = [];
  HB.CATEGORIES.forEach(function (c) {
    var v = spentByCat[c.id] || 0;
    if (v > 0) { total += v; parts.push({ c: c, v: v }); }
  });
  if (!total) return '<p class="muted">No spending recorded yet.</p>';
  var r = 70, cx = 100, cy = 100, circ = 2 * Math.PI * r, off = 0, arcs = "";
  parts.forEach(function (p) {
    var frac = p.v / total, len = frac * circ;
    arcs += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + p.c.color +
      '" stroke-width="34" stroke-dasharray="' + len.toFixed(1) + ' ' + (circ - len).toFixed(1) +
      '" stroke-dashoffset="' + (-off).toFixed(1) + '" transform="rotate(-90 ' + cx + ' ' + cy + ')"/>';
    off += len;
  });
  var legend = parts.map(function (p) {
    var pct = Math.round(100 * p.v / total);
    return '<li><span class="dot" style="background:' + p.c.color + '"></span>' + p.c.name +
      ' <b>' + HB.money(p.v) + '</b> · ' + pct + '%</li>';
  }).join("");
  return '<div class="donut-wrap"><svg viewBox="0 0 200 200" role="img" aria-label="Spending by category chart">' + arcs +
    '<text x="100" y="96" text-anchor="middle" class="donut-total">' + HB.money(total) + '</text>' +
    '<text x="100" y="116" text-anchor="middle" class="donut-label">spent in Nov</text></svg>' +
    '<ul class="legend">' + legend + '</ul></div>';
};

HB.barChart = function (history) {
  var max = 0;
  history.forEach(function (h) { max = Math.max(max, h.income, h.spent); });
  max = Math.ceil(max / 1000) * 1000;
  var W = 560, H = 220, base = 190, bw = 26, gap = 28, x0 = 55, rows = "";
  history.forEach(function (h, i) {
    var x = x0 + i * (bw * 2 + gap);
    var ih = Math.round(h.income / max * 150), sh = Math.round(h.spent / max * 150);
    rows += '<rect x="' + x + '" y="' + (base - ih) + '" width="' + bw + '" height="' + ih +
      '" rx="3" fill="#1f6f4a"><title>' + h.month + ' income ' + HB.money(h.income) + '</title></rect>' +
      '<rect x="' + (x + bw + 4) + '" y="' + (base - sh) + '" width="' + bw + '" height="' + sh +
      '" rx="3" fill="#d9a441"><title>' + h.month + ' spending ' + HB.money(h.spent) + '</title></rect>' +
      '<text x="' + (x + bw) + '" y="210" text-anchor="middle" class="axis">' + h.month + '</text>' +
      '<text x="' + (x + bw) + '" y="' + (base - ih - 6) + '" text-anchor="middle" class="bar-val">' + HB.money(h.income) + '</text>';
  });
  var grid = [0.25, 0.5, 0.75, 1].map(function (f) {
    var y = base - Math.round(f * 150);
    return '<line x1="50" y1="' + y + '" x2="570" y2="' + y + '" class="grid"/>' +
      '<text x="44" y="' + (y + 4) + '" text-anchor="end" class="axis">' + HB.money(max * f) + '</text>';
  }).join("");
  return '<svg viewBox="0 0 580 225" class="bars" role="img" aria-label="Monthly income and spending chart">' +
    grid + '<line x1="50" y1="' + base + '" x2="570" y2="' + base + '" class="axis-line"/>' + rows + '</svg>' +
    '<p class="chart-key"><span class="key-inc">Income</span><span class="key-sp">Spending</span></p>';
};
