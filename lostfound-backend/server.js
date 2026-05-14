require("dotenv").config();
const express   = require("express");
const cors      = require("cors");
const path      = require("path");
const connectDB = require("./config/db");

const app = express();

/* ══════════════════════════════════════════
   STARTUP BANNER
══════════════════════════════════════════ */
const c = { reset:"\x1b[0m", bold:"\x1b[1m", dim:"\x1b[2m", cyan:"\x1b[36m", green:"\x1b[32m", yellow:"\x1b[33m", magenta:"\x1b[35m", blue:"\x1b[34m" };
const banner = `
${c.cyan}${c.bold}  ╔══════════════════════════════════════════╗
  ║   🔍  Lost & Found  —  REST API  v2.0   ║
  ╚══════════════════════════════════════════╝${c.reset}
${c.dim}  Platform  : Node.js ${process.version}
  Framework  : Express 5
  Database   : MongoDB Atlas (Mongoose 9)
  Auth       : JWT + Google OAuth 2.0${c.reset}
`;

/* ══════════════════════════════════════════
   DATABASE
══════════════════════════════════════════ */
connectDB();

/* ══════════════════════════════════════════
   MIDDLEWARE
══════════════════════════════════════════ */
app.use(cors({
  origin:  process.env.CLIENT_URL || "*",
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* Request logger */
app.use((req, _, next) => {
  const ts  = new Date().toISOString().slice(11, 19);
  const col = req.method === "GET" ? c.green : req.method === "DELETE" ? c.yellow : c.cyan;
  console.log(`${c.dim}[${ts}]${c.reset} ${col}${req.method.padEnd(7)}${c.reset} ${req.path}`);
  next();
});

/* Static uploads */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ══════════════════════════════════════════
   ROUTES
══════════════════════════════════════════ */
app.use("/api/users",  require("./routes/userRoutes"));
app.use("/api/items",  require("./routes/itemRoutes"));
app.use("/api/claims", require("./routes/claimRoutes"));

/* Health-check */
app.get("/", (_, res) => res.json({
  status:  "ok",
  service: "Lost & Found API",
  version: "2.0.0",
  uptime:  `${Math.floor(process.uptime())}s`,
}));

/* 404 */
app.use((req, res) => {
  res.status(404).json({ message: `Route олдсонгүй: ${req.method} ${req.originalUrl}` });
});

/* Global error handler */
app.use((err, req, res, next) => {
  console.error(`${c.yellow}[ERROR]${c.reset}`, err.message);
  res.status(err.status || 500).json({ message: err.message || "Серверт алдаа гарлаа" });
});

/* ══════════════════════════════════════════
   START
══════════════════════════════════════════ */
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(banner);
  console.log(`${c.green}${c.bold}  ✔ Server:  http://localhost:${PORT}${c.reset}`);
  console.log(`${c.green}  ✔ API:     http://localhost:${PORT}/api${c.reset}\n`);

  /* Admin seed */
  try {
    const User = require("./models/User");
    const exists = await User.findOne({ email: "admin@gmail.com" });
    if (!exists) {
      await User.create({ name:"Admin", email:"admin@gmail.com", password:"Admin@123", role:"admin" });
      console.log(`${c.magenta}  ★ Admin хэрэглэгч үүсгэгдлээ  (admin@gmail.com / Admin@123)${c.reset}`);
    }
  } catch { /* admin seed fail нь critical биш */ }
});
