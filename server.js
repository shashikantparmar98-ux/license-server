const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// 🔑 Dummy database
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

// 🔍 Verify API
app.post("/verify", (req, res) => {
  const { key, deviceId } = req.body;

  const found = keys.find(k => k.key === key);

  if (!found) {
    return res.json({ success: false, message: "Invalid key" });
  }

  if (!found.used) {
    found.used = true;
    found.deviceId = deviceId;
    return res.json({ success: true });
  }

  if (found.deviceId === deviceId) {
    return res.json({ success: true });
  }

  return res.json({
    success: false,
    message: "Key already used on another device"
  });
});

// 🔥 Generate API
app.get("/generate", (req, res) => {
  const newKey = generateKey();

  keys.push({
    key: newKey,
    used: false,
    deviceId: null
  });

  res.json({ key: newKey });
});

// ✅ Homepage route (NEW)
app.get("/", (req, res) => {
  res.send("License Server Running ✅");
});

// 🚀 Start server (ALWAYS LAST)
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});