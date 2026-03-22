/**
 * app.js – Express application (no listen) for testing
 */
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/dashboard", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "dashboard.html"))
);
app.get("/seller/:id", (req, res) =>
  res.redirect(`/seller.html?seller_id=${encodeURIComponent(req.params.id)}`)
);
app.get("/seller", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "seller.html"))
);

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
app.use("/", authRoutes);
app.use("/", productRoutes);

app.get("/_health", (req, res) =>
  res.json({ ok: true, uptime: process.uptime() })
);

module.exports = app;
