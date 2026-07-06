const express = require("express");
const cors = require("cors");

const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test PostgreSQL connection
pool.connect()
  .then(client => {
    console.log("✅ Connected to PostgreSQL");
    client.release();
  })
  .catch(err => {
    console.error("❌ PostgreSQL connection failed:", err);
  });




async function addKeyToDB(key) {
  await pool.query(
    "INSERT INTO licenses (license_key) VALUES ($1)",
    [key]
  );
}

async function activateKeyInDB(key, deviceId) {
  await pool.query(
    `UPDATE licenses
     SET used = TRUE,
         device_id = $1
     WHERE license_key = $2`,
    [deviceId, key]
  );
}

async function getLicense(key) {
  const result = await pool.query(
    "SELECT * FROM licenses WHERE license_key = $1",
    [key]
  );

  return result.rows[0];
}

// 🔐 ADMIN SECRET (CHANGE THIS!)
const ADMIN_KEY = "SHASHIKANT_SUPER_SECRET_555";


// 🔥 Key Generator
function generateKey() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  function part() {
    return Array.from({ length: 4 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");
  }

  return `${part()}-${part()}-${part()}-${part()}`;
}

// ✅ ACTIVATE API (SIMPLE VERSION)
app.post("/activate", async (req, res) => {
  const { key, deviceId } = req.body;

if (!deviceId) {
  return res.json({
    success: false,
    message: "Device ID missing."
  });
}
  const found = await getLicense(key);

  if (!found) {
    return res.json({ success: false, message: "Invalid key" });
  }

if (!found.used) {

  await activateKeyInDB(key, deviceId);

  

  return res.json({
    success: true
  });
}

// 🔹 Same computer
if (found.device_id === deviceId) {
  return res.json({
    success: true
  });
}

// 🔹 Different computer
return res.json({
  success: false,
  message: "This license is already activated on another computer."
});
});

// 🔐 SECURE GENERATE API (ADMIN ONLY)
app.get("/generate", async (req, res) => {
  const admin = req.query.admin;

  if (admin !== ADMIN_KEY) {
    return res.status(403).json({
      success: false,
      message: "Unauthorized ❌"
    });
  }

  const newKey = generateKey();

await addKeyToDB(newKey);


console.log("🆕 New key generated:", newKey);
  res.json({
    success: true,
    key: newKey
  });
});

// ✅ Homepage
app.get("/", (req, res) => {
  res.send("License Server Running ✅");
});

// 🚀 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});