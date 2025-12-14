# Step 5 — Production Readiness: План действий

## Цель
Подготовить систему к продакшену на Vercel (Hobby) + Inngest + Supabase с проверкой всех требований и документацией.

---

## Этап 1: Проверка конфигурации (валидация)

### 1.1 Vercel Function Configuration
- ✅ `/app/api/inngest/route.ts` — `runtime = "nodejs"`, `maxDuration = 300`
- ✅ Status endpoints — `dynamic = "force-dynamic"`, `runtime = "nodejs"`

**Действие**: Убедиться, что все endpoints имеют правильные настройки.

### 1.2 Inngest Serve Endpoint
- ✅ `/app/api/inngest/route.ts` экспортирует `GET, POST, PUT`

**Действие**: Проверить, что экспорты корректны.

### 1.3 Hard Guardrails (output_too_large)
- ✅ PDF buffer не возвращается из steps
- ✅ Steps возвращают только маленькие указатели (`supabase://` paths)

**Действие**: Финальная проверка кода на отсутствие больших возвращаемых значений.

---

## Этап 2: TTL для Signed URLs (настройка)

### 2.1 Текущее состояние
- По умолчанию: `86400` секунд (24 часа)
- Рекомендация Step 5: `3600` секунд (1 час)

### 2.2 Решение
**Вариант A**: Оставить 86400 (24 часа) — удобнее для пользователей
**Вариант B**: Изменить на 3600 (1 час) — безопаснее

**Действие**: Обсудить с пользователем и применить выбранный вариант.

---

## Этап 3: Документация Environment Variables

### 3.1 Создать/обновить документацию
Создать файл `PRODUCTION-ENV-VARS.md` с полным списком env vars для продакшена:

**Inngest:**
- `INNGEST_EVENT_KEY`
- `INNGEST_SIGNING_KEY`

**Supabase:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)

**Buckets:**
- `SUPABASE_BUCKET_COURSE_PDF=course-pdf`
- `SUPABASE_BUCKET_COURSE_IMAGES=course-images`

**Опционально:**
- `SUPABASE_SIGNED_URL_TTL_PDF` (default: 86400 или 3600)

**Действие**: Создать файл с описанием каждой переменной и инструкциями по настройке.

---

## Этап 4: Финальная проверка кода

### 4.1 Проверить все требования Step 5
- [ ] `/api/inngest` работает и доступен для Inngest
- [ ] `maxDuration = 300` (Hobby safe)
- [ ] Нет больших outputs в steps (защита от `output_too_large`)
- [ ] PDFs хранятся в `course-pdf/custom/` и `course-pdf/ai-strategy/`
- [ ] PDFs доступны через signed URLs из status endpoints
- [ ] EN+AR создает 2 job'а и 2 PDF
- [ ] Failures заканчиваются в `failed` (не "processing forever")

**Действие**: Пройтись по каждому пункту и убедиться, что все реализовано.

---

## Этап 5: Production Smoke Tests (после деплоя)

### 5.1 Тесты для выполнения после деплоя
1. `/api/inngest` health check
2. Custom Course: end-to-end (EN+AR)
3. AI Strategy: end-to-end
4. Negative test (failure handling)

**Действие**: Создать чек-лист для тестирования после деплоя.

---

## Итоговый список изменений

1. **Обновить TTL** (если выбран вариант B) — изменить default в `lib/config.ts`
2. **Создать `PRODUCTION-ENV-VARS.md`** — документация env vars
3. **Создать `STEP5-PRODUCTION-CHECKLIST.md`** — чек-лист для проверки перед деплоем
4. **Финальная проверка кода** — убедиться, что все требования выполнены

---

## Примечания

- Step 5 в основном про **валидацию и документацию**, не про новые фичи
- Большинство требований уже выполнено в Step 4.1
- Основная работа — убедиться, что все настроено правильно и задокументировано

