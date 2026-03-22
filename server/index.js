const path = require("path");
// Load server/.env into process.env (stable path even if node is started from another cwd).
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");

const hotelsRouter = require("./routes/hotels");
const translateRouter = require("./routes/translate");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/hotels", hotelsRouter);
app.use("/api/translate", translateRouter);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

