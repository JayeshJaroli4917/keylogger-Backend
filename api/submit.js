import { put } from "@vercel/blob";

/* 🎟️ LOTTERY (JSON SAFE) */
function generateLottery() {
  return {
    isWinner: Math.random() < 0.1,
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
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  /* ==================================
     🔍 CHECK USER (BEFORE TEST START)
     ================================== */
  if (req.method === "GET") {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({ error: "Username required" });
    }

    const normalized = username.trim().toLowerCase();

    // 👇 public blob URL pattern
    const blobUrl = `https://${process.env.VERCEL_BLOB_URL}/keystrokes/users/${normalized}.json`;

    try {
      const check = await fetch(blobUrl, { method: "HEAD" });

      if (check.ok) {
        return res.status(200).json({ exists: true });
      } else {
        return res.status(200).json({ exists: false });
      }

    } catch (err) {
      return res.status(200).json({ exists: false });
    }
  }

  /* ==================================
     📝 SUBMIT TEST
     ================================== */
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const data = req.body;

    if (!data || !data.username) {
      return res.status(400).json({ error: "Username required" });
    }

    const username = data.username.trim().toLowerCase();

    const lottery = generateLottery();

    /* 📦 SAVE USER DATA (ONE FILE PER USER) */
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

    /* 🏆 SAVE WINNER SEPARATELY */
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
