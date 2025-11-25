// index.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());

// allow large JSON bodies (base64 image)
app.use(express.json({ limit: "15mb" }));

const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URL) {
  console.error("❌ ERROR: MONGO_URL not found in .env file");
  process.exit(1);
}

mongoose
  .connect(MONGO_URL, { dbName: "tvt_db" })
  .then(() => console.log("🔥 MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

/* ---------------- USER SCHEMA ------------------ */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

/* --------------- PAYMENT SCHEMA ---------------- */
const paymentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    planTitle: { type: String, required: true },
    amount: { type: Number, required: true },
    screenshotBase64: { type: String, required: true },
    issueType: { type: String }, // optional
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);

/* ------------------- ROUTES -------------------- */

// POST /register
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
    console.error("Register error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /users
app.get("/users", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return res.json(users);
  } catch (err) {
    console.error("Users error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /payment-proof
app.post("/payment-proof", async (req, res) => {
  try {
    console.log("📩 /payment-proof body:", req.body);

    const { name, phone, planTitle, amount, screenshotBase64, issueType } =
      req.body;

    // be strict about undefined/null/empty string, NOT on 0
    if (
      !name ||
      !phone ||
      !planTitle ||
      screenshotBase64 === undefined ||
      screenshotBase64 === null ||
      screenshotBase64 === "" ||
      amount === undefined ||
      amount === null
    ) {
      return res.status(400).json({
        error: "name, phone, planTitle, amount, screenshotBase64 required",
      });
    }

    const payment = await Payment.create({
      name,
      phone,
      planTitle,
      amount,
      screenshotBase64,
      issueType,
    });

    console.log("✅ Payment stored:", payment._id.toString());

    return res.json({ success: true, payment });
  } catch (err) {
    console.error("Payment-proof error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /payments
app.get("/payments", async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    return res.json(payments);
  } catch (err) {
    console.error("Payments error:", err);
    return res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
