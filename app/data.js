/* HomeBudget data: the household's November figures, kept in one place so
   every view adds up from the same transactions. Saved edits live in
   localStorage under "homebudget-v1"; the seed below is the starting point. */

var HB = HB || {};

HB.MONTH = "November 2026";

HB.CATEGORIES = [
  { id: "housing",    name: "Housing",    budget: 1650, color: "#1f6f4a" },
  { id: "groceries",  name: "Groceries",  budget: 600,  color: "#2e9e6b" },
  { id: "dining",     name: "Dining out", budget: 300,  color: "#d9a441" },
  { id: "transport",  name: "Transport",  budget: 250,  color: "#4a7fb5" },
  { id: "utilities",  name: "Utilities",  budget: 280,  color: "#7a6bb5" },
  { id: "fun",        name: "Fun & streaming", budget: 200, color: "#c96a8b" },
  { id: "health",     name: "Health",     budget: 150,  color: "#3aa6a0" },
  { id: "clothing",   name: "Clothing",   budget: 120,  color: "#8a6d4b" }
];

HB.SEED_TRANSACTIONS = [
  { id: 1,  date: "2026-11-01", desc: "Monthly salary — Rivera household", amount: 4800, type: "income",  cat: null },
  { id: 2,  date: "2026-11-01", desc: "Rent — Maple Street apartment",     amount: 1650, type: "expense", cat: "housing" },
  { id: 3,  date: "2026-11-03", desc: "Whole Foods Market",                amount: 132,  type: "expense", cat: "groceries" },
  { id: 4,  date: "2026-11-05", desc: "City Power & Light — electricity", amount: 128,  type: "expense", cat: "utilities" },
  { id: 5,  date: "2026-11-06", desc: "Metro transit pass",                amount: 86,   type: "expense", cat: "transport" },
  { id: 6,  date: "2026-11-07", desc: "Freelance design project",          amount: 750,  type: "income",  cat: null },
  { id: 7,  date: "2026-11-08", desc: "Corner Bakery — lunch",             amount: 24,   type: "expense", cat: "dining" },
  { id: 8,  date: "2026-11-10", desc: "Farmers market",                    amount: 58,   type: "expense", cat: "groceries" },
  { id: 9,  date: "2026-11-12", desc: "Gas station",                       amount: 42,   type: "expense", cat: "transport" },
  { id: 10, date: "2026-11-13", desc: "Internet & phone",                  amount: 100,  type: "expense", cat: "utilities" },
  { id: 11, date: "2026-11-14", desc: "Bank interest & refund",            amount: 300,  type: "income",  cat: null },
  { id: 12, date: "2026-11-15", desc: "Takeout Thai",                      amount: 38,   type: "expense", cat: "dining" },
  { id: 13, date: "2026-11-17", desc: "Supermarket — weekly shop",         amount: 187,  type: "expense", cat: "groceries" },
  { id: 14, date: "2026-11-18", desc: "Movie night",                       amount: 36,   type: "expense", cat: "fun" },
  { id: 15, date: "2026-11-20", desc: "Pharmacy",                          amount: 41,   type: "expense", cat: "health" },
  { id: 16, date: "2026-11-21", desc: "Gym membership",                    amount: 55,   type: "expense", cat: "health" },
  { id: 17, date: "2026-11-22", desc: "Streaming bundle",                  amount: 28,   type: "expense", cat: "fun" },
  { id: 18, date: "2026-11-23", desc: "Concert ticket",                    amount: 84,   type: "expense", cat: "fun" },
  { id: 19, date: "2026-11-24", desc: "Groceries top-up",                  amount: 135,  type: "expense", cat: "groceries" },
  { id: 20, date: "2026-11-25", desc: "Dinner with friends",               amount: 64,   type: "expense", cat: "dining" },
  { id: 21, date: "2026-11-26", desc: "Rideshare",                         amount: 58,   type: "expense", cat: "transport" },
  { id: 22, date: "2026-11-26", desc: "New jacket",                        amount: 74,   type: "expense", cat: "clothing" },
  { id: 23, date: "2026-11-27", desc: "Coffee & pastries",                 amount: 88,   type: "expense", cat: "dining" }
];

HB.HISTORY = [
  { month: "Jun", income: 5620, spent: 3180 },
  { month: "Jul", income: 5850, spent: 2940 },
  { month: "Aug", income: 5710, spent: 3320 },
  { month: "Sep", income: 5850, spent: 2890 },
  { month: "Oct", income: 5900, spent: 3050 },
  { month: "Nov", income: 5850, spent: 3108 }
];

HB.SEED_GOALS = [
  { id: 1, name: "Emergency fund",    target: 6000, saved: 4350, note: "Three months of essentials, kept in a separate savings account." },
  { id: 2, name: "Family trip to the coast", target: 2400, saved: 1180, note: "Train tickets, a cottage for four nights, and meals out." },
  { id: 3, name: "New laptop",        target: 1500, saved: 920,  note: "Replaces the 2019 laptop before it gives up entirely." }
];

HB.SEED_BILLS = [
  { id: 1, name: "Rent — Maple Street",      amount: 1650, due: "2026-12-01", paid: false, auto: true },
  { id: 2, name: "City Power & Light",       amount: 132,  due: "2026-12-05", paid: false, auto: false },
  { id: 3, name: "Internet & phone",         amount: 100,  due: "2026-12-12", paid: false, auto: true },
  { id: 4, name: "Water bill",               amount: 48,   due: "2026-12-15", paid: false, auto: false },
  { id: 5, name: "Gym membership",           amount: 55,   due: "2026-12-21", paid: false, auto: true },
  { id: 6, name: "Streaming bundle",         amount: 28,   due: "2026-12-22", paid: false, auto: true },
  { id: 7, name: "Car insurance",            amount: 96,   due: "2026-12-28", paid: false, auto: false }
];

HB.loadState = function () {
  try {
    var raw = window.localStorage.getItem("homebudget-v1");
    if (raw) {
      var s = JSON.parse(raw);
      if (s && s.transactions && s.goals && s.bills && s.budgets) return s;
    }
  } catch (e) { /* fresh start on bad storage */ }
  var budgets = {};
  HB.CATEGORIES.forEach(function (c) { budgets[c.id] = c.budget; });
  return {
    transactions: HB.SEED_TRANSACTIONS.slice(),
    goals: HB.SEED_GOALS.slice(),
    bills: HB.SEED_BILLS.slice(),
    budgets: budgets,
    nextId: 100
  };
};

HB.saveState = function (state) {
  try { window.localStorage.setItem("homebudget-v1", JSON.stringify(state)); } catch (e) { /* storage full or blocked */ }
};

HB.resetState = function () {
  try { window.localStorage.removeItem("homebudget-v1"); } catch (e) {}
  return HB.loadState();
};

HB.money = function (n) {
  return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

HB.money2 = function (n) {
  return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

HB.categoryName = function (id) {
  for (var i = 0; i < HB.CATEGORIES.length; i++) if (HB.CATEGORIES[i].id === id) return HB.CATEGORIES[i].name;
  return "Other";
};

HB.categoryColor = function (id) {
  for (var i = 0; i < HB.CATEGORIES.length; i++) if (HB.CATEGORIES[i].id === id) return HB.CATEGORIES[i].color;
  return "#888888";
};

HB.totals = function (state) {
  var income = 0, spent = 0;
  state.transactions.forEach(function (t) {
    if (t.type === "income") income += t.amount; else spent += t.amount;
  });
  var budgetTotal = 0;
  HB.CATEGORIES.forEach(function (c) { budgetTotal += state.budgets[c.id] || 0; });
  return { income: income, spent: spent, balance: income - spent, budgetTotal: budgetTotal };
};

HB.spentByCategory = function (state) {
  var out = {};
  HB.CATEGORIES.forEach(function (c) { out[c.id] = 0; });
  state.transactions.forEach(function (t) {
    if (t.type === "expense" && out[t.cat] !== undefined) out[t.cat] += t.amount;
  });
  return out;
};
