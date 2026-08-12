export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed"
    });
  }

  try {
    const token = process.env.BOT_TOKEN;

    if (!token) {
      return res.status(500).json({
        ok: false,
        error: "BOT_TOKEN topilmadi"
      });
    }

    const update = req.body;

    // Telegram tugmasi bosilganda keladigan callback
    if (update?.callback_query) {
      const callback = update.callback_query;

      const callbackId = callback.id;
      const data = callback.data || "";
      const message = callback.message;

      if (!message) {
        return res.status(200).json({ ok: true });
      }

      const chatId = message.chat.id;
      const messageId = message.message_id;

      /*
        callback_data format:
        accept_ORDERID_USERID
        reject_ORDERID_USERID
      */
      const parts = data.split("_");

      const action = parts[0];
      const orderId = parts[1];
      const customerId = parts[2];

      let statusText = "";

      if (action === "accept") {
        statusText = "✅ Buyurtma QABUL QILINDI";

        // Mijozga xabar
        if (customerId) {
          await sendMessage(
            token,
            customerId,
            `✅ <b>Buyurtmangiz qabul qilindi!</b>\n\nBuyurtma raqami: <b>#${orderId}</b>\n\nTez orada tayyorlanadi va yetkazib beriladi. 🚚`
          );
        }
      }

      if (action === "reject") {
        statusText = "❌ Buyurtma RAD ETILDI";

        // Mijozga xabar
        if (customerId) {
          await sendMessage(
            token,
            customerId,
            `❌ <b>Buyurtmangiz rad etildi.</b>\n\nBuyurtma raqami: <b>#${orderId}</b>\n\nIltimos, keyinroq qayta urinib ko‘ring.`
          );
        }
      }

      // Telegramdagi tugmani bosilgan deb belgilash
      await fetch(
        `https://api.telegram.org/bot${token}/answerCallbackQuery`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            callback_query_id: callbackId,
            text: statusText,
            show_alert: false
          })
        }
      );

      // Admin xabarini yangilash
      const oldText = message.text || "";

      const newText =
        oldText +
        `\n\n━━━━━━━━━━━━━━\n${statusText}`;

      await fetch(
        `https://api.telegram.org/bot${token}/editMessageText`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
            text: newText,
            parse_mode: "HTML"
          })
        }
      );

      return res.status(200).json({
        ok: true
      });
    }

    return res.status(200).json({
      ok: true
    });

  } catch (error) {
    console.error("Telegram webhook error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}


// Telegramga xabar yuborish
async function sendMessage(token, chatId, text) {
  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "HTML"
      })
    }
  );

  const result = await response.json();

  if (!result.ok) {
    console.error("Customer message error:", result);
  }

  return result;
}
