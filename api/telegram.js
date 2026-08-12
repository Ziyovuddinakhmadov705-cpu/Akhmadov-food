export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed"
    });
  }

  try {
    const update = req.body;

    // Oddiy Telegram update bo‘lsa
    if (!update?.callback_query) {
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

    if (!botToken) {
      return res.status(500).json({
        ok: false,
        error: "BOT_TOKEN topilmadi"
      });
    }

    // Telegramdagi tugma loading holatini olib tashlash
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

    const chatId = callback.message.chat.id;
    const messageId = callback.message.message_id;
    const oldText = callback.message.text || "";

    // Tugmalarni olib tashlash
    await fetch(
      `https://api.telegram.org/bot${botToken}/editMessageReplyMarkup`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          reply_markup: {
            inline_keyboard: []
          }
        })
      }
    );

    // Buyurtma xabariga status qo‘shish
    await fetch(
      `https://api.telegram.org/bot${botToken}/editMessageText`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text: `${oldText}\n\n<b>STATUS: ${status}</b>`,
          parse_mode: "HTML"
        })
      }
    );

    return res.status(200).json({
      ok: true,
      order_id: orderId,
      status: status
    });

  } catch (error) {
    console.error("Telegram webhook error:", error);

    return res.status(500).json({
      ok: false,
      error: "Server error"
    });
  }
}
