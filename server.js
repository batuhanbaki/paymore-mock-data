/* Paymore Mock API (Cloud-ready)
 * - Implements all endpoints from API_DOCUMENTATION.md
 * - Generates large random dataset (default: 10k transactions) deterministically
 *
 * ENV:
 *  PORT=3001
 *  SEED=20260225
 *  TERMINALS_COUNT=1000
 *  TRANSACTIONS_COUNT=10000
 *  NOTIFICATIONS_COUNT=2000
 *  TEAM_COUNT=50
 */

const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

/** -----------------------------
 *  Seeded RNG (deterministic)
 *  ----------------------------- */
function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const SEED = parseInt(process.env.SEED || "20260225", 10);
const rand = mulberry32(SEED);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

function pad(n, w = 3) {
  return String(n).padStart(w, "0");
}
function nowIso() {
  return new Date().toISOString();
}
function isoDaysAgo(days) {
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return d.toISOString();
}
function dateOnlyISO(d) {
  // YYYY-MM-DD from Date
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function parseYmd(s) {
  // strict-ish YYYY-MM-DD
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map((x) => parseInt(x, 10));
  const dt = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
  // validate
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return dt;
}
function addDaysUTC(dt, days) {
  return new Date(dt.getTime() + days * 24 * 60 * 60 * 1000);
}
function addHoursUTC(dt, hours) {
  return new Date(dt.getTime() + hours * 60 * 60 * 1000);
}
function round2(x) {
  return Math.round(x * 100) / 100;
}

/** -----------------------------
 *  Auth (from doc)
 *  ----------------------------- */
const TOKENS = {
  accessToken: "mock_access_token",
  refreshToken: "mock_refresh_token",
  expiresIn: 3600
};

function authGuard(req, res, next) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Yetkisiz erişim" }
    });
  }
  next();
}

/** -----------------------------
 *  Large dataset generation
 *  ----------------------------- */
const TERMINALS_COUNT = clamp(parseInt(process.env.TERMINALS_COUNT || "1000", 10) || 1000, 1, 20000);
const TRANSACTIONS_COUNT = clamp(parseInt(process.env.TRANSACTIONS_COUNT || "10000", 10) || 10000, 100, 200000);
const NOTIFICATIONS_COUNT = clamp(parseInt(process.env.NOTIFICATIONS_COUNT || "2000", 10) || 2000, 10, 50000);
const TEAM_COUNT = clamp(parseInt(process.env.TEAM_COUNT || "50", 10) || 50, 1, 5000);

const MODELS = ["Paymore Pro X1", "Paymore Lite", "Paymore Pro X2"];
const LOCATIONS = [
  "Kasa 1 - Giriş",
  "Kasa 2 - Merkez",
  "Kasa 3 - Çıkış",
  "Kasa 4 - Üst Kat",
  "Kasa 5 - Depo",
  "Kasa 6 - Self Checkout",
  "Kasa 7 - Danışma"
];
const FW = ["2.3.8", "2.4.0", "2.4.1", "2.4.2", "2.5.0"];
const PROVIDERS = ["Turkcell", "Vodafone", "Türk Telekom", "Local"];
const CONNECTIONS = ["4G", "WiFi"];
const CURRENCIES = ["TRY"];
const TX_TYPES = ["SALE", "REFUND"];
const TX_STATUS = ["SUCCESS", "FAILED"];
const CARD_TYPES = ["CREDIT", "DEBIT"];
const PAY_METHODS = [
  { method: "CREDIT_CARD", displayName: "Kredi Kartı" },
  { method: "DEBIT_CARD", displayName: "Banka Kartı" },
  { method: "CONTACTLESS", displayName: "Temassız" },
  { method: "QR", displayName: "QR" }
];

function terminalStatusByIndex(i) {
  // distribute ACTIVE/INACTIVE/MAINTENANCE
  if ((i + 1) % 19 === 0) return "MAINTENANCE";
  if ((i + 1) % 11 === 0) return "INACTIVE";
  return "ACTIVE";
}

const terminals = [];
for (let i = 0; i < TERMINALS_COUNT; i++) {
  const idx = i + 1;
  const id = `term_${pad(idx, 4)}`;
  const status = terminalStatusByIndex(i);
  const model = pick(MODELS);
  const dailyTransactions = status === "ACTIVE" ? Math.floor(rand() * 250) : status === "INACTIVE" ? Math.floor(rand() * 10) : 0;
  const dailySales = status === "ACTIVE" ? round2(dailyTransactions * (30 + rand() * 300)) : 0;

  terminals.push({
    id,
    name: `Terminal ${pad(idx, 4)}`,
    serialNumber: `PAY-2024-T${pad(idx, 4)}`,
    model,
    status,
    location: pick(LOCATIONS),
    lastTransaction: status === "ACTIVE" ? isoDaysAgo(Math.floor(rand() * 2)) : isoDaysAgo(2 + Math.floor(rand() * 14)),
    dailyTransactions,
    dailySales,
    battery: status === "ACTIVE" ? clamp(Math.floor(rand() * 101), 10, 100) : 0,
    signalStrength: status === "ACTIVE" ? clamp(Math.floor(rand() * 101), 10, 100) : 0,
    firmwareVersion: pick(FW),
    activationDate: new Date(Date.UTC(2024, 0, 1 + (idx % 250))).toISOString()
  });
}

// Transactions (10k) — keep lightweight + fields required by dashboard/recent/stats
let txnCounter = 100000;
const transactions = new Array(TRANSACTIONS_COUNT);
for (let i = 0; i < TRANSACTIONS_COUNT; i++) {
  txnCounter++;
  const t = terminals[Math.floor(rand() * terminals.length)];
  const amount = round2(5 + rand() * 8000);
  const type = rand() < 0.86 ? "SALE" : "REFUND";
  const status = rand() < 0.93 ? "SUCCESS" : "FAILED";
  const daysAgo = Math.floor(rand() * 60); // last 60 days
  const ts = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 - Math.floor(rand() * 24) * 60 * 60 * 1000);
  const maskedCardNumber = `****${1000 + Math.floor(rand() * 9000)}`;

  transactions[i] = {
    id: `txn_${txnCounter}`,
    terminalId: t.id,
    terminalName: t.name,
    amount,
    currency: pick(CURRENCIES),
    type,
    status,
    timestamp: ts.toISOString(),
    cardType: pick(CARD_TYPES),
    maskedCardNumber,
    // extra internal classification to drive payment-method stats
    _paymentMethod: pick(PAY_METHODS).method
  };
}

// Notifications
let notifCounter = 1;
const notifications = new Array(NOTIFICATIONS_COUNT);
for (let i = 0; i < NOTIFICATIONS_COUNT; i++) {
  notifCounter++;
  const t = terminals[Math.floor(rand() * terminals.length)];
  const tx = transactions[Math.floor(rand() * transactions.length)];
  const kind = pick(["TRANSACTION", "TERMINAL_STATUS", "SYSTEM"]);
  const isRead = rand() < 0.6;
  const createdAt = isoDaysAgo(Math.floor(rand() * 30));
  const priority = pick(["LOW", "MEDIUM", "HIGH"]);

  const base = {
    id: `notif_${pad(notifCounter, 5)}`,
    type: kind,
    title:
      kind === "TRANSACTION" ? "Yüksek Tutarlı İşlem" : kind === "TERMINAL_STATUS" ? "Terminal Bağlantı Sorunu" : "Sistem Bildirimi",
    message:
      kind === "TRANSACTION"
        ? `${t.name}'de yüksek tutarlı işlem`
        : kind === "TERMINAL_STATUS"
          ? `${t.name} bağlantısı kesildi`
          : "Planlı bakım bildirimi",
    isRead,
    createdAt,
    priority
  };

  if (kind === "TRANSACTION") {
    base.metadata = { terminalId: t.id, transactionId: tx.id, amount: round2(5000 + rand() * 5000) };
  } else if (kind === "TERMINAL_STATUS") {
    base.metadata = { terminalId: t.id };
  }

  notifications[i] = base;
}

// Merchant profile + team
const merchantProfile = {
  merchantId: "PM-2024-MER-001",
  businessName: "Paymore Demo Mağaza",
  contactPerson: "Ahmet Yılmaz",
  email: "info@paymoredemo.com",
  phone: "+90 532 123 4567",
  address: "Maslak Mahallesi, Büyükdere Cad. No:123 Sarıyer/İstanbul",
  activeTerminals: terminals.filter((x) => x.status === "ACTIVE").length,
  totalTerminals: terminals.length,
  registrationDate: "2024-01-15T00:00:00Z",
  status: "ACTIVE",
  taxId: "1234567890",
  businessType: "RETAIL"
};

const ROLES = ["Admin", "Manager", "Operator"];
let userCounter = 1;
const team = [];
for (let i = 0; i < TEAM_COUNT; i++) {
  userCounter++;
  team.push({
    id: `usr_${pad(userCounter, 6)}`,
    name: `Kullanıcı ${pad(userCounter, 3)}`,
    email: `user${userCounter}@paymoredemo.com`,
    role: pick(ROLES),
    status: rand() < 0.85 ? "ACTIVE" : "INACTIVE",
    createdAt: isoDaysAgo(30 + Math.floor(rand() * 365)),
    lastLogin: isoDaysAgo(Math.floor(rand() * 30))
  });
}

// Reports (generated on demand)
const reports = new Map(); // reportId -> report object
let reportCounter = 1000;

/** -----------------------------
 *  Error helper
 *  ----------------------------- */
function validationError(res, message = "Doğrulama hatası") {
  return res.status(400).json({
    success: false,
    error: { code: "VALIDATION_ERROR", message }
  });
}

/** -----------------------------
 *  1) AUTH
 *  ----------------------------- */

// POST /auth/login
app.post("/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  if (email === "info@paymoredemo.com" && typeof password === "string" && password.length > 0) {
    return res.json({
      success: true,
      data: {
        user: {
          id: "usr_123456",
          name: "Ahmet Yılmaz",
          email,
          merchantId: "PM-2024-MER-001",
          role: "Admin"
        },
        tokens: TOKENS
      }
    });
  }
  return res.status(401).json({
    success: false,
    error: { code: "INVALID_CREDENTIALS", message: "E-posta veya şifre hatalı" }
  });
});

// POST /auth/refresh
app.post("/auth/refresh", (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken || typeof refreshToken !== "string") return validationError(res, "refreshToken gerekli");
  // Always succeed for mock
  return res.json({
    success: true,
    data: {
      tokens: {
        accessToken: "mock_access_token_" + Math.floor(rand() * 1e9),
        refreshToken: "mock_refresh_token_" + Math.floor(rand() * 1e9),
        expiresIn: 3600
      }
    }
  });
});

// POST /auth/logout
app.post("/auth/logout", authGuard, (req, res) => {
  return res.json({ success: true, message: "Çıkış yapıldı" });
});

/** -----------------------------
 *  2) DASHBOARD
 *  ----------------------------- */

// GET /dashboard/stats?date=YYYY-MM-DD&period=daily|weekly|monthly
app.get("/dashboard/stats", authGuard, (req, res) => {
  const period = String(req.query.period || "daily").toLowerCase();
  const dateStr = req.query.date ? String(req.query.date) : null;

  const baseDate = dateStr ? parseYmd(dateStr) : new Date(); // today UTC
  if (dateStr && !baseDate) return validationError(res, "date formatı YYYY-MM-DD olmalı");

  let days = 1;
  if (period === "weekly") days = 7;
  else if (period === "monthly") days = 30;

  const end = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate(), 23, 59, 59));
  const start = new Date(end.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - (days - 1) * 24 * 60 * 60 * 1000);

  function sumInRange(a, b) {
    let totalSales = 0;
    let totalTx = 0;
    for (const tx of transactions) {
      const t = new Date(tx.timestamp).getTime();
      if (t >= a.getTime() && t <= b.getTime() && tx.status === "SUCCESS") {
        totalSales += tx.amount;
        totalTx++;
      }
    }
    return { totalSales: round2(totalSales), totalTx };
  }

  const cur = sumInRange(start, end);
  const prev = sumInRange(prevStart, prevEnd);

  const avgCur = cur.totalTx > 0 ? round2(cur.totalSales / cur.totalTx) : 0;
  const avgPrev = prev.totalTx > 0 ? round2(prev.totalSales / prev.totalTx) : 0;

  const pct = (curVal, prevVal) => {
    if (prevVal === 0) return curVal === 0 ? 0 : 100;
    return round2(((curVal - prevVal) / prevVal) * 100);
  };

  const activeCount = terminals.filter((t) => t.status === "ACTIVE").length;
  const totalCount = terminals.length;

  return res.json({
    success: true,
    data: {
      dailySales: {
        value: cur.totalSales,
        currency: "TRY",
        change: pct(cur.totalSales, prev.totalSales),
        isPositive: cur.totalSales >= prev.totalSales
      },
      transactionCount: {
        value: cur.totalTx,
        change: pct(cur.totalTx, prev.totalTx),
        isPositive: cur.totalTx >= prev.totalTx
      },
      averageTransaction: {
        value: avgCur,
        currency: "TRY",
        change: pct(avgCur, avgPrev),
        isPositive: avgCur >= avgPrev
      },
      activeTerminals: {
        value: activeCount,
        total: totalCount,
        change: 0,
        isPositive: true
      }
    }
  });
});

// GET /dashboard/recent-transactions?limit&offset (limit max 50)
app.get("/dashboard/recent-transactions", authGuard, (req, res) => {
  const limit = clamp(parseInt(req.query.limit || "10", 10) || 10, 1, 50);
  const offset = clamp(parseInt(req.query.offset || "0", 10) || 0, 0, 1e9);

  const sorted = [...transactions].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  const page = sorted.slice(offset, offset + limit).map((t) => ({
    id: t.id,
    terminalId: t.terminalId,
    terminalName: t.terminalName,
    amount: t.amount,
    currency: t.currency,
    type: t.type,
    status: t.status,
    timestamp: t.timestamp,
    cardType: t.cardType,
    maskedCardNumber: t.maskedCardNumber
  }));

  return res.json({
    success: true,
    data: {
      transactions: page,
      pagination: {
        total: sorted.length,
        limit,
        offset,
        hasMore: offset + limit < sorted.length
      }
    }
  });
});

/** -----------------------------
 *  3) STATISTICS
 *  ----------------------------- */

// GET /statistics/transactions?startDate&endDate&groupBy=hour|day|week|month&terminalId?
app.get("/statistics/transactions", authGuard, (req, res) => {
  const { startDate, endDate } = req.query;
  const groupBy = String(req.query.groupBy || "day").toLowerCase();
  const terminalId = req.query.terminalId ? String(req.query.terminalId) : null;

  const s = parseYmd(String(startDate || ""));
  const e = parseYmd(String(endDate || ""));
  if (!s || !e) return validationError(res, "startDate ve endDate YYYY-MM-DD olmalı");
  if (e.getTime() < s.getTime()) return validationError(res, "endDate startDate'den küçük olamaz");

  const allowed = new Set(["hour", "day", "week", "month"]);
  if (!allowed.has(groupBy)) return validationError(res, "groupBy: hour|day|week|month");

  // range boundaries inclusive for days
  const rangeStart = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate(), 0, 0, 0));
  const rangeEnd = new Date(Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate(), 23, 59, 59));

  // Filter tx
  const filtered = [];
  for (const tx of transactions) {
    const tms = new Date(tx.timestamp).getTime();
    if (tms < rangeStart.getTime() || tms > rangeEnd.getTime()) continue;
    if (terminalId && tx.terminalId !== terminalId) continue;
    if (tx.status !== "SUCCESS") continue;
    filtered.push(tx);
  }

  let totalSales = 0;
  for (const tx of filtered) totalSales += tx.amount;
  const totalTransactions = filtered.length;
  const averageTransaction = totalTransactions ? round2(totalSales / totalTransactions) : 0;

  // Bucket function
  function keyFor(tx) {
    const d = new Date(tx.timestamp);
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth(); // 0-based
    const day = d.getUTCDate();
    const hour = d.getUTCHours();

    if (groupBy === "hour") {
      // YYYY-MM-DD HH:00
      return `${dateOnlyISO(d)}T${String(hour).padStart(2, "0")}:00`;
    }
    if (groupBy === "day") {
      return dateOnlyISO(d);
    }
    if (groupBy === "week") {
      // ISO-week approx: group by Monday of that week (UTC)
      const tmp = new Date(Date.UTC(y, m, day, 0, 0, 0));
      const dow = (tmp.getUTCDay() + 6) % 7; // Monday=0
      const monday = addDaysUTC(tmp, -dow);
      return dateOnlyISO(monday);
    }
    // month
    return `${y}-${String(m + 1).padStart(2, "0")}-01`;
  }

  const buckets = new Map(); // key -> {sales, transactions}
  for (const tx of filtered) {
    const k = keyFor(tx);
    if (!buckets.has(k)) buckets.set(k, { sales: 0, transactions: 0 });
    const b = buckets.get(k);
    b.sales += tx.amount;
    b.transactions += 1;
  }

  const chartData = Array.from(buckets.entries())
    .sort((a, b) => (a[0] > b[0] ? 1 : -1))
    .map(([date, v]) => ({
      date,
      sales: round2(v.sales),
      transactions: v.transactions,
      average: v.transactions ? round2(v.sales / v.transactions) : 0
    }));

  return res.json({
    success: true,
    data: {
      period: {
        startDate: String(startDate),
        endDate: String(endDate),
        groupBy
      },
      summary: {
        totalSales: round2(totalSales),
        totalTransactions,
        averageTransaction,
        currency: "TRY"
      },
      chartData
    }
  });
});

// GET /statistics/payment-methods?startDate&endDate
app.get("/statistics/payment-methods", authGuard, (req, res) => {
  const s = parseYmd(String(req.query.startDate || ""));
  const e = parseYmd(String(req.query.endDate || ""));
  if (!s || !e) return validationError(res, "startDate ve endDate YYYY-MM-DD olmalı");
  if (e.getTime() < s.getTime()) return validationError(res, "endDate startDate'den küçük olamaz");

  const rangeStart = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate(), 0, 0, 0));
  const rangeEnd = new Date(Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate(), 23, 59, 59));

  const agg = new Map(); // method -> {count, totalAmount}
  let totalCount = 0;

  for (const tx of transactions) {
    const tms = new Date(tx.timestamp).getTime();
    if (tms < rangeStart.getTime() || tms > rangeEnd.getTime()) continue;
    if (tx.status !== "SUCCESS") continue;

    totalCount++;
    const m = tx._paymentMethod || "CREDIT_CARD";
    if (!agg.has(m)) agg.set(m, { count: 0, totalAmount: 0 });
    const a = agg.get(m);
    a.count += 1;
    a.totalAmount += tx.amount;
  }

  const paymentMethods = PAY_METHODS.map((pm) => {
    const a = agg.get(pm.method) || { count: 0, totalAmount: 0 };
    const percentage = totalCount ? round2((a.count / totalCount) * 100) : 0;
    return {
      method: pm.method,
      displayName: pm.displayName,
      count: a.count,
      totalAmount: round2(a.totalAmount),
      percentage
    };
  }).filter((x) => x.count > 0 || totalCount === 0);

  return res.json({
    success: true,
    data: { paymentMethods }
  });
});

// GET /statistics/hourly?date=YYYY-MM-DD
app.get("/statistics/hourly", authGuard, (req, res) => {
  const d = parseYmd(String(req.query.date || ""));
  if (!d) return validationError(res, "date YYYY-MM-DD olmalı");

  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59));

  const hourly = Array.from({ length: 24 }, (_, h) => ({ hour: h, sales: 0, transactions: 0 }));

  for (const tx of transactions) {
    const t = new Date(tx.timestamp);
    const tms = t.getTime();
    if (tms < start.getTime() || tms > end.getTime()) continue;
    if (tx.status !== "SUCCESS") continue;

    const h = t.getUTCHours();
    hourly[h].sales += tx.amount;
    hourly[h].transactions += 1;
  }

  for (const x of hourly) x.sales = round2(x.sales);

  let peak = { hour: 0, sales: 0, transactions: 0 };
  for (const x of hourly) {
    if (x.sales > peak.sales) peak = { ...x };
  }

  return res.json({
    success: true,
    data: {
      date: String(req.query.date),
      hourlyData: hourly,
      peakHour: peak
    }
  });
});

/** -----------------------------
 *  4) TERMINALS
 *  ----------------------------- */

// GET /terminals?status=active|inactive|maintenance|all&limit&offset&search
app.get("/terminals", authGuard, (req, res) => {
  const statusQ = String(req.query.status || "all").toLowerCase();
  const search = String(req.query.search || "").trim().toLowerCase();
  const limit = clamp(parseInt(req.query.limit || "20", 10) || 20, 1, 200);
  const offset = clamp(parseInt(req.query.offset || "0", 10) || 0, 0, 1e9);

  let list = terminals;

  if (statusQ !== "all") {
    const map = { active: "ACTIVE", inactive: "INACTIVE", maintenance: "MAINTENANCE" };
    const s = map[statusQ];
    if (!s) return validationError(res, "status: active|inactive|maintenance|all");
    list = list.filter((t) => t.status === s);
  }

  if (search) {
    list = list.filter(
      (t) =>
        t.name.toLowerCase().includes(search) ||
        t.id.toLowerCase().includes(search) ||
        t.serialNumber.toLowerCase().includes(search)
    );
  }

  const summary = {
    total: terminals.length,
    active: terminals.filter((t) => t.status === "ACTIVE").length,
    inactive: terminals.filter((t) => t.status === "INACTIVE").length,
    maintenance: terminals.filter((t) => t.status === "MAINTENANCE").length
  };

  const page = list.slice(offset, offset + limit);

  return res.json({
    success: true,
    data: {
      terminals: page,
      pagination: { total: list.length, limit, offset, hasMore: offset + limit < list.length },
      summary
    }
  });
});

// GET /terminals/{terminalId}
app.get("/terminals/:terminalId", authGuard, (req, res) => {
  const id = req.params.terminalId;
  const t = terminals.find((x) => x.id === id);
  if (!t) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Terminal bulunamadı" } });
  }

  const isOnline = t.status === "ACTIVE";
  const provider = isOnline ? pick(PROVIDERS) : null;
  const connectionType = isOnline ? pick(CONNECTIONS) : "NONE";
  const ipAddress = isOnline ? `192.168.${Math.floor(rand() * 10)}.${Math.floor(rand() * 200) + 10}` : null;

  const recentTransactions = transactions
    .filter((x) => x.terminalId === id)
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
    .slice(0, 10)
    .map((x) => ({ id: x.id, amount: x.amount, type: x.type, status: x.status, timestamp: x.timestamp }));

  // statistics: today/week/month (approx)
  const today = new Date();
  const todayStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0));
  const todayEnd = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59));
  const weekStart = addDaysUTC(todayStart, -6);
  const monthStart = addDaysUTC(todayStart, -29);

  function statInRange(a, b) {
    let sales = 0, cnt = 0;
    for (const tx of transactions) {
      if (tx.terminalId !== id) continue;
      if (tx.status !== "SUCCESS") continue;
      const tms = new Date(tx.timestamp).getTime();
      if (tms < a.getTime() || tms > b.getTime()) continue;
      sales += tx.amount;
      cnt++;
    }
    return { transactions: cnt, sales: round2(sales) };
  }

  return res.json({
    success: true,
    data: {
      ...t,
      hardware: {
        manufacturer: "Paymore",
        model: t.model,
        serialNumber: t.serialNumber,
        imei: `1234567890${pad(Math.floor(rand() * 1000000), 6)}`
      },
      network: { connectionType, ipAddress, provider },
      recentTransactions,
      statistics: {
        today: statInRange(todayStart, todayEnd),
        week: statInRange(weekStart, todayEnd),
        month: statInRange(monthStart, todayEnd)
      }
    }
  });
});

// POST /terminals
app.post("/terminals", authGuard, (req, res) => {
  const { name, serialNumber, model, location, imei } = req.body || {};
  if (!name || !serialNumber || !model || !location || !imei) return validationError(res, "Eksik alan(lar)");

  const id = `term_${pad(terminals.length + 1, 4)}`;
  const activationCode = `ACT-${pad(Math.floor(rand() * 9000) + 1000, 4)}-${pad(Math.floor(rand() * 9000) + 1000, 4)}-${pad(
    Math.floor(rand() * 9000) + 1000,
    4
  )}`;

  const created = {
    id,
    name,
    serialNumber,
    model,
    status: "INACTIVE",
    location,
    activationDate: nowIso(),
    activationCode
  };

  // store as terminal list model (doc list fields)
  terminals.push({
    id: created.id,
    name: created.name,
    serialNumber: created.serialNumber,
    model: created.model,
    status: created.status,
    location: created.location,
    lastTransaction: isoDaysAgo(999),
    dailyTransactions: 0,
    dailySales: 0,
    battery: 0,
    signalStrength: 0,
    firmwareVersion: pick(FW),
    activationDate: created.activationDate
  });

  return res.status(201).json({
    success: true,
    data: created,
    message: "Terminal başarıyla eklendi"
  });
});

// PUT /terminals/{terminalId}
app.put("/terminals/:terminalId", authGuard, (req, res) => {
  const id = req.params.terminalId;
  const t = terminals.find((x) => x.id === id);
  if (!t) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Terminal bulunamadı" } });

  const { name, location, status } = req.body || {};
  if (name) t.name = name;
  if (location) t.location = location;
  if (status) t.status = String(status).toUpperCase();

  return res.json({
    success: true,
    data: { id: t.id, name: t.name, location: t.location, status: t.status, updatedAt: nowIso() },
    message: "Terminal başarıyla güncellendi"
  });
});

// DELETE /terminals/{terminalId}
app.delete("/terminals/:terminalId", authGuard, (req, res) => {
  const id = req.params.terminalId;
  const t = terminals.find((x) => x.id === id);
  if (!t) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Terminal bulunamadı" } });

  // soft delete -> INACTIVE
  t.status = "INACTIVE";
  return res.json({ success: true, message: "Terminal başarıyla silindi" });
});

// POST /terminals/{terminalId}/restart
app.post("/terminals/:terminalId/restart", authGuard, (req, res) => {
  const id = req.params.terminalId;
  const t = terminals.find((x) => x.id === id);
  if (!t) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Terminal bulunamadı" } });

  if (t.status !== "ACTIVE") {
    return res.status(409).json({ success: false, error: { code: "TERMINAL_OFFLINE", message: "Terminal çevrimdışı" } });
  }

  return res.json({
    success: true,
    message: "Terminal yeniden başlatma komutu gönderildi",
    data: { commandId: `cmd_${pad(Math.floor(rand() * 900000) + 100000, 6)}`, status: "PENDING", sentAt: nowIso() }
  });
});

// POST /terminals/{terminalId}/update-firmware
app.post("/terminals/:terminalId/update-firmware", authGuard, (req, res) => {
  const id = req.params.terminalId;
  const t = terminals.find((x) => x.id === id);
  if (!t) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Terminal bulunamadı" } });

  const { version } = req.body || {};
  if (!version) return validationError(res, "version gerekli");

  const currentVersion = t.firmwareVersion;
  t.firmwareVersion = String(version);

  return res.json({
    success: true,
    message: "Firmware güncelleme başlatıldı",
    data: {
      currentVersion,
      targetVersion: String(version),
      updateId: `upd_${pad(Math.floor(rand() * 900000) + 100000, 6)}`,
      estimatedTime: 300
    }
  });
});

/** -----------------------------
 *  5) PROFILE
 *  ----------------------------- */

// GET /profile/merchant
app.get("/profile/merchant", authGuard, (req, res) => {
  return res.json({ success: true, data: merchantProfile });
});

// PUT /profile/merchant
app.put("/profile/merchant", authGuard, (req, res) => {
  const patch = req.body || {};
  // allow updates of known fields
  const allowed = ["businessName", "contactPerson", "email", "phone", "address", "taxId", "businessType"];
  for (const k of allowed) {
    if (patch[k] !== undefined) merchantProfile[k] = patch[k];
  }
  return res.json({ success: true, data: merchantProfile, message: "Profil güncellendi" });
});

// POST /profile/change-password
app.post("/profile/change-password", authGuard, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) return validationError(res, "currentPassword ve newPassword gerekli");
  return res.json({ success: true, message: "Şifre güncellendi" });
});

// GET /profile/team
app.get("/profile/team", authGuard, (req, res) => {
  return res.json({ success: true, data: { teamMembers: team } });
});

// POST /profile/team
app.post("/profile/team", authGuard, (req, res) => {
  const { name, email, role } = req.body || {};
  if (!name || !email || !role) return validationError(res, "name, email, role gerekli");
  const id = `usr_${pad(100000 + team.length + 1, 6)}`;
  const created = { id, name, email, role, status: "ACTIVE", createdAt: nowIso(), lastLogin: null };
  team.push(created);
  return res.status(201).json({ success: true, data: created, message: "Ekip üyesi eklendi" });
});

// PUT /profile/team/{userId}
app.put("/profile/team/:userId", authGuard, (req, res) => {
  const u = team.find((x) => x.id === req.params.userId);
  if (!u) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Kullanıcı bulunamadı" } });

  const { name, role, status } = req.body || {};
  if (name) u.name = name;
  if (role) u.role = role;
  if (status) u.status = status;

  return res.json({ success: true, data: u, message: "Ekip üyesi güncellendi" });
});

// DELETE /profile/team/{userId}
app.delete("/profile/team/:userId", authGuard, (req, res) => {
  const idx = team.findIndex((x) => x.id === req.params.userId);
  if (idx < 0) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Kullanıcı bulunamadı" } });
  team.splice(idx, 1);
  return res.json({ success: true, message: "Ekip üyesi silindi" });
});

/** -----------------------------
 *  6) NOTIFICATIONS
 *  ----------------------------- */

// GET /notifications?limit&offset&unreadOnly=true|false
app.get("/notifications", authGuard, (req, res) => {
  const limit = clamp(parseInt(req.query.limit || "20", 10) || 20, 1, 200);
  const offset = clamp(parseInt(req.query.offset || "0", 10) || 0, 0, 1e9);
  const unreadOnly = String(req.query.unreadOnly || "false").toLowerCase() === "true";

  let list = notifications;
  if (unreadOnly) list = list.filter((n) => n.isRead === false);

  // newest first
  const sorted = [...list].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const page = sorted.slice(offset, offset + limit);

  return res.json({
    success: true,
    data: {
      notifications: page,
      pagination: { total: sorted.length, limit, offset, hasMore: offset + limit < sorted.length }
    }
  });
});

// PUT /notifications/{notificationId}/read
app.put("/notifications/:notificationId/read", authGuard, (req, res) => {
  const n = notifications.find((x) => x.id === req.params.notificationId);
  if (!n) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Bildirim bulunamadı" } });
  n.isRead = true;
  return res.json({ success: true, message: "Bildirim okundu", data: n });
});

// PUT /notifications/read-all
app.put("/notifications/read-all", authGuard, (req, res) => {
  for (const n of notifications) n.isRead = true;
  return res.json({ success: true, message: "Tüm bildirimler okundu" });
});

/** -----------------------------
 *  7) REPORTS
 *  ----------------------------- */

// POST /reports/generate
app.post("/reports/generate", authGuard, (req, res) => {
  const { type, format, startDate, endDate, filters } = req.body || {};
  if (!type || !format || !startDate || !endDate) return validationError(res, "type, format, startDate, endDate gerekli");
  const s = parseYmd(String(startDate));
  const e = parseYmd(String(endDate));
  if (!s || !e) return validationError(res, "startDate/endDate YYYY-MM-DD olmalı");

  reportCounter++;
  const reportId = `rep_${reportCounter}`;
  const createdAt = nowIso();
  const estimatedTime = 30;

  const report = {
    reportId,
    type,
    format,
    status: "PROCESSING",
    createdAt,
    estimatedTime,
    _createdAtMs: Date.now(),
    _filters: filters || null,
    _range: { startDate, endDate }
  };
  reports.set(reportId, report);

  return res.json({
    success: true,
    data: { reportId, status: "PROCESSING", estimatedTime, createdAt },
    message: "Rapor oluşturuluyor"
  });
});

// GET /reports/{reportId}
app.get("/reports/:reportId", authGuard, (req, res) => {
  const reportId = req.params.reportId;
  const r = reports.get(reportId);
  if (!r) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Rapor bulunamadı" } });

  // auto-complete after ~45s
  const elapsed = (Date.now() - r._createdAtMs) / 1000;
  if (r.status === "PROCESSING" && elapsed >= 45) {
    r.status = "COMPLETED";
    r.completedAt = nowIso();
    r.downloadUrl = `https://api.paymore.com/v1/reports/${reportId}/download`;
    r.expiresAt = isoDaysAgo(-7); // +7 days
  }

  return res.json({
    success: true,
    data: {
      reportId: r.reportId,
      type: r.type,
      format: r.format,
      status: r.status,
      downloadUrl: r.status === "COMPLETED" ? r.downloadUrl : undefined,
      expiresAt: r.status === "COMPLETED" ? r.expiresAt : undefined,
      createdAt: r.createdAt,
      completedAt: r.status === "COMPLETED" ? r.completedAt : undefined
    }
  });
});

/** -----------------------------
 *  Health
 *  ----------------------------- */
app.get("/health", (req, res) => res.json({ ok: true }));

const port = parseInt(process.env.PORT || "3001", 10);
app.listen(port, () => {
  console.log(`Paymore Mock API running on :${port}`);
  console.log(`Seed=${SEED} terminals=${TERMINALS_COUNT} tx=${TRANSACTIONS_COUNT} notif=${NOTIFICATIONS_COUNT} team=${TEAM_COUNT}`);
});