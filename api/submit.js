import { put } from "@vercel/blob";
import { kv } from "@vercel/kv";

export const config = {
  api: {
    bodyParser: true
  }
};

const MAX_WINNERS = 50;
const WIN_PROBABILITY = 0.1;

export default async function handler(req, res) {
  // CORS
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

    let wonChocolate = false;

    const currentWinners =
      (await kv.get("chocolate_winner_count")) || 0;

    if (currentWinners < MAX_WINNERS) {
      const randomWin = Math.random() < WIN_PROBABILITY;

      if (randomWin) {
        await kv.incr("chocolate_winner_count");
        wonChocolate = true;
      }
    }

    const filename = `keystrokes/${data.username}_${Date.now()}.json`;

    const blob = await put(
      filename,
      JSON.stringify(
        {
          ...data,
          wonChocolate
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
      wonChocolate
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
