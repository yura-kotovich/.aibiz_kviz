export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const data = await request.json();
    const source = data.source || "Website";

    // Універсальний гарний шаблон повідомлення для Телеграм бота
    const msg = `
<b>🤖 НОВА ЗАЯВКА - AI-АУДИТ [${source.toUpperCase()}]</b>

👤 <b>Клієнт:</b> ${data.name}
📧 <b>Email/Telegram:</b> ${data.email}
📞 <b>Телефон:</b> ${data.phone}

🎯 <b>Напрямок ШІ:</b>
${data.direction}

📊 <b>Поточний досвід:</b>
${data.experience}

📞 <b>Бажаний формат:</b>
${data.format}

📝 <b>Коментар / Головне завдання:</b>
${data.comment || 'Не вказано'}
    `.trim();

    // За замовчуванням листи будуть летіти на вашу пошту. 
    // Якщо хочете змінити отримувача — просто впишіть вашу пошту замість 'profirise@gmail.com'
    const adminEmail = "profirise@gmail.com"; 

    // Запускаємо відправку в Телеграм робота та на пошту Resend паралельно
    await Promise.all([
      sendTG(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID, msg),
      sendEmail(env.RESEND_API_KEY, adminEmail, `Нова заявка AIBiz Quiz (${data.name})`, msg)
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
  if (!token || !chat) {
    console.warn("TELEGRAM_BOT_TOKEN або TELEGRAM_CHAT_ID не налаштовані.");
    return;
  }
  const tgUrl = `https://api.telegram.org/bot${token}/sendMessage`;
  await fetch(tgUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chat, text: text, parse_mode: 'HTML' })
  });
}

async function sendEmail(key, to, subject, text) {
  if (!key) {
    console.warn("RESEND_API_KEY не налаштований. Лист не відправлено.");
    return;
  }
  const emailHtml = text.replace(/\n/g, '<br>');
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'AIBiz Quiz <onboarding@resend.dev>', // Дозволений безкоштовний відправник у Resend
      to: [to],
      subject: subject,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1f2937; max-width: 600px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #8774e1; margin-top: 0;">🤖 Нова заявка з Квізу</h2>
          <hr style="border-color: #e5e7eb; margin: 15px 0;">
          <div style="font-size: 14px; line-height: 1.6;">
            ${emailHtml}
          </div>
        </div>
      `
    })
  });
}
