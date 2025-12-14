# Step 5 — Production Readiness Checklist

Этот чек-лист поможет убедиться, что все готово для деплоя на продакшен.

---

## ✅ Pre-Deployment Checklist (перед деплоем)

### 1. Environment Variables (Vercel → Settings → Environment Variables)

**Inngest (обязательно):**
- [ ] `INNGEST_EVENT_KEY` — добавлен в Production environment
- [ ] `INNGEST_SIGNING_KEY` — добавлен в Production environment

**Supabase (обязательно):**
- [ ] `SUPABASE_URL` — добавлен в Production environment
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — добавлен в Production environment (server only)
- [ ] `SUPABASE_BUCKET_COURSE_PDF=course-pdf` — добавлен в Production environment
- [ ] `SUPABASE_BUCKET_COURSE_IMAGES=course-images` — добавлен в Production environment
- [ ] `SUPABASE_SIGNED_URL_TTL_PDF=3600` — опционально (default: 3600)

**OpenAI (обязательно):**
- [ ] `OPENAI_API_KEY` — добавлен в Production environment

**Database (обязательно):**
- [ ] `DATABASE_URL` — добавлен в Production environment (Neon PostgreSQL)

**NextAuth (обязательно):**
- [ ] `NEXTAUTH_SECRET` — добавлен в Production environment
- [ ] `NEXTAUTH_URL` — установлен на production URL (например, `https://your-domain.com`)

**Other:**
- [ ] `SITE_BASE_URL` — установлен на production URL
- [ ] `NODE_ENV=production` — установлен автоматически Vercel

> **Важно**: После добавления/изменения env vars необходимо сделать **redeploy**.

---

### 2. Vercel Function Configuration

- [ ] `/app/api/inngest/route.ts` имеет:
  - `export const runtime = "nodejs"`
  - `export const maxDuration = 300` (Hobby safe)

- [ ] Status endpoints имеют:
  - `export const dynamic = "force-dynamic"`
  - `export const runtime = "nodejs"`

**Проверка:**
```bash
# Проверить, что файлы содержат правильные экспорты
grep -r "export const runtime" app/api/inngest/route.ts
grep -r "export const maxDuration" app/api/inngest/route.ts
```

---

### 3. Inngest Serve Endpoint

- [ ] `/app/api/inngest/route.ts` экспортирует `GET, POST, PUT`
- [ ] Функции зарегистрированы: `helloWorld`, `generateCustomCourse`, `generateAIStrategy`

**Проверка:**
```typescript
// app/api/inngest/route.ts должен содержать:
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [helloWorld, generateCustomCourse, generateAIStrategy],
});
```

---

### 4. Vercel Deployment Protection

- [ ] `/api/inngest` доступен из публичного интернета (не заблокирован Deployment Protection)
- [ ] Если Deployment Protection включен, настроен bypass для `/api/inngest` (Pro feature)

**Как проверить:**
1. После деплоя откройте `https://your-domain.com/api/inngest` в браузере
2. Должен вернуться ответ (не 401, не 403, не "blocked")

---

### 5. Code Guardrails (защита от output_too_large)

- [ ] PDF buffer не возвращается из Inngest steps
- [ ] Steps возвращают только маленькие указатели (`supabase://` paths)
- [ ] Большие данные (PDF, JSON) сохраняются в DB/Storage внутри step'а

**Проверка:**
```typescript
// inngest/functions.ts - pdf:render-and-upload step должен:
// 1. Рендерить PDF
// 2. Загружать в Supabase
// 3. Возвращать только encodeSupabasePath(bucket, key) - НЕ buffer
```

---

### 6. Supabase Storage Buckets

- [ ] Bucket `course-pdf` создан и настроен как **private**
- [ ] Bucket `course-images` создан и настроен как **public**
- [ ] Service Role Key имеет права на запись в оба bucket'а

**Проверка в Supabase Dashboard:**
1. Storage → Buckets
2. Убедиться, что `course-pdf` существует и private
3. Убедиться, что `course-images` существует и public

---

## 🧪 Post-Deployment Smoke Tests (после деплоя)

### Test 1: `/api/inngest` Health Check

**Шаги:**
1. Откройте `https://your-domain.com/api/inngest` в браузере
2. Должен вернуться ответ (не 401, не 403)

**Ожидаемый результат:**
- ✅ Endpoint доступен
- ✅ Inngest может достучаться до вашего сервера

**В Inngest Dashboard:**
1. Зайдите в Inngest Cloud Dashboard
2. Убедитесь, что функции `generate-custom-course` и `generate-ai-strategy` видны под вашим app

---

### Test 2: Custom Course — End-to-End (EN + AR)

**Шаги:**
1. Запустите генерацию Custom Course с двумя языками (EN + AR)
2. Проверьте API response — должен вернуться `{ ok: true, jobs: [{ jobId, language: "en" }, { jobId, language: "ar" }] }`
3. В Inngest Dashboard проверьте, что созданы **два run'а** (по одному на каждый язык)
4. Дождитесь завершения обоих job'ов
5. Проверьте в Prisma Studio / Supabase:
   - Оба job'а имеют `status = "ready"`
   - Оба job'а имеют `pdf_url` в формате `supabase://course-pdf/custom/...`
6. Проверьте status endpoint: `GET /api/custom-course/[jobId]`
   - Должен вернуться `result.pdfUrl` (signed URL)
7. Откройте signed URL в браузере → PDF должен скачаться

**Ожидаемый результат:**
- ✅ 2 job'а созданы
- ✅ 2 PDF сгенерированы
- ✅ PDF доступны через signed URLs
- ✅ PDF скачиваются корректно

---

### Test 3: AI Strategy — End-to-End

**Шаги:**
1. Запустите генерацию AI Strategy с двумя языками (EN + AR)
2. Повторите те же проверки, что и в Test 2

**Ожидаемый результат:**
- ✅ 2 job'а созданы
- ✅ 2 PDF сгенерированы
- ✅ PDF доступны через signed URLs

---

### Test 4: Negative Test (Failure Handling)

**Шаги:**
1. Создайте тестовый job с невалидными данными (например, несуществующий `jobId` в Inngest event)
2. Проверьте, что job заканчивается в `failed`
3. Проверьте, что `status_error` заполнен
4. Проверьте в UI, что статус отображается как "failed" (не бесконечный spinner)

**Ожидаемый результат:**
- ✅ Job заканчивается в `failed`
- ✅ `status_error` содержит описание ошибки
- ✅ UI показывает failed state

---

### Test 5: Signed URL TTL

**Шаги:**
1. Сгенерируйте PDF и получите signed URL
2. Подождите более 1 часа (3600 секунд)
3. Попробуйте открыть signed URL
4. Должен вернуться 403/404 (URL истек)

**Ожидаемый результат:**
- ✅ Signed URL работает в течение 1 часа
- ✅ После истечения TTL URL становится невалидным

---

## 🐛 Troubleshooting (если что-то не работает)

### Проблема: Inngest не может достучаться до `/api/inngest`

**Решение:**
1. Проверьте Vercel Deployment Protection
2. Убедитесь, что `/api/inngest` доступен публично
3. Проверьте, что route экспортирует `GET, POST, PUT`

---

### Проблема: Runs timeout

**Решение:**
1. Проверьте, что `maxDuration = 300` в `/app/api/inngest/route.ts`
2. Убедитесь, что каждый step выполняется быстро
3. Проверьте Vercel logs на предмет ошибок

---

### Проблема: `output_too_large` error

**Решение:**
1. Убедитесь, что PDF buffer не возвращается из step'а
2. Проверьте, что steps возвращают только маленькие указатели
3. Убедитесь, что большие данные сохраняются в DB/Storage внутри step'а

---

### Проблема: PDF не скачивается

**Решение:**
1. Проверьте, что `pdf_url` в БД в формате `supabase://course-pdf/...`
2. Проверьте, что bucket `course-pdf` существует и private
3. Проверьте, что Service Role Key имеет права на чтение из bucket'а
4. Проверьте, что `resolveDownloadUrl()` корректно генерирует signed URL

---

## ✅ Final Checklist

Перед объявлением готовности к продакшену убедитесь:

- [ ] Все env vars добавлены в Vercel Production environment
- [ ] `/api/inngest` доступен публично
- [ ] Все smoke tests пройдены успешно
- [ ] PDF генерируются и скачиваются корректно
- [ ] Мультиязычность работает (2 job'а для EN+AR)
- [ ] Failures заканчиваются в `failed` (не "processing forever")
- [ ] Signed URLs работают и истекают через 1 час

---

## 📝 Notes

- После добавления/изменения env vars **обязательно** сделайте redeploy
- Проверяйте Inngest Dashboard для мониторинга runs
- Проверяйте Vercel Logs для отладки ошибок
- Signed URLs истекают через 1 час (3600 секунд) — это нормально для безопасности

