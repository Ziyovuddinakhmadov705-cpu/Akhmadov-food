export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false });
  }

  try {
    const update = req.body;

    if (!update.callback_query) {
      return res.status(200).json({ ok: true });
    }

    const callback = update.callback_query;
    const data = callback.data || "";

    const [action, orderId] = data.split(":");

    if (!orderId || !["accept", "reject"].includes(action)) {
      return res.status(400).json({
        ok: false,
        error: "Invalid callback"
      });
    }

    const status =
      action === "accept"
        ? "✅ QABUL QILINDI"
        : "❌ RAD ETILDI";

    const botToken = process.env.BOT_TOKEN;

    // Telegram tugmasidagi loading holatini olib tashlash
    await fetch(
      `https://api.telegram.org/bot${botToken}/answerCallbackQuery`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          callback_query_id: callback.id,
          text: status
        })
      }
    );

    // Admin xabaridagi tugmalarni olib tashlaymiz
    await fetch(
      `https://api.telegram.org/bot${botToken}/editMessageReplyMarkup`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: callback.message.chat.id,
          message_id: callback.message.message_id,
          reply_markup: {
            inline_keyboard: []
          }
        })
      }
    );

    // Xabar ostiga status qo‘shamiz
    const oldText = callback.message.text || "";

    await fetch(
      `https://api.telegram.org/bot${botToken}/editMessageText`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: callback.message.chat.id,
          message_id: callback.message.message_id,
          text: `${oldText}\n\n<b>STATUS: ${status}</b>`,
          parse_mode: "HTML"
        })
      }
    );

    return res.status(200).json({
      ok: true,
      status,
      order_id: orderId
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      ok: false,
      error: "Server error"
    });
  }
}
