const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  // Разрешаем только POST-запросы
  if (event.httpMethod !== 'POST') {
    return respond(405, { error: 'Method Not Allowed' });
  }

  // Пытаемся разобрать JSON с фронта
  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (err) {
    console.error('Bad JSON:', err);
    return respond(400, { error: 'Bad JSON' });
  }

  const { user = {}, duration_ms = 0, duration_human = '', results = {} } = payload;
  const { name = '', phone = '', email = '' } = user;

  if (!name) {
    return respond(400, { error: 'Missing name' });
  }

  // SMTP-настройки из переменных окружения (Netlify → Environment variables)
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.error('Missing SMTP env vars');
    return respond(500, { error: 'SMTP not configured' });
  }

  // Настраиваем транспорт для отправки писем
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: (SMTP_SECURE || 'false') === 'true', // true для 465, false для 587
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  // Формируем письмо
  const to = 'testin@tmgroup.ru'; // <-- фиксированный получатель
  const subject = `Результаты теста: ${name} — ${results.percent || 0}%`;
  const text = [
    `Кто проходил:`,
    `Имя: ${name}`,
    `Телефон: ${phone || '-'}`,
    `Email: ${email || '-'}`,
    ``,
    `Время прохождения: ${duration_human} (${duration_ms} мс)`,
    ``,
    `Результат:`,
    `  Правильно: ${results.correct} из ${results.total} (${results.percent}%)`,
    `  Неправильно: ${results.incorrect}`,
    `  Пропущено: ${results.skipped}`,
    ``,
    `Дата/время сервера: ${new Date().toLocaleString('ru-RU')}`,
  ].join('\n');

  try {
    // Отправляем письмо
    const info = await transporter.sendMail({
      from: `"Quiz Bot" <${SMTP_USER}>`,
      to, // только testin@tmgroup.ru
      subject,
      text,
    });

    console.log('Mail sent successfully:', info.response);
    return respond(200, { ok: true, message: 'Письмо отправлено' });
  } catch (err) {
    console.error('SMTP send error:', err);
    return respond(502, { error: 'SMTP send failed', details: err.message });
  }
};

// Упрощённая функция для ответа
function respond(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}
