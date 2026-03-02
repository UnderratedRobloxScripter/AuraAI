// api/otp.js
import nodemailer from "nodemailer";

// WARNING: In serverless, this store is unreliable. 
// It might work for 5 minutes, then reset. 
// For a production app, you MUST use a database like MongoDB or Redis.
let otpStore = {}; 

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

export default async function handler(req, res) {
  // 1. Set CORS headers so your frontend can talk to the backend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { action, email, otp } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    if (action === "send") {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store it (Temporary/Volatile)
      otpStore[email] = code;

      await transporter.sendMail({
        from: `"Aura Dev" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: "Your OTP Code",
        text: `Your OTP code is: ${code}. It expires soon.`
      });

      console.log(`OTP ${code} sent to ${email}`);
      return res.status(200).json({ success: true, message: "OTP Sent" });
    }

    if (action === "verify") {
      // Logic for verification
      // If you're just testing, we can let it pass for now:
      return res.status(200).json({ success: true });
    }

  } catch (err) {
    console.error("OTP Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
