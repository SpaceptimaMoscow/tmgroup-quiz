const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method Not Allowed' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    console.error('Bad JSON:', e);
    return json(400, { error: 'Bad JSON' });
  }

  const { user = {}, duration_ms = 0, duration_human = '', results = {} } = payload;
  const { name = '', phone = '', email = '' } = user;
  if (!name) return json(400, { error: 'Missing name' });

  const {
    SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS
  } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.error('Missing SMTP env vars');
    return json(500, { error: 'SMTP not configured' });
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: (SMTP_SECURE || 'false') === 'true', // true for 465
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const subject = `Результаты теста: ${name} — ${Number(results.percent || 0)}%`;
  const to = 'testin@tmgroup.ru'; // жестко

  const text = [
    `Кто проходил:`,
    `  Имя: ${name}`,
    `  Телефон: ${phone || '-'}`,
    `  Email: ${email || '-'}`,
    ``,
    `Время прохождения: ${duration_human} (${duration_ms} мс)`,
    ``,
    `Результат:`,
    `  Правильно: ${results.correct} из ${results.total} (${results.percent}%)`,
    `  Неправильно: ${results.incorrect}`,
    `  Пропущено: ${results.skipped}`,
    ``,
    `Дата/время сервера: ${new Date().toISOString()}`
  ].join('\n');

  try {
    const info = await transporter.sendMail({
      from: `"Quiz Bot" <${SMTP_USER}>`,
      to,
      subject,
      text
    });
    console.log('Mail accepted:', info.accepted, 'response:', info.response);
    return json(200, { ok: true, message: 'Письмо отправлено' });
  } catch (err) {
    console.error('SMTP send error:', err && err.message, err && err.code);
    return json(502, { error: 'SMTP send failed', code: err && err.code, msg: err && err.message });
  }
};

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(obj)
  };
}