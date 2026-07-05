
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// 📄 License database file
const LICENSE_FILE = path.join(__dirname, "licenses.json");

// 📖 Load licenses from file
function loadKeys() {
  return JSON.parse(fs.readFileSync(LICENSE_FILE, "utf8"));
}

// 💾 Save licenses to file
function saveKeys(keys) {
  fs.writeFileSync(LICENSE_FILE, JSON.stringify(keys, null, 2));
}

// 🔐 ADMIN SECRET (CHANGE THIS!)
const ADMIN_KEY = "SHASHIKANT_SUPER_SECRET_555";

// 🔑 In-memory database (simple version)
let keys = loadKeys();

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
app.post("/activate", (req, res) => {
  const { key, deviceId } = req.body;
if (!deviceId) {
  return res.json({
    success: false,
    message: "Device ID missing."
  });
}
  const found = keys.find(k => k.key === key);

  if (!found) {
    return res.json({ success: false, message: "Invalid key" });
  }

// 🔹 First activation
if (!found.used) {
  found.used = true;
  found.deviceId = deviceId;

  saveKeys(keys);   // 💾 Save changes

  return res.json({
    success: true
  });
}

// 🔹 Same computer
if (found.deviceId === deviceId) {
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

saveKeys(keys);   // 💾 Save changes

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
