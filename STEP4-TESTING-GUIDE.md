# Step 4 — Testing Guide

Пошаговая инструкция для тестирования реальных Inngest pipelines.

---

## 0) Preconditions (предварительные условия)

### Environment Variables (проверьте в Vercel или .env.local)

Убедитесь, что установлены:
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `SUPABASE_BUCKET_COURSE_PDF` (или `SUPABASE_PDF_BUCKET`)
- ✅ `OPENAI_API_KEY`
- ✅ `INNGEST_EVENT_KEY` (если используете Inngest Cloud)
- ✅ `INNGEST_SIGNING_KEY` (если используете Inngest Cloud)

### Запущенные сервисы

1. **Next.js dev server**: `npm run dev` (порт 3000)
2. **Inngest Dev Server**: `npx inngest-cli@latest dev` (порт 8288)
3. **База данных**: доступна (Neon/PostgreSQL)

---

## 1) Проверка maxDuration

**Цель**: Убедиться, что `/api/inngest` имеет правильный `maxDuration`.

### Шаги:

1. Откройте `app/api/inngest/route.ts`
2. Проверьте наличие:
   ```ts
   export const runtime = "nodejs";
   export const maxDuration = 300;
   ```

**Ожидаемый результат**: ✅ Файл содержит `maxDuration = 300`

---

## 2) Проверка дедупликации events

**Цель**: Убедиться, что события имеют `id` для предотвращения дублей.

### Шаги:

1. Откройте `app/api/custom-course/route.ts`
2. Найдите `inngest.send()` и проверьте наличие:
   ```ts
   await inngest.send({
     id: `custom_course/requested:${courseRequest.id}`,
     name: 'custom_course/requested',
     data: eventPayload,
   })
   ```

3. Откройте `app/api/ai-strategy/route.ts`
4. Найдите `inngest.send()` и проверьте наличие:
   ```ts
   await inngest.send({
     id: `ai_strategy/requested:${strategyRun.id}`,
     name: 'ai_strategy/requested',
     data: eventPayload,
   })
   ```

**Ожидаемый результат**: ✅ Оба файла содержат `id` в `inngest.send()`

---

## 3) Тестирование Custom Course Pipeline

### 3.1 Подготовка

1. Убедитесь, что у вас есть активная сессия (залогиньтесь)
2. Убедитесь, что у вас достаточно токенов на балансе
3. Откройте Inngest Dev Server: http://localhost:8288

### 3.2 Запуск генерации

1. Перейдите на `/learn?tab=custom`
2. Заполните форму Custom Course:
   - Experience: выберите любой
   - Markets: выберите хотя бы один
   - Deposit: выберите любой
   - Risk Tolerance: выберите любой
   - Trading Style: выберите любой
   - Goals: введите минимум 10 символов
   - Languages: выберите `en` (или `ar`)
   - Согласитесь с условиями
3. Нажмите "Generate"

### 3.3 Проверка в UI

**На странице `/learn?tab=custom`:**
- ✅ В URL появился `&jobId=X` (где X — ID задачи)
- ✅ Появился блок статуса с текстом "Status" или "Last run"
- ✅ Статус меняется: `in_queue` → `processing` → `ready`
- ✅ Progress bar показывает прогресс: 5% → 60% → 85% → 100%
- ✅ Stage меняется: `queued` → `generating` → `rendering` → `uploading` → `done`
- ✅ Когда статус `ready`, появляется ссылка "Open PDF"

### 3.4 Проверка в Inngest Dev Server

1. Откройте http://localhost:8288
2. Перейдите на вкладку **Runs**
3. Найдите run для `custom_course/requested`
4. Проверьте:
   - ✅ Status: `Completed` (зеленый)
   - ✅ Видны все steps:
     - `db:load-job`
     - `db:set-processing`
     - `llm:generate`
     - `db:store-content`
     - `db:set-uploading`
     - `storage:upload`
     - `db:set-ready`
   - ✅ Каждый step имеет статус `Completed`

### 3.5 Проверка в базе данных

1. Откройте Prisma Studio: `npx prisma studio`
2. Перейдите в таблицу `CustomCourseRequest`
3. Найдите последнюю запись (по `created_at`)
4. Проверьте:
   - ✅ `status` = `ready`
   - ✅ `status_stage` = `done`
   - ✅ `status_progress` = `100`
   - ✅ `pdf_url` содержит `supabase://bucket/path` (например: `supabase://course-pdf/custom-courses/1/8.pdf`)
   - ✅ `ai_response_structured` содержит JSON с сгенерированным контентом

### 3.6 Проверка Status Endpoint

1. Откройте DevTools (F12) → Console
2. Выполните:
   ```javascript
   fetch('/api/custom-course/JOB_ID', { credentials: 'include' })
     .then(r => r.json())
     .then(console.log)
   ```
   (Замените `JOB_ID` на реальный ID из URL)

3. Проверьте ответ:
   ```json
   {
     "jobId": "...",
     "status": "ready",
     "stage": "done",
     "progress": 100,
     "error": null,
     "result": {
       "pdfUrl": "https://...supabase.co/storage/v1/object/sign/..." // Signed URL
     },
     "updatedAt": "..."
   }
   ```

**Ожидаемый результат**: ✅ `result.pdfUrl` содержит валидный signed URL

### 3.7 Проверка PDF

1. Кликните на ссылку "Open PDF" в UI
2. Или откройте `result.pdfUrl` из status endpoint
3. Проверьте:
   - ✅ PDF открывается в браузере
   - ✅ PDF содержит сгенерированный контент
   - ✅ PDF имеет 2-3 страницы (компактный формат)

---

## 4) Тестирование AI Strategy Pipeline

### 4.1 Запуск генерации

1. Перейдите на `/learn?tab=ai`
2. Заполните форму AI Strategy:
   - Preset: выберите любой
   - Market: выберите любой
   - Timeframe: выберите любой
   - Risk per trade: введите значение
   - Max trades: введите значение
   - Instruments: введите значение
   - Focus: введите значение
   - Detail level: выберите любой
   - Languages: выберите `en` (или `ar`)
   - Согласитесь с условиями
3. Нажмите "Generate"

### 4.2 Проверка (аналогично Custom Course)

**На странице `/learn?tab=ai`:**
- ✅ В URL появился `&jobId=X`
- ✅ Статус меняется: `in_queue` → `processing` → `ready`
- ✅ Progress и stage обновляются корректно
- ✅ Когда статус `ready`, появляется ссылка "Open PDF"

**В Inngest Dev Server:**
- ✅ Run для `ai_strategy/requested` завершился успешно
- ✅ Все steps выполнены

**В базе данных (таблица `AiStrategyRun`):**
- ✅ `status` = `ready`
- ✅ `pdf_url` содержит `supabase://bucket/path` (например: `supabase://course-pdf/ai-strategies/1/9.pdf`)
- ✅ `ai_response_structured` содержит JSON
- ✅ `prompt_tokens`, `completion_tokens`, `total_tokens` заполнены

**Status Endpoint:**
- ✅ `GET /api/ai-strategy/JOB_ID` возвращает `result.pdfUrl` с signed URL

**PDF:**
- ✅ PDF открывается и содержит сгенерированный контент

---

## 5) Тестирование обработки ошибок

### 5.1 Тест: Job not found

**Цель**: Проверить, что `NonRetriableError` правильно обрабатывается.

**Шаги:**
1. Вручную удалите запись из БД (через Prisma Studio)
2. Или отправьте событие с несуществующим `jobId`
3. Проверьте в Inngest Dev Server:
   - ✅ Run завершился с ошибкой `NonRetriableError`
   - ✅ Run не ретраится (статус `Failed`, не `Retrying`)

### 5.2 Тест: Missing bucket env var

**Цель**: Проверить, что отсутствие bucket переменной вызывает `NonRetriableError`.

**Шаги:**
1. Временно удалите `SUPABASE_BUCKET_COURSE_PDF` из `.env.local`
2. Перезапустите Next.js dev server
3. Запустите генерацию Custom Course
4. Проверьте:
   - ✅ Run завершился с ошибкой `Missing Supabase PDF bucket env var`
   - ✅ Run не ретраится
   - ✅ Job в БД имеет `status = 'failed'` и `status_error` содержит сообщение

### 5.3 Тест: Transient error (retry)

**Цель**: Проверить, что временные ошибки (например, сеть) ретраятся.

**Шаги:**
1. Временно отключите интернет или заблокируйте доступ к OpenAI API
2. Запустите генерацию
3. Проверьте в Inngest Dev Server:
   - ✅ Run пытается ретраиться (статус `Retrying`)
   - ✅ После восстановления соединения run завершается успешно

---

## 6) Тестирование дедупликации

**Цель**: Убедиться, что двойной клик не создает дубликаты.

### Шаги:

1. Запустите генерацию Custom Course
2. **Сразу же** (в течение 1-2 секунд) запустите еще одну генерацию с теми же данными
3. Проверьте в Inngest Dev Server:
   - ✅ Создано только одно событие с уникальным `id`
   - ✅ Второе событие игнорируется (или имеет статус `Deduplicated`)

**Ожидаемый результат**: ✅ Дубликаты не создаются благодаря `id` в `inngest.send()`

---

## 7) Тестирование concurrency limits

**Цель**: Проверить, что concurrency limits работают.

### Шаги:

1. Запустите 3 генерации Custom Course подряд (от одного пользователя)
2. Проверьте в Inngest Dev Server:
   - ✅ Только 1 run выполняется одновременно (per-user limit: 1)
   - ✅ Остальные runs находятся в статусе `Queued`
   - ✅ После завершения первого run, второй начинает выполняться

3. Запустите генерации от разных пользователей (если возможно)
4. Проверьте:
   - ✅ До 5 runs могут выполняться одновременно (global limit: 5)

---

## 8) Тестирование idempotency guard

**Цель**: Проверить, что повторный запуск уже завершенного job не выполняет работу заново.

### Шаги:

1. Завершите генерацию Custom Course (статус `ready`)
2. Вручную отправьте событие с тем же `jobId` (через Inngest Dev Server UI → Functions → Invoke)
3. Проверьте:
   - ✅ Run завершается сразу с `alreadyDone: true`
   - ✅ Не выполняются steps `llm:generate`, `storage:upload` и т.д.
   - ✅ Статус в БД остается `ready`

---

## 9) Тестирование signed URLs

**Цель**: Проверить, что signed URLs работают и имеют правильный TTL.

### Шаги:

1. Получите `pdfUrl` из status endpoint
2. Проверьте URL:
   - ✅ URL содержит `supabase.co/storage/v1/object/sign/`
   - ✅ URL содержит параметры `token` и `expires`
3. Откройте URL в браузере:
   - ✅ PDF загружается
4. Подождите 1 час (или измените TTL в конфиге на меньшее значение)
5. Попробуйте открыть URL снова:
   - ✅ URL истекает (403 или 404)
6. Получите новый signed URL через status endpoint:
   - ✅ Новый URL работает

---

## 10) Тестирование путей в Supabase Storage

**Цель**: Проверить, что PDF сохраняются в правильных путях.

### Шаги:

1. Откройте Supabase Dashboard → Storage
2. Перейдите в bucket (например, `course-pdf`)
3. Проверьте структуру:
   - ✅ Custom Course: `custom-courses/{userId}/{jobId}.pdf`
   - ✅ AI Strategy: `ai-strategies/{userId}/{jobId}.pdf`
4. Проверьте файлы:
   - ✅ Файлы существуют
   - ✅ Размер файлов > 0
   - ✅ Content-Type: `application/pdf`

---

## 11) Checklist итогового тестирования

Перед завершением тестирования убедитесь:

- [ ] Custom Course генерация работает end-to-end
- [ ] AI Strategy генерация работает end-to-end
- [ ] PDF загружаются в Supabase Storage
- [ ] Status endpoints возвращают signed URLs
- [ ] UI показывает правильные статусы и прогресс
- [ ] Ошибки обрабатываются корректно (failed status)
- [ ] Дедупликация работает (нет дублей)
- [ ] Concurrency limits работают
- [ ] Idempotency guard работает
- [ ] Signed URLs работают и истекают правильно

---

## 12) Troubleshooting (решение проблем)

### Проблема: Run не запускается

**Решение:**
- Проверьте, что Inngest Dev Server запущен
- Проверьте, что `/api/inngest` доступен
- Проверьте логи в Inngest Dev Server

### Проблема: PDF не генерируется

**Решение:**
- Проверьте `OPENAI_API_KEY`
- Проверьте логи в Inngest Dev Server → Runs → конкретный run
- Проверьте, что `generateCustomCourseComplete()` или `generateAIStrategyComplete()` вызываются

### Проблема: PDF не загружается в Supabase

**Решение:**
- Проверьте `SUPABASE_BUCKET_COURSE_PDF` или `SUPABASE_PDF_BUCKET`
- Проверьте `SUPABASE_SERVICE_ROLE_KEY`
- Проверьте права доступа к bucket в Supabase Dashboard
- Проверьте логи в Inngest Dev Server

### Проблема: Signed URL не работает

**Решение:**
- Проверьте, что bucket приватный (не публичный)
- Проверьте `SUPABASE_SERVICE_ROLE_KEY`
- Проверьте, что `resolveDownloadUrl()` вызывается корректно
- Проверьте TTL в конфиге (`SUPABASE_SIGNED_URL_TTL_PDF`)

### Проблема: Статус не обновляется

**Решение:**
- Проверьте подключение к БД
- Проверьте, что `withPrismaRetry()` работает
- Проверьте логи в Inngest Dev Server
- Проверьте, что все `step.run()` выполняются успешно

---

## 13) Логи для отладки

### Где смотреть логи:

1. **Inngest Dev Server**: http://localhost:8288 → Runs → конкретный run → Logs
2. **Next.js Console**: терминал, где запущен `npm run dev`
3. **Browser Console**: DevTools → Console (для frontend ошибок)
4. **Prisma Studio**: для проверки данных в БД

### Что проверять в логах:

- ✅ Все steps выполняются успешно
- ✅ Нет ошибок в `llm:generate` step
- ✅ Нет ошибок в `storage:upload` step
- ✅ Нет ошибок в `db:set-ready` step
- ✅ PDF buffer создается (размер > 0)
- ✅ Upload в Supabase успешен

---

## Готово!

После успешного прохождения всех тестов Step 4 считается завершенным. 🎉

