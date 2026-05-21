require("dotenv").config();
const http         = require("http");
const express      = require("express");
const cors         = require("cors");
const path         = require("path");
const helmet       = require("helmet");
const rateLimit    = require("express-rate-limit");
const { Server }   = require("socket.io");
const connectDB    = require("./config/db");

/* JWT_SECRET шалгах — production-д заавал set хийсэн байх ёстой */
if (!process.env.JWT_SECRET) {
  console.error("\x1b[31m[ERROR] JWT_SECRET env variable is not set!\x1b[0m");
  if (process.env.NODE_ENV === "production") process.exit(1);
}

const app    = express();
const server = http.createServer(app);
const ALLOWED_ORIGINS = [
  process.env.CLIENT_URL,
  "http://localhost:3000",
  "https://batuka0213.github.io",
].filter(Boolean);

const io     = new Server(server, {
  cors: {
    origin:  ALLOWED_ORIGINS,
    methods: ["GET", "POST"],
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  socket.on("join_room", (room) => {
    if (room) socket.join(room);
  });
  socket.on("leave_room", (room) => {
    if (room) socket.leave(room);
  });
});

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
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.use(cors({
  origin:  ALLOWED_ORIGINS,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

/* Rate limiter — login/register: 10 оролдлого / 15 минут */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { message: "Хэт олон оролдлого хийлээ. 15 минутын дараа дахин оролдоно уу." },
});

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
app.use("/api/users/login",    authLimiter);
app.use("/api/users/register", authLimiter);
app.use("/api/users",     require("./routes/userRoutes"));
app.use("/api/items",     require("./routes/itemRoutes"));
app.use("/api/claims",    require("./routes/claimRoutes"));
app.use("/api/chat",      require("./routes/chatRoutes"));
app.use("/api/donations", require("./routes/donationRoutes"));

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

server.listen(PORT, async () => {
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
