/* HomeBudget app: hash routing (#/dashboard, #/transactions, #/budgets,
   #/goals, #/bills, #/insights) and every view rendered from HB state.
   Adding, deleting, budgeting, contributing and marking bills paid all
   update the same totals and are saved to localStorage. */

(function () {
  "use strict";
  var state = HB.loadState();
  var view = document.getElementById("view");
  var navLinks = document.querySelectorAll("nav.main-nav a");

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function save() { HB.saveState(state); }
  function route() {
    var hash = (window.location.hash || "#/dashboard").replace(/^#/, "");
    var parts = hash.split("/");
    return parts[1] || "dashboard";
  }
  function setActive(name) {
    navLinks.forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("data-route") === name);
    });
  }
  function fmtDate(d) {
    var p = d.split("-");
    var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return months[Number(p[1]) - 1] + " " + Number(p[2]);
  }
  function statCard(label, value, sub, cls) {
    return '<div class="card stat span4"><div class="label">' + label + '</div>' +
      '<div class="value ' + (cls || "") + '">' + value + '</div><div class="sub">' + sub + '</div></div>';
  }
  function txRows(list) {
    return list.map(function (t) {
      var sign = t.type === "income" ? "+" : "−";
      var cls = t.type === "income" ? "pos" : "neg";
      return '<tr><td>' + fmtDate(t.date) + '</td><td>' + esc(t.desc) +
        (t.cat ? '<br><span class="cat">' + HB.categoryName(t.cat) + '</span>' : "") +
        '</td><td class="num ' + cls + '">' + sign + HB.money2(t.amount) + '</td>' +
        '<td class="num"><button class="danger" data-del="' + t.id + '" aria-label="Delete ' + esc(t.desc) + '">Delete</button></td></tr>';
    }).join("");
  }

  /* ---------- Dashboard ---------- */
  function renderDashboard() {
    var t = HB.totals(state);
    var spent = HB.spentByCategory(state);
    var left = t.budgetTotal - t.spent;
    var rate = t.income ? Math.round(100 * t.balance / t.income) : 0;
    var recent = state.transactions.slice().sort(function (a, b) { return b.date.localeCompare(a.date) || b.id - a.id; }).slice(0, 8);
    // The chart's November bar follows the live totals, so a transaction added
    // today moves the bar the same moment the stat tiles move.
    var hist = HB.HISTORY.map(function (h) { return { month: h.month, income: h.income, spent: h.spent }; });
    hist[hist.length - 1].income = t.income;
    hist[hist.length - 1].spent = t.spent;
    var over = HB.CATEGORIES.filter(function (c) { return (spent[c.id] || 0) > (state.budgets[c.id] || 0); });
    var warn = over.length ? '<p class="notice"><b>Heads up:</b> ' + over.map(function (c) { return HB.categoryName(c.id); }).join(", ") +
      ' is over budget this month. <a href="#/budgets">Review budgets</a></p>'
      : '<p class="notice"><b>On track:</b> every category is inside its November budget. ' + HB.money(left) + ' of the budget is still unspent.</p>';
    view.innerHTML =
      '<section class="card hero span12"><h1>November budget at a glance</h1>' +
      '<p>Income, spending and what is left — for the Rivera household, ' + HB.MONTH + '.</p>' +
      '<div class="big">' + HB.money(t.balance) + ' left this month</div>' +
      '<p>' + HB.money(t.income) + ' in · ' + HB.money(t.spent) + ' out · saving ' + rate + '% of income</p></section>' +
      '<div class="grid">' +
      statCard("Income", HB.money(t.income), "Salary $4,800 · freelance $750 · interest &amp; refund $300") +
      statCard("Spent so far", HB.money(t.spent), "of a " + HB.money(t.budgetTotal) + " monthly budget", t.spent > t.budgetTotal ? "warn" : "") +
      statCard("Balance", HB.money(t.balance), "Income minus spending — it adds up", "good") +
      '<section class="card span7"><h2>Where the money went</h2>' + HB.donutChart(spent) + '</section>' +
      '<section class="card span5"><h2>Income vs spending — last 6 months</h2>' + HB.barChart(hist) +
      '<p class="muted">November is on pace with the household&rsquo;s usual $2,900–$3,300 of monthly spending.</p></section>' +
      '<section class="card span12">' + warn +
      '<h2>Recent transactions</h2><table><thead><tr><th>Date</th><th>What</th><th class="num">Amount</th><th></th></tr></thead><tbody>' +
      txRows(recent) + '</tbody></table>' +
      '<p><a class="btn" href="#/transactions">See all transactions</a></p></section></div>';
    bindDeletes();
  }

  /* ---------- Transactions ---------- */
  function renderTransactions() {
    var t = HB.totals(state);
    var all = state.transactions.slice().sort(function (a, b) { return b.date.localeCompare(a.date) || b.id - a.id; });
    var opts = HB.CATEGORIES.map(function (c) { return '<option value="' + c.id + '">' + c.name + '</option>'; }).join("");
    view.innerHTML =
      '<h1>Transactions</h1><p class="muted">' + all.length + ' entries in ' + HB.MONTH +
      ' · income ' + HB.money(t.income) + ' · spending ' + HB.money(t.spent) +
      ' · balance ' + HB.money(t.balance) + '</p>' +
      '<div class="grid"><section class="card span5"><h2>Add a transaction</h2>' +
      '<form class="add-form" id="tx-form">' +
      '<div class="full"><label for="f-desc">What was it?</label><input id="f-desc" required maxlength="80" placeholder="e.g. Supermarket — weekly shop"></div>' +
      '<div><label for="f-amount">Amount ($)</label><input id="f-amount" type="number" min="0.01" step="0.01" required placeholder="42.50"></div>' +
      '<div><label for="f-type">Type</label><select id="f-type"><option value="expense">Spending</option><option value="income">Income</option></select></div>' +
      '<div><label for="f-cat">Category</label><select id="f-cat">' + opts + '</select></div>' +
      '<div><label for="f-date">Date</label><input id="f-date" type="date" value="2026-11-27" required></div>' +
      '<div class="full btn-row"><button type="submit">Add transaction</button><span class="muted small" id="tx-msg"></span></div>' +
      '</form><p class="muted small">New entries update the dashboard, budgets and charts straight away, and are kept on this device.</p></section>' +
      '<section class="card span7"><h2>All transactions</h2>' +
      '<table><thead><tr><th>Date</th><th>What</th><th class="num">Amount</th><th></th></tr></thead><tbody>' +
      txRows(all) + '</tbody></table></section></div>';
    document.getElementById("tx-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var desc = document.getElementById("f-desc").value.trim();
      var amount = Math.round(parseFloat(document.getElementById("f-amount").value) * 100) / 100;
      var type = document.getElementById("f-type").value;
      var cat = type === "income" ? null : document.getElementById("f-cat").value;
      var date = document.getElementById("f-date").value;
      if (!desc || !(amount > 0) || !date) return;
      state.transactions.push({ id: state.nextId++, date: date, desc: desc, amount: amount, type: type, cat: cat });
      save();
      document.getElementById("tx-msg").textContent = "Added — totals updated.";
      render();
    });
    bindDeletes();
  }

  /* ---------- Budgets ---------- */
  function renderBudgets() {
    var spent = HB.spentByCategory(state);
    var t = HB.totals(state);
    var rows = HB.CATEGORIES.map(function (c) {
      var s = spent[c.id] || 0, b = state.budgets[c.id] || 0;
      var pct = b ? Math.min(100, Math.round(100 * s / b)) : 0;
      var left = b - s;
      var cls = s > b ? "over" : (s > 0.85 * b ? "near" : "");
      var pill = s > b ? '<span class="pill over">Over by ' + HB.money(s - b) + '</span>'
        : (s > 0.85 * b ? '<span class="pill near">Almost there</span>' : '<span class="pill">' + HB.money(left) + ' left</span>');
      return '<div class="budget-row"><div class="budget-head"><b>' + c.name + '</b><span>' + HB.money(s) + ' of ' + HB.money(b) + ' ' + pill + '</span></div>' +
        '<div class="bar-track"><div class="bar-fill ' + cls + '" style="width:' + pct + '%"></div></div>' +
        '<div class="small muted">' + pct + '% used · <label class="small" for="b-' + c.id + '">Monthly budget $</label> ' +
        '<input id="b-' + c.id + '" type="number" min="0" step="10" value="' + b + '" style="width:90px;display:inline-block;padding:4px 8px" data-budget="' + c.id + '"></div></div>';
    }).join("");
    view.innerHTML =
      '<h1>Budgets</h1><p class="muted">Monthly plan: ' + HB.money(t.budgetTotal) + ' across ' + HB.CATEGORIES.length +
      ' categories · spent ' + HB.money(t.spent) + ' · ' + HB.money(t.budgetTotal - t.spent) + ' still to spend.</p>' +
      '<div class="grid"><section class="card span8"><h2>November budgets</h2>' + rows +
      '<p class="muted small">Change a budget amount and press Enter — the totals and the dashboard update immediately.</p></section>' +
      '<section class="card span4"><h2>How the plan is built</h2>' +
      '<p>Rent is fixed at $1,650. Groceries get $600 because the household cooks most nights. Dining out is capped at $300 — the one category that usually creeps up.</p>' +
      '<p>Anything left at month&rsquo;s end goes to the emergency fund. Last month the household saved $2,850.</p>' +
      '<p><a class="btn secondary" href="#/goals">See savings goals</a></p></section></div>';
    document.querySelectorAll("[data-budget]").forEach(function (input) {
      input.addEventListener("change", function () {
        var v = Math.max(0, Math.round(Number(input.value) || 0));
        state.budgets[input.getAttribute("data-budget")] = v;
        save(); render();
      });
    });
  }

  /* ---------- Goals ---------- */
  function renderGoals() {
    var totalSaved = state.goals.reduce(function (a, g) { return a + g.saved; }, 0);
    var totalTarget = state.goals.reduce(function (a, g) { return a + g.target; }, 0);
    var cards = state.goals.map(function (g) {
      var pct = Math.min(100, Math.round(100 * g.saved / g.target));
      return '<div class="goal"><div class="budget-head"><b>' + esc(g.name) + '</b><span class="pct">' + pct + '% · ' + HB.money(g.saved) + ' of ' + HB.money(g.target) + '</span></div>' +
        '<div class="bar-track"><div class="bar-fill" style="width:' + pct + '%"></div></div>' +
        '<p class="muted small">' + esc(g.note) + ' ' + HB.money(g.target - g.saved) + ' to go.</p>' +
        '<div class="btn-row"><button class="small" data-add-goal="' + g.id + '">Add $50</button>' +
        '<button class="small secondary" data-add-goal100="' + g.id + '">Add $100</button></div></div>';
    }).join("");
    view.innerHTML =
      '<h1>Savings goals</h1><p class="muted">' + HB.money(totalSaved) + ' saved toward ' + HB.money(totalTarget) +
      ' across ' + state.goals.length + ' goals.</p>' +
      '<div class="grid"><section class="card span7"><h2>Your goals</h2>' + cards + '</section>' +
      '<section class="card span5"><h2>Start a new goal</h2>' +
      '<form class="add-form" id="goal-form">' +
      '<div class="full"><label for="g-name">Goal name</label><input id="g-name" required maxlength="60" placeholder="e.g. New washing machine"></div>' +
      '<div><label for="g-target">Target ($)</label><input id="g-target" type="number" min="1" step="10" required placeholder="800"></div>' +
      '<div><label for="g-saved">Already saved ($)</label><input id="g-saved" type="number" min="0" step="10" value="0"></div>' +
      '<div class="full"><label for="g-note">What is it for?</label><input id="g-note" maxlength="120" placeholder="A short note to yourself"></div>' +
      '<div class="full btn-row"><button type="submit">Create goal</button><span class="muted small" id="goal-msg"></span></div>' +
      '</form><p class="muted small">Tip: a goal with a date and a monthly amount gets there faster. $100 a month reaches an $800 goal in eight months.</p></section></div>';
    document.getElementById("goal-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("g-name").value.trim();
      var target = Math.round(Number(document.getElementById("g-target").value) || 0);
      var saved = Math.round(Number(document.getElementById("g-saved").value) || 0);
      if (!name || target <= 0) return;
      state.goals.push({ id: state.nextId++, name: name, target: target, saved: Math.min(saved, target), note: document.getElementById("g-note").value.trim() || "A new goal for the household." });
      save(); render();
    });
    document.querySelectorAll("[data-add-goal]").forEach(function (btn) {
      btn.addEventListener("click", function () { contribute(Number(btn.getAttribute("data-add-goal")), 50); });
    });
    document.querySelectorAll("[data-add-goal100]").forEach(function (btn) {
      btn.addEventListener("click", function () { contribute(Number(btn.getAttribute("data-add-goal100")), 100); });
    });
  }
  function contribute(id, amount) {
    state.goals.forEach(function (g) { if (g.id === id) g.saved = Math.min(g.target, g.saved + amount); });
    save(); render();
  }

  /* ---------- Bills ---------- */
  function renderBills() {
    var unpaid = state.bills.filter(function (b) { return !b.paid; });
    var dueTotal = unpaid.reduce(function (a, b) { return a + b.amount; }, 0);
    var rows = state.bills.slice().sort(function (a, b) { return a.due.localeCompare(b.due); }).map(function (b) {
      var soon = !b.paid && b.due <= "2026-12-07";
      return '<div class="bill-row' + (b.paid ? " paid" : "") + '"><div><div class="bill-name">' + esc(b.name) + '</div>' +
        '<div class="bill-due' + (soon ? " soon" : "") + '">Due ' + fmtDate(b.due) + ' · ' + (b.auto ? "auto-pay on" : "pay manually") + (soon && !b.paid ? " · due this week" : "") + '</div></div>' +
        '<div><b>' + HB.money(b.amount) + '</b> <button class="small' + (b.paid ? " secondary" : "") + '" data-bill="' + b.id + '">' +
        (b.paid ? "Paid ✓ — undo" : "Mark paid") + '</button></div></div>';
    }).join("");
    view.innerHTML =
      '<h1>Bills &amp; reminders</h1><p class="muted">' + unpaid.length + ' bills still to pay in December · ' + HB.money(dueTotal) +
      ' due in total. Rent is the big one, on the 1st.</p>' +
      '<div class="grid"><section class="card span8"><h2>December bills</h2>' + rows + '</section>' +
      '<section class="card span4"><h2>Never miss one</h2>' +
      '<p>Three bills are on auto-pay: rent, internet and the gym. The rest need a manual tap — electricity, water, streaming and car insurance.</p>' +
      '<p>Payday is the 1st, so rent leaves the account the same day the salary lands. That is deliberate: the fixed costs go first, and what is left is what the household can spend.</p>' +
      '<p><a class="btn secondary" href="#/insights">See money tips</a></p></section></div>';
    document.querySelectorAll("[data-bill]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = Number(btn.getAttribute("data-bill"));
        state.bills.forEach(function (b) { if (b.id === id) b.paid = !b.paid; });
        save(); render();
      });
    });
  }

  /* ---------- Insights ---------- */
  function renderInsights() {
    var t = HB.totals(state);
    var spent = HB.spentByCategory(state);
    var tips = [];
    var dining = spent.dining || 0;
    if (dining > 200) tips.push("<b>Dining out is at " + HB.money(dining) + " of a $300 budget.</b> Two home-cooked dinners a week instead of takeout would save roughly $60 a month — enough to finish the laptop goal two months early.");
    else tips.push("<b>Dining out is under control</b> at " + HB.money(dining) + " of $300. Keep it there and the savings rate holds.");
    var groc = spent.groceries || 0;
    tips.push("<b>Groceries: " + HB.money(groc) + " of $600.</b> The weekly shop averages $156. A written list before each shop is the single cheapest habit in this budget — it stops the $30 top-up trips.");
    var daily = Math.round(t.spent / 27);
    tips.push("<b>Daily pace: about " + HB.money(daily) + " a day.</b> At this pace November closes near " + HB.money(Math.round(t.spent / 27 * 30)) + ", inside the " + HB.money(t.budgetTotal) + " plan.");
    tips.push("<b>Save first, spend second.</b> Moving " + HB.money(Math.round(t.balance / 2)) + " — half of this month&rsquo;s " + HB.money(t.balance) + " balance — to the emergency fund today leaves a comfortable cushion and keeps the goal on track.");
    tips.push("<b>The 50/30/20 check:</b> needs are about 86% of spending here, wants 14%, savings 47% of income. Needs run high because rent is $1,650; the household still saves well because income is steady.");
    view.innerHTML =
      '<h1>Insights &amp; tips</h1><p class="muted">Plain-language takeaways from this household&rsquo;s own November numbers — not generic advice.</p>' +
      '<div class="grid"><section class="card span7"><h2>What the numbers say</h2><ul class="tips">' +
      tips.map(function (x) { return "<li>" + x + "</li>"; }).join("") + '</ul></section>' +
      '<section class="card span5"><h2>The 50/30/20 rule, in plain words</h2>' +
      '<p><b>50% needs</b> — rent, groceries, utilities, transport. <b>30% wants</b> — dining out, fun, streaming. <b>20% savings</b> — goals and the emergency fund.</p>' +
      '<p>This household saves ' + Math.round(100 * t.balance / t.income) + '% of its income, well above the 20% guide. The trade-off is a tight fun budget — $200 a month — which is why the concert ticket stung a little.</p>' +
      '<p><a class="btn" href="#/budgets">Adjust the budgets</a></p></section>' +
      '<section class="card span12"><h2>Reset the demo</h2><p>Changed something and want the original November figures back? ' +
      '<button class="secondary" id="reset-btn">Restore the original data</button></p></section></div>';
    document.getElementById("reset-btn").addEventListener("click", function () {
      state = HB.resetState(); save(); render();
    });
  }

  function bindDeletes() {
    document.querySelectorAll("[data-del]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = Number(btn.getAttribute("data-del"));
        state.transactions = state.transactions.filter(function (t) { return t.id !== id; });
        save(); render();
      });
    });
  }

  function render() {
    var name = route();
    setActive(name);
    if (name === "transactions") renderTransactions();
    else if (name === "budgets") renderBudgets();
    else if (name === "goals") renderGoals();
    else if (name === "bills") renderBills();
    else if (name === "insights") renderInsights();
    else renderDashboard();
    window.scrollTo(0, 0);
  }

  window.addEventListener("hashchange", render);
  render();
})();
