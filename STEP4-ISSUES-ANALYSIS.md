# Step 4 — Анализ проблем и план действий

## Обнаруженные проблемы

### 1. Pipeline застрял на `llm:generate` step
**Симптомы:**
- В Inngest Dev Server видны только первые 2 шага: `db:load-job`, `db:set-processing`
- Не видны: `llm:generate`, `db:store-content`, `db:set-uploading`, `storage:upload`, `db:set-ready`
- Статус в БД: `'Starting generation...'` (stage: `generating`, progress: 5%)
- Прошло 12 минут, статус не изменился

**Возможные причины:**
- `generateCustomCourseComplete()` выполняется очень долго (>12 минут)
- Функция упала с ошибкой, но ошибка не была обработана
- Timeout в Inngest (но должен быть виден в логах)
- Проблема с генерацией изображений (cover, diagrams) — они могут занимать много времени

**Что проверить:**
- Логи Inngest Dev Server для run `01KCE3KBPRVBFBK1EKJE8X7T78`
- Логи Next.js dev server
- Файл `consol.log` или другие логи генерации

---

### 2. PDF имеет 17 страниц вместо 2-3
**Симптомы:**
- PDF уже есть в Supabase
- Размер: 17 страниц
- Требование: максимум 2-3 страницы

**Причина:**
`CUSTOM_COURSE_JSON_SCHEMA` все еще позволяет слишком много контента:
- **3-4 модуля** (minItems: 3, maxItems: 4)
- **2-4 урока на модуль** (minItems: 2, maxItems: 4)
- **2-4 content_blocks на урок** (minItems: 2, maxItems: 4)
- Плюс все остальные секции:
  - `preface` (3-6 bullets для `what_you_will_learn`, 4+ bullets для `what_this_course_will_not_do`)
  - `glossary` (8-12 терминов)
  - `quiz` (5-8 вопросов)
  - `one_page_summary` (4-6 секций)
  - `diagrams` (2-3 диаграммы)
  - `legal_notice`, `how_to_use`, `footer_and_versioning`

**Расчет:**
- 4 модуля × 4 урока × 4 content_blocks = 64 блока контента
- Плюс все остальные секции = **минимум 100+ блоков контента**
- Это явно больше, чем 2-3 страницы A4

**Решение:**
Нужно создать **новый компактный schema** специально для 2-3 страниц:
- **1-2 модуля** (не 3-4)
- **1-2 урока на модуль** (не 2-4)
- **1-2 content_blocks на урок** (не 2-4)
- **Минимум остальных секций:**
  - `preface`: сократить до 2-3 bullets
  - `glossary`: 3-6 терминов (не 8-12)
  - `quiz`: 3-5 вопросов (не 5-8)
  - `one_page_summary`: 2-3 секции (не 4-6)
  - `diagrams`: 0-1 диаграмма (не 2-3)

---

### 3. PDF уже есть в Supabase, но нельзя скачать
**Симптомы:**
- PDF есть в Supabase Storage
- Статус в БД: `'Starting generation...'` (не `ready`)
- Нет ссылки для скачивания в UI

**Возможные причины:**
- PDF был загружен из другого процесса (старый код?)
- Pipeline упал после загрузки PDF, но до обновления статуса
- `pdf_url` не был сохранен в БД
- Status endpoint не возвращает signed URL, потому что статус не `ready`

**Что проверить:**
- В БД: есть ли `pdf_url` в `CustomCourseRequest` для jobId=9?
- В Supabase Storage: какой путь у PDF? Соответствует ли он `custom-courses/{userId}/9.pdf`?
- Логи Inngest: был ли выполнен step `storage:upload`?

---

### 4. Сгенерировался только английский, хотя выбраны 2 языка
**Симптомы:**
- В форме выбраны оба языка: `['en', 'ar']`
- Сгенерирован только английский PDF

**Причина:**
В `inngest/functions.ts` мы передаем только первый язык:
```typescript
const firstLanguage = languages[0] || language;
// ...
languages: [firstLanguage], // Only first language for this job
```

Но в `generateCustomCourseComplete()` есть логика:
```typescript
const needsArabic = params.languages.includes('ar')
if (needsArabic) {
  // Генерирует арабский
}
```

**Проблема:**
Мы передаем `languages: ['en']` (только первый язык), поэтому `needsArabic = false`, и арабский не генерируется.

**Решение:**
Согласно требованиям Step 4, **один PDF на job** (первый язык). Это правильное поведение. Но нужно убедиться, что:
- Если пользователь выбрал оба языка, нужно создать **два отдельных job'а** (один для EN, один для AR)
- Или изменить логику: если выбраны оба языка, генерировать оба PDF в одном job'е

**Вопрос к пользователю:**
Как должно работать, если выбраны оба языка?
- Вариант A: Один job → один PDF (первый язык) — **текущее поведение**
- Вариант B: Один job → два PDF (EN и AR) — нужно изменить логику
- Вариант C: Два job'а → два PDF (один для EN, один для AR) — нужно изменить frontend

---

### 5. Статус все еще 'generating' и 5%
**Симптомы:**
- На странице `/learn?tab=custom&jobId=9` статус: `'generating'`
- Progress: 5%
- Прошло 12 минут

**Причина:**
Pipeline застрял на `llm:generate` step (см. проблему #1).

---

## План действий

### Приоритет 1: Исправить застревание pipeline
1. **Проверить логи Inngest Dev Server:**
   - Открыть run `01KCE3KBPRVBFBK1EKJE8X7T78`
   - Проверить логи для step `llm:generate`
   - Найти ошибку или причину застревания

2. **Проверить логи Next.js:**
   - Проверить `consol.log` или другие логи
   - Найти ошибки в `generateCustomCourseComplete()`

3. **Возможные исправления:**
   - Добавить timeout для `generateCustomCourseComplete()` (если его нет)
   - Разбить `generateCustomCourseComplete()` на отдельные steps в Inngest:
     - `llm:generate-content` (только генерация контента)
     - `images:generate-cover` (генерация cover image)
     - `images:generate-diagrams` (генерация diagrams)
     - `pdf:generate` (генерация PDF)
   - Это позволит видеть прогресс и обрабатывать ошибки на каждом этапе

---

### Приоритет 2: Создать компактный schema для 2-3 страниц
1. **Создать новый schema:**
   - `COMPACT_CUSTOM_COURSE_JSON_SCHEMA` (или изменить существующий `CUSTOM_COURSE_JSON_SCHEMA`)
   - Ограничения:
     - 1-2 модуля (не 3-4)
     - 1-2 урока на модуль (не 2-4)
     - 1-2 content_blocks на урок (не 2-4)
     - Минимум остальных секций

2. **Обновить промпт:**
   - Усилить требования к компактности в `buildCustomCoursePrompt()`
   - Добавить примеры желаемого объема контента

3. **Обновить `generateCustomCourse()`:**
   - Использовать новый компактный schema

---

### Приоритет 3: Исправить проблему с PDF в Supabase
1. **Проверить БД:**
   - Есть ли `pdf_url` в `CustomCourseRequest` для jobId=9?
   - Если нет, значит pipeline упал до сохранения `pdf_url`

2. **Проверить Supabase Storage:**
   - Какой путь у PDF?
   - Соответствует ли он ожидаемому формату?

3. **Исправить pipeline:**
   - Убедиться, что `pdf_url` сохраняется в БД **до** обновления статуса на `ready`
   - Добавить обработку ошибок для случая, когда PDF загружен, но статус не обновлен

---

### Приоритет 4: Решить вопрос с языками
1. **Определить желаемое поведение:**
   - Один job → один PDF (первый язык) — **текущее поведение**
   - Один job → два PDF (EN и AR) — нужно изменить логику
   - Два job'а → два PDF — нужно изменить frontend

2. **Реализовать выбранный вариант**

---

## Вопросы к пользователю

1. **Как должно работать, если выбраны оба языка?**
   - Вариант A: Один job → один PDF (первый язык) — **текущее поведение**
   - Вариант B: Один job → два PDF (EN и AR)
   - Вариант C: Два job'а → два PDF (один для EN, один для AR)

2. **Можете ли вы предоставить логи Inngest Dev Server для run `01KCE3KBPRVBFBK1EKJE8X7T78`?**
   - Особенно логи для step `llm:generate`
   - Это поможет понять, почему pipeline застрял

3. **В БД для jobId=9:**
   - Есть ли `pdf_url`?
   - Какой статус (`status`, `status_stage`, `status_progress`)?

4. **В Supabase Storage:**
   - Какой путь у PDF для jobId=9?
   - Соответствует ли он `custom-courses/{userId}/9.pdf`?

---

## Следующие шаги

После получения ответов на вопросы и проверки логов:
1. Исправить застревание pipeline (разбить на отдельные steps)
2. Создать компактный schema для 2-3 страниц
3. Исправить проблему с сохранением `pdf_url`
4. Реализовать выбранный вариант для языков

