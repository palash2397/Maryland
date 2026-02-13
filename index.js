import express from "express";
import morgan from "morgan";
import core from "cors";
import "dotenv/config.js";

import { connectDB } from "./DB/config.js";

import path from "path";
import { fileURLToPath } from "url";
import rootRouter from "./routes/root.routes.js";

// ✅ Path & App Setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT;

// ✅ Database Connection
connectDB();

// ✅ Middlewares
import { stripeWebhookHandle } from "./controllers/student/payment.controller.js";
app.use(
  "/api/v1/stripe/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhookHandle,
);

app.use(
  core({
    origin: "*",
    credentials: true,
  }),
);


app.use(express.json()); // Parse JSON body
app.use(express.urlencoded({ extended: true })); // Parse form data
app.use(morgan("dev")); // HTTP logger

// ✅ Routes
app.use("/api/v1", rootRouter);

// ✅ Static files
app.use(express.static(path.join(__dirname, "public")));
app.use("/api/v1", express.static("public"));

// ✅ View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "view"));

app.get("/api", (req, res) => {
  res.send("Welcome to Maryland University");
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
