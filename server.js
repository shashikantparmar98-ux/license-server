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

// 🎁 DEMO TRIAL TABLE
async function createDemoTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS demo_trials (
        device_id TEXT PRIMARY KEY,
        started_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    console.log("✅ Demo trials table ready");
  } catch (err) {
    console.error("❌ Failed to create demo_trials table:", err);
  }
}

createDemoTable();


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

// 🎁 DEMO TRIAL API
const DEMO_DURATION_MINUTES = 2; // TEST ONLY — change to 60 for final version

app.post("/demo", async (req, res) => {
  try {
    const { deviceId } = req.body;

    if (!deviceId) {
      return res.json({
        success: false,
        message: "Device ID missing."
      });
    }

    // Check whether this device has already started a demo
    const existing = await pool.query(
      "SELECT started_at FROM demo_trials WHERE device_id = $1",
      [deviceId]
    );

    // 🆕 First demo launch
    if (existing.rows.length === 0) {
      await pool.query(
        "INSERT INTO demo_trials (device_id) VALUES ($1)",
        [deviceId]
      );

      console.log("🎁 New demo started:", deviceId);

      return res.json({
        success: true,
        remainingSeconds: DEMO_DURATION_MINUTES * 60
      });
    }

    // ⏱️ Existing demo
    const result = await pool.query(
      `
      SELECT
        EXTRACT(EPOCH FROM (NOW() - started_at)) AS elapsed_seconds
      FROM demo_trials
      WHERE device_id = $1
      `,
      [deviceId]
    );

    const elapsedSeconds = Number(result.rows[0].elapsed_seconds);
    const totalSeconds = DEMO_DURATION_MINUTES * 60;
    const remainingSeconds = Math.max(
      0,
      totalSeconds - elapsedSeconds
    );

    // ❌ Demo expired
    if (remainingSeconds <= 0) {
      return res.json({
        success: false,
        expired: true,
        message: "Demo period has expired."
      });
    }

    // ✅ Demo still valid
    return res.json({
      success: true,
      remainingSeconds: Math.floor(remainingSeconds)
    });

  } catch (err) {
    console.error("❌ Demo API error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error."
    });
  }
});


// 🔐 ADMIN SECRET (CHANGE THIS!)
const ADMIN_KEY = process.env.ADMIN_KEY;

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
