import { put } from "@vercel/blob";

/* 🎟️ LOTTERY (pure, JSON-safe) */
function generateLottery() {
  return {
    isWinner: Math.random() < 0.1, // 10%
    lotteryNumber: Math.floor(100000 + Math.random() * 900000),
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

    const username = data.username.trim().toLowerCase();

    /* 🎟️ LOTTERY */
    const lottery = generateLottery();

    /* 📦 ONE FILE PER USER (OVERWRITE) */
    await put(
      `keystrokes/users/${username}.json`,
      JSON.stringify(
        {
          ...data,
          username,
          lottery
        },
        null,
        2
      ),
      {
        access: "public",
        contentType: "application/json"
      }
    );

    /* 🏆 IF WINNER → SEPARATE FILE */
    if (lottery.isWinner) {
      await put(
        `keystrokes/winners/${username}.json`,
        JSON.stringify(
          {
            ...data,
            username,
            lottery
          },
          null,
          2
        ),
        {
          access: "public",
          contentType: "application/json"
        }
      );
    }

    return res.status(200).json({
      success: true,
      wonLottery: lottery.isWinner
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
