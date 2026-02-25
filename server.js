const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors()); // mobil testte CORS genelde sorun olmaz ama web için rahat
app.use(express.json());

const TOKENS = {
  accessToken: "mock_access_token",
  refreshToken: "mock_refresh_token",
  expiresIn: 3600
};

const terminals = [
  { id: "term_001", name: "Terminal 01", status: "ACTIVE", battery: 87 },
  { id: "term_002", name: "Terminal 02", status: "ACTIVE", battery: 45 },
  { id: "term_003", name: "Terminal 03", status: "MAINTENANCE", battery: 0 }
];

function authGuard(req, res, next) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Missing token" }});
  }
  next();
}

app.post("/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  if (email === "info@paymoredemo.com" && password) {
    return res.json({
      success: true,
      data: { user: { id: "usr_123456", role: "Admin", email }, tokens: TOKENS }
    });
  }
  return res.status(401).json({ success: false, error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials" }});
});

app.get("/terminals", authGuard, (req, res) => {
  const { status = "all", limit = "20", offset = "0" } = req.query;
  const lim = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const off = Math.max(0, parseInt(offset, 10) || 0);

  const filtered = status === "all"
    ? terminals
    : terminals.filter(t => t.status === String(status).toUpperCase());

  const page = filtered.slice(off, off + lim);

  res.json({
    success: true,
    data: {
      terminals: page,
      pagination: { total: filtered.length, limit: lim, offset: off, hasMore: off + lim < filtered.length }
    }
  });
});

app.get("/health", (req, res) => res.json({ ok: true }));

const port = process.env.PORT || 3001;
app.listen(port, () => console.log("Mock API listening on", port));