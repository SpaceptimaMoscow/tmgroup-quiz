# Быстрый деплой квиза на Netlify (с функцией отправки письма)

## Вариант A — через GitHub (рекомендуется)
1. Создайте пустой репозиторий на GitHub (например, `tmgroup-quiz`).
2. Скачайте архив проекта отсюда и распакуйте. Содержимое:
   - `index.html` — ваш квиз
   - `netlify/functions/sendResults.js` — серверless-функция
   - `package.json`
   - `netlify.toml`
3. Закоммитьте и запушьте файлы в GitHub.
4. Войдите в Netlify → **Add new site** → **Import from Git** → выберите ваш репозиторий GitHub.
5. Настройки билда:
   - Build command: *(пусто)*
   - Publish directory: `.` (точка)
   - Functions directory: автоматически берётся из `netlify.toml` (`netlify/functions`)
6. В Netlify → **Site settings** → **Environment variables** добавьте:
   - `SMTP_HOST`
   - `SMTP_PORT` (обычно `587`)
   - `SMTP_SECURE` (`false` для 587; `true` для 465)
   - `SMTP_USER` (например, `testout@tmgroup.ru`)
   - `SMTP_PASS` (лучше app‑password)
7. Деплой завершится → откройте `https://<ваш-сайт>.netlify.app/`.
8. Проверьте функцию: откройте `https://<ваш-сайт>.netlify.app/.netlify/functions/sendResults` — должно быть **405 Method Not Allowed**.
9. Пройдите тест на сайте — письмо уйдёт **строго** на `testin@tmgroup.ru`.

## Вариант B — Netlify CLI (без GitHub)
1. Установите Node.js (LTS).
2. Установите Netlify CLI: `npm i -g netlify-cli`
3. В папке проекта выполните:
   - `netlify login`
   - `netlify init` (создать сайт)
   - `netlify env:set SMTP_HOST ...` и т.д. для всех переменных
   - Локально проверить: `netlify dev` (откроется http://localhost:8888 с работающими функциями)
   - Задеплоить: `netlify deploy --prod`
4. Откройте выданный прод-URL.

## Частые ошибки
- Открываете HTML локально (`file://...`) — функции не вызываются. Открывайте страницу по домену Netlify.
- 404 на `/.netlify/functions/sendResults` — не задеплоена функция или неверная структура. Должно быть `netlify/functions/sendResults.js` и `netlify.toml`.
- `502 SMTP send failed` — проверьте `SMTP_*` переменные и порт/SECURE. Для 587 — `SMTP_SECURE=false`.
- `EAUTH` — неверный логин/пароль или провайдер требует app‑password.
- `ETIMEDOUT` / `ECONNREFUSED` — проверьте хост, порт, брандмауэр.

Удачи!