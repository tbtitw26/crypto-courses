# Deploy на Vercel (чек-лист)

## 1) Переменные окружения (Production)
- DATABASE_URL (Neon)
- NEXTAUTH_SECRET
- NEXTAUTH_URL=https://your-domain
- SITE_BASE_URL=https://your-domain
- OPENAI_API_KEY
- BROWSERLESS_API_KEY (и опционально BROWSERLESS_ENDPOINT=wss://chrome.browserless.io)
- SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_URL
- USE_SUPABASE_STORAGE=true
- SUPABASE_BUCKET_COURSE_PDF=course-pdf
- SUPABASE_BUCKET_COURSE_IMAGES=course-images
- SUPABASE_BUCKET_COURSE_MEDIA=course-media
- SUPABASE_SIGNED_URL_TTL_PDF=86400
- SMTP_HOST, SMTP_PORT=465, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_FROM_NAME
- (опц.) TM_API_URL, TM_API_KEY, TM_SIGNING_KEY — если не используется, можно не ставить

## 2) Сборка / зависимости
- `npm run build` локально с `USE_SUPABASE_STORAGE=true NODE_ENV=production`
- Убедиться, что `public/courses` и `public/images/courses` не в гите (есть в .gitignore)
- Видео `public/video1.mp4`, `public/video2.mp4` остаются

## 3) Миграции Prisma
- В репо есть миграция `add_pdf_url_to_ai_strategy_run`
- На Vercel после деплоя выполнить: `npx prisma migrate deploy` (или через GitHub Action/cli)

## 4) Проверки после деплоя
- Создать тестовую AI Strategy: статус в Dashboard, ссылка Download (signed URL), письмо с PDF и инвойсом
- Создать тестовый Custom Course: статус, Download, письмо
- Купить готовый курс: Download (signed URL), письмо с подтверждением/инвойсом

## 5) Особенности
- Генерация PDF в проде через Browserless, локальный Chromium не нужен
- Логи только в консоль (файловые на Vercel не пишутся)
- next/image: Supabase домен берется из NEXT_PUBLIC_SUPABASE_URL (см. `next.config.js`)

