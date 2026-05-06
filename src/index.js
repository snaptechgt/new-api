import createError from "http-errors";
import express from "express";
import path from "path";
import indexRouter from "./routes.js";

const app = express();

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

// CORS configuration - must be before auth middleware
import cors from "cors";
const corsOptions = {
  origin: ['http://localhost:5173', 'https://new-api-r82n.onrender.com', 'https://cfb-proyecta.onrender.com'],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight requests

// Basic Auth Middleware
const ACCESS_KEY = process.env.ACCESS_KEY || "Cfb123";

function requireAuth(req, res, next) {
  // Skip auth for GET / and OPTIONS requests
  if (req.method === 'OPTIONS') {
    return next();
  }
  
  if (req.method === 'GET' && req.path === '/') {
    return next();
  }
  
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Upload API"');
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, key] = credentials.split(':');
  
  if (key !== ACCESS_KEY) {
    return res.status(403).json({ error: "Forbidden: Invalid key" });
  }
  
  next();
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(path.dirname(new URL(import.meta.url).pathname), "public")));

// Apply auth to all routes except GET / and OPTIONS
app.use((req, res, next) => {
  if (req.method === 'GET' && req.path === '/') {
    return next();
  }
  if (req.method === 'OPTIONS') {
    return next();
  }
  requireAuth(req, res, next);
});

app.use("/", indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`> Server listening on port ${port}`);
});
