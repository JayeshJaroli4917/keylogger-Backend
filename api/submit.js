import { put } from "@vercel/blob";

export const config = {
  api: {
    bodyParser: true
  }
};

export default async function handler(req, res) {
  // CORS (MANDATORY since frontend is on GitHub Pages)
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

    const filename = `keystrokes/${data.username}_${Date.now()}.json`;

    const blob = await put(
      filename,
      JSON.stringify(data, null, 2),
      {
        access: "private",
        contentType: "application/json"
      }
    );

    return res.status(200).json({
      success: true,
      url: blob.url
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
