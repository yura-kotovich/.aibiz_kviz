export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const data = await request.json();

    // Збираємо дані форми з максимальною міцністю на помилки
    const source = data.source || "Website";
    const name = data.name || data.client || "Не вказано";
    const email = data.email || data.emailTelegram || "Не вказано";
    const phone = data.phone || "Не вказано";
    const direction = data.direction || data.napriamok || "Не вказано";
    const experience = data.experience || data.dosvid || "Не вказано";
    const format = data.format || data.formatRozboru || "Не вказано";
    const comment = data.comment || data.message || "Не вказано";

    // Красивий текст для Telegram-каналу
    const msg = `
🤖 <b>НОВА ЗАЯВКА - AI-АУДИТ [${source.toUpperCase()}]</b>

👤 <b>Клієнт:</b> ${name}
📧 <b>Email/Telegram:</b> ${email}
📞 <b>Телефон:</b> ${phone}

🎯 <b>Напрямок ШІ:</b>
${direction}

📊 <b>Поточний досвід:</b>
${experience}

📞 <b>Бажаний формат:</b>
${format}

📝 <b>Коментар / Головне завдання:</b>
${comment}
    `.trim();

    // Отримувач листів (Пошта Юри)
    const myEmail = 'profirise@gmail.com'; 

    // Одночасно запускаємо паралельно доставку в TG та Email
    await Promise.all([
      sendTG(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID, msg),
      sendEmail(env.RESEND_API_KEY, myEmail, `Нова заявка AIBiz Quiz (${name})`, msg)
    ]);

    return new Response(JSON.stringify({ status: 'success' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch(e) {
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function sendTG(token, chat, text) {
  if (!token || !chat) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chat, text: text, parse_mode: 'HTML' })
  });
}

async function sendEmail(key, to, subject, text) {
  if (!key) return;
  const emailHtml = text.replace(/\n/g, '<br>');
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'AIBiz Quiz <onboarding@resend.dev>',
      to: [to],
      subject: subject,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1f2937; max-width: 600px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #8774e1; margin-top: 0;">🤖 Новий результат AI-Аудиту</h2>
          <div style="margin-top: 15px; font-size: 15px; line-height: 1.6;">
            ${emailHtml}
          </div>
        </div>
      `
    })
  });
}
