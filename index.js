import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config(); // Load .env file

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 Load MongoDB URL from .env
const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URL) {
  console.error("❌ ERROR: MONGO_URL not found in .env file");
  process.exit(1);
}

mongoose
  .connect(MONGO_URL, {
    dbName: "tvt_db",
  })
  .then(() => console.log("🔥 MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// User Schema
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

// ----------------------------------------------------
// POST /register → Save or Update User
// ----------------------------------------------------
app.post("/register", async (req, res) => {
  const { name, phone } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: "Name and phone required" });
  }

  try {
    const user = await User.findOneAndUpdate(
      { phone },
      { name, phone },
      { upsert: true, new: true }
    );

    return res.json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// GET /users → Fetch all users
// ----------------------------------------------------
app.get("/users", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
