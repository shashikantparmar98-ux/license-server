const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// 🔐 ADMIN SECRET (CHANGE THIS!)
const ADMIN_KEY = "SHASHIKANT_SUPER_SECRET_555";

// 🔑 In-memory database (for now)
let keys = [
  { key: "ABCD-1234-EFGH-5678", used: false, deviceId: null },
  { key: "WXYZ-9999-TEST-0001", used: false, deviceId: null }
];

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

app.post("/verify", (req, res) => {
  console.log("📩 Incoming Request:", req.body);

  const { key } = req.body;

  if (!key) {
    return res.json({ success: false, message: "Missing key" });
  }

  const found = keys.find(k => k.key === key);

  if (!found) {
    console.log("✘ Invalid key:", key);
    return res.json({ success: false, message: "Invalid key" });
  }

  // ✅ Allow any device (temporary)
  return res.json({ success: true });
});

  

  // ❌ Used on another device
  console.log("❌ Key already used on another device");

  return res.json({
    success: false,
    message: "Key already used on another device"
  });
});

// 🔐 SECURE GENERATE API (ADMIN ONLY)
app.get("/generate", (req, res) => {
  const admin = req.query.admin;

  if (admin !== ADMIN_KEY) {
    return res.status(403).json({
      success: false,
      message: "Unauthorized ❌"
    });
  }

  const newKey = generateKey();

  keys.push({
    key: newKey,
    used: false,
    deviceId: null
  });

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
