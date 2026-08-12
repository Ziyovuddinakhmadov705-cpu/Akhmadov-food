export default async function handler(req, res) {
  try {
    const token = process.env.BOT_TOKEN;

    if (!token) {
      return res.status(500).json({
        ok: false,
        error: "BOT_TOKEN topilmadi"
      });
    }

    const webhookUrl =
      "https://akhmadov-food.vercel.app/api/telegram";

    const response = await fetch(
      `https://api.telegram.org/bot${token}/setWebhook`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          url: webhookUrl
        })
      }
    );

    const data = await response.json();

    return res.status(response.ok ? 200 : 500).json(data);

  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}
