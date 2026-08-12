const products = {
  1: { name: "Go‘shtli somsa", price: 8000 },
  2: { name: "Kartoshkali somsa", price: 6000 },
  3: { name: "Burger", price: 28000 },
  4: { name: "Lavash", price: 25000 },
  5: { name: "Hot-dog", price: 18000 },
  6: { name: "Fri", price: 15000 },
  7: { name: "Cola", price: 10000 }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed"
    });
  }

  try {
    const {
      customer,
      order_type,
      payment_method,
      items
    } = req.body;

    if (!customer?.name || !customer?.phone) {
      return res.status(400).json({
        ok: false,
        error: "Mijoz ma'lumotlari yetishmayapti"
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        ok: false,
        error: "Savatcha bo‘sh"
      });
    }

    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const product = products[item.id];

      if (
        !product ||
        !Number.isInteger(item.qty) ||
        item.qty < 1
      ) {
        return res.status(400).json({
          ok: false,
          error: "Buyurtmada xato mahsulot mavjud"
        });
      }

      const sum = product.price * item.qty;
      total += sum;

      orderItems.push({
        name: product.name,
        qty: item.qty,
        price: product.price,
        sum
      });
    }

    const orderId = "ORD-" + Date.now();

    const itemsText = orderItems
      .map(item =>
        `• ${item.name} × ${item.qty} — ${item.sum.toLocaleString("uz-UZ")} so‘m`
      )
      .join("\n");

    const typeText =
      order_type === "pickup"
        ? "🏪 Olib ketish"
        : "🚚 Yetkazib berish";

    const paymentText =
      payment_method === "card"
        ? "💳 Karta"
        : "💵 Naqd pul";

    const message = `
🆕 <b>YANGI BUYURTMA</b>

🆔 <b>${orderId}</b>

👤 <b>Mijoz:</b> ${escapeHtml(customer.name)}
📞 <b>Telefon:</b> ${escapeHtml(customer.phone)}

${typeText}
${customer.address
  ? `📍 <b>Manzil:</b> ${escapeHtml(customer.address)}`
  : ""}

💳 <b>To‘lov:</b> ${paymentText}

🛒 <b>Buyurtma:</b>
${itemsText}

💰 <b>JAMI: ${total.toLocaleString("uz-UZ")} so‘m</b>
`;

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "✅ Qabul qilish",
            callback_data: `accept:${orderId}`
          },
          {
            text: "❌ Rad etish",
            callback_data: `reject:${orderId}`
          }
        ]
      ]
    };

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: process.env.ADMIN_CHAT_ID,
          text: message,
          parse_mode: "HTML",
          reply_markup: keyboard
        })
      }
    );

    const telegramData = await telegramResponse.json();

    if (!telegramData.ok) {
      console.error("Telegram error:", telegramData);

      return res.status(500).json({
        ok: false,
        error: "Telegramga yuborishda xatolik"
      });
    }

    return res.status(200).json({
      ok: true,
      order_id: orderId
    });

  } catch (error) {
    console.error("Order error:", error);

    return res.status(500).json({
      ok: false,
      error: "Server xatosi"
    });
  }
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
