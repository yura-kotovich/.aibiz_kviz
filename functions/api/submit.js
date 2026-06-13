export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const data = await request.json();

    // Формуємо красиве форматоване повідомлення для вашого Telegram каналу/боту
    const formattedText = `
<b>🤖 НОВА ЗАЯВКА - AI-АУДИТ [${(data.source || 'WEB').toUpperCase()}]</b>

👤 <b>Клієнт:</b> ${data.q1 || 'Не вказано'}
📧 <b>Email/Telegram:</b> ${data.email || 'Не вказано'}
🎯 <b>Напрямок:</b> ${data.q2 || 'Не вказано'}
📊 <b>Поточний досвід:</b> ${data.q3 || 'Не вказано'}
📝 <b>Кейс / Коментар:</b> ${data.comment || 'Не вказано'}
    `.trim();

    // Твоя реальна пошта отримувача з налаштувань або дефолтна
    const myEmail = env.NOTIFICATION_RECEIVER_EMAIL || 'profirise@gmail.com'; 

    // Виконуємо сповіщення в Telegram та на Email паралельно
    await Promise.all([
      sendTG(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID, formattedText),
      sendEmail(env.RESEND_API_KEY, myEmail, `Нова заявка AIBiz Quiz (${data.q1 || 'Клієнт'})`, formattedText)
    ]);

    return new Response(JSON.stringify({ status: "success" }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// Функція надсилання у Telegram
async function sendTG(token, chat, text) {
  if (!token || !chat) return;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chat,
      text: text,
      parse_mode: 'HTML'
    })
  });
}

// Функція надсилання через сервіс Resend
async function sendEmail(key, to, subject, text) {
  if (!key) return;
  const emailHtml = text.replace(/\n/g, '<br>');
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'AIBiz Quiz <onboarding@resend.dev>',
      to: [to],
      subject: subject,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1f2937; max-width: 600px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #8774e1; margin-top: 0;">🤖 Результати AI-Аудиту</h2>
          <div style="margin-top: 15px; font-size: 15px; line-height: 1.6;">
            ${emailHtml}
          </div>
        </div>
      `
    })
  });
}
