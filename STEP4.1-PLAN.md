# Step 4.1 — План действий

## Анализ текущего состояния

### Критические проблемы:
1. **`output_too_large`** — PDF buffer возвращается из `step.run("llm:generate")`, превышает лимит Inngest (4MB)
2. **Pipeline застрял** — нет обработки ошибок, job остается в `processing` навсегда
3. **PDF слишком большой** — 17 страниц вместо 2-3 (schema позволяет слишком много)
4. **Мультиязычность** — сейчас один job для всех языков, нужно 2 job'а для EN+AR
5. **Пути в Supabase** — используются `custom-courses/${userId}/`, нужно `course-pdf/custom/`

---

## План действий

### Этап 1: Исправить `output_too_large` (критично)

**Проблема:** `generateCustomCourseComplete()` возвращает полный объект с PDF buffers, который сохраняется в Inngest state и превышает лимит 4MB.

**Решение:**
1. **Разбить `generateCustomCourseComplete()` на отдельные steps:**
   - `llm:generate-content` — только генерация контента (без PDF)
   - `pdf:render-and-upload` — рендер PDF + загрузка в Supabase в одном step (не возвращать buffer)
   - Убрать генерацию cover/diagrams на этом этапе (для стабильности)

2. **Изменить возвращаемые значения:**
   - Из `llm:generate-content` возвращать только `{ courseEn, courseId, tokens, model }` (без PDF buffers)
   - Из `pdf:render-and-upload` возвращать только `{ pdfUrl: "supabase://..." }` (не buffer)

3. **Обновить `inngest/functions.ts`:**
   - Заменить вызов `generateCustomCourseComplete()` на отдельные steps
   - Использовать `generateCustomCourse()` для LLM генерации
   - Использовать `generateCoursePdf()` + `uploadPrivateAsset()` для PDF (внутри одного step)

---

### Этап 2: Добавить обработку ошибок

**Проблема:** При падении run job остается в `processing` навсегда.

**Решение:**
1. **Добавить `onFailure` handler в Inngest function:**
   ```ts
   export const generateCustomCourse = inngest.createFunction(
     { id: "generate-custom-course", onFailure: async ({ event, error }) => { ... } },
     ...
   )
   ```

2. **Улучшить try/catch:**
   - Обернуть весь function body в try/catch
   - При любой ошибке вызывать `step.run("db:set-failed")` с `status_error`
   - Использовать `NonRetriableError` для постоянных ошибок

3. **Добавить trace breadcrumbs:**
   - `trace:before-llm`, `trace:after-llm`, `trace:before-pdf`, `trace:after-pdf`, `trace:before-upload`, `trace:after-upload`
   - Каждый breadcrumb обновляет `status_message` в БД

---

### Этап 3: Создать компактный schema для 2-3 страниц

**Проблема:** `CUSTOM_COURSE_JSON_SCHEMA` позволяет 3-4 модуля × 2-4 урока × 2-4 блока = 64+ блоков контента.

**Решение:**
1. **Создать `COMPACT_CUSTOM_COURSE_JSON_SCHEMA` в `lib/pdf/schema.ts`:**
   - modules: `minItems: 1, maxItems: 1`
   - lessons per module: `minItems: 1, maxItems: 2`
   - content_blocks per lesson: `minItems: 1, maxItems: 1`
   - glossary: `minItems: 0, maxItems: 4`
   - quiz: `minItems: 0, maxItems: 3`
   - diagrams: `minItems: 0, maxItems: 0` (отключить на этом этапе)
   - one_page_summary: `minItems: 2, maxItems: 3`
   - preface: сократить до минимума

2. **Обновить `lib/openai/generate.ts`:**
   - Использовать `COMPACT_CUSTOM_COURSE_JSON_SCHEMA` вместо `CUSTOM_COURSE_JSON_SCHEMA`

3. **Добавить post-LLM clamp в `inngest/functions.ts`:**
   ```ts
   // После получения course от LLM
   course.modules = course.modules.slice(0, 1);
   if (course.modules[0]) {
     course.modules[0].lessons = course.modules[0].lessons.slice(0, 2);
     course.modules[0].lessons.forEach(lesson => {
       lesson.content_blocks = lesson.content_blocks.slice(0, 1);
     });
   }
   course.glossary = course.glossary?.slice(0, 4) || [];
   course.quiz.questions = course.quiz.questions?.slice(0, 3) || [];
   ```

4. **Создать `COMPACT_AI_STRATEGY_JSON_SCHEMA` аналогично**

---

### Этап 4: Исправить пути в Supabase

**Проблема:** Используются пути `custom-courses/${userId}/`, нужно `course-pdf/custom/`.

**Решение:**
1. **Обновить `inngest/functions.ts`:**
   - Custom Course: `course-pdf/custom/${courseId}-${lang}-${jobId}.pdf`
   - AI Strategy: `course-pdf/ai-strategy/${courseId}-${lang}-${jobId}.pdf`

2. **Обновить `lib/storage.ts`:**
   - Использовать `SUPABASE_BUCKET_COURSE_PDF` (или fallback `SUPABASE_PDF_BUCKET`)
   - Использовать `encodeSupabasePath(bucket, key)` для сохранения в БД

3. **Проверить bucket names:**
   - PDF bucket: `course-pdf` (private)
   - Images bucket: `course-images` (public) — оставить как есть

---

### Этап 5: Реализовать мультиязычность (2 job'а для EN+AR)

**Проблема:** Сейчас один job для всех языков, нужно 2 job'а для EN+AR.

**Решение:**
1. **Обновить `app/api/custom-course/route.ts`:**
   - Если `languages.length > 1`:
     - Создать один DB record на каждый язык
     - Отправить один Inngest event на каждый jobId
     - Вернуть `{ ok: true, jobs: [{ jobId, language }, ...] }`
   - Если `languages.length === 1`:
     - Оставить текущее поведение (один job)

2. **Обновить `app/api/ai-strategy/route.ts` аналогично**

3. **Обновить `inngest/types.ts`:**
   - `CustomCourseRequestedEvent` должен содержать один `language: 'en' | 'ar'` (не массив)

4. **Обновить `inngest/functions.ts`:**
   - Worker получает один `language`, не массив
   - Генерировать контент напрямую на этом языке (не переводить)

---

### Этап 6: Обновить frontend (минимально)

**Задача:** Поддержать новый формат ответа `{ ok: true, jobs: [...] }`.

**Решение:**
1. **Обновить `lib/jobs/parseStartResponse.ts`:**
   - Поддержать `jobs` array
   - Если `jobs` есть, вернуть `{ ok: true, jobs }`
   - Если `jobId` есть (старый формат), вернуть `{ ok: true, jobId }`

2. **Обновить `components/LearnPage.tsx`:**
   - Если `jobs` array, сохранить все `jobId` в URL или state
   - Polling для каждого job'а отдельно
   - Показать два блока статуса (EN + AR) с прогрессом и кнопками скачивания

---

## Порядок выполнения

1. **Этап 1** (критично) — исправить `output_too_large`
2. **Этап 2** (критично) — добавить обработку ошибок
3. **Этап 3** — создать компактный schema
4. **Этап 4** — исправить пути в Supabase
5. **Этап 5** — реализовать мультиязычность
6. **Этап 6** — обновить frontend

---

## Файлы для изменения

### Backend:
- `inngest/functions.ts` — разбить pipeline, исправить пути, добавить обработку ошибок
- `lib/pdf/schema.ts` — создать компактные schemas
- `lib/openai/generate.ts` — использовать компактные schemas
- `lib/storage.ts` — исправить пути (если нужно)
- `app/api/custom-course/route.ts` — мультиязычность (2 job'а)
- `app/api/ai-strategy/route.ts` — мультиязычность (2 job'а)
- `inngest/types.ts` — обновить типы событий

### Frontend:
- `lib/jobs/parseStartResponse.ts` — поддержать `jobs` array
- `components/LearnPage.tsx` — поддержать несколько job'ов

---

## Вопросы перед началом

1. **Генерация изображений (cover/diagrams):**
   - Отключить на этом этапе (как указано в step-4.1)?
   - Или оставить, но сделать отдельными steps?

2. **Формат `pdf_url` в БД:**
   - Использовать `supabase://course-pdf/custom/${filename}.pdf`?
   - Или `supabase://${bucket}/${key}`?

3. **Frontend для мультиязычности:**
   - Показывать два блока статуса (EN + AR) на одной странице?
   - Или один блок с переключателем языка?

---

## Готовность к началу

После вашего одобрения начну с **Этапа 1** (исправление `output_too_large`), так как это критично для работы pipeline.

