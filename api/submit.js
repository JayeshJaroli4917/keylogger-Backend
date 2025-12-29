import { put } from "@vercel/blob";

function generateLottery() {
  const win = Math.random() < 0.1;
  return {
    isWinner: win,
    prize: win ? "Chocolate" : null,
    lotteryNumber: Math.floor(100000 + Math.random() * 900000),
    generatedAt: new Date().toISOString()
  };
}

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

    const lottery = generateLottery();

    const filename = `keystrokes/${data.username}_${Date.now()}.json`;

    const blob = await put(
      filename,
      JSON.stringify(
        {
          ...data,
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

    return res.status(200).json({
      success: true,
      url: blob.url,
      lottery
    });

  } catch (err) {
    console.error("BACKEND ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
