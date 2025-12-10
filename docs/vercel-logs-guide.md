# 📋 Инструкция: Как отслеживать генерацию на Vercel

## 🎯 Быстрый старт

После того как вы запустили генерацию (AI Strategy или Custom Course), используйте одну из команд:

### Вариант 1: Готовые скрипты (РЕКОМЕНДУЕТСЯ)

```powershell
# Для AI Strategy
npm run logs:vercel:ai

# Для Custom Course
npm run logs:vercel:course

# Для всех генераций сразу
npm run logs:vercel:all
```

Эти команды будут показывать логи в реальном времени (как `tail -f`).

---

## 📖 Детальная инструкция

### Шаг 1: Откройте PowerShell в папке проекта

```powershell
cd C:\Users\david\Documents\Web-Dev\Vitirni\forex_crypto
```

### Шаг 2: Выберите способ просмотра логов

#### Способ A: Готовые скрипты (проще всего)

```powershell
# Для AI Strategy
npm run logs:vercel:ai

# Для Custom Course  
npm run logs:vercel:course

# Для всех генераций
npm run logs:vercel:all
```

#### Способ B: Прямые команды Vercel CLI

```powershell
# Все логи за последний час (с фильтром по [GEN])
vercel logs --follow --since 1h | Select-String -Pattern "\[GEN\]"

# Только логи AI Strategy
vercel logs --follow --since 1h | Select-String -Pattern "\[GEN\]|/api/ai-strategy"

# Только логи Custom Course
vercel logs --follow --since 1h | Select-String -Pattern "\[GEN\]|/api/custom-course"
```

#### Способ C: Через Vercel Dashboard (без терминала)

1. Откройте https://vercel.com/dashboard
2. Выберите ваш проект
3. Перейдите в **Deployments** → выберите последний деплой
4. Нажмите **Functions** → выберите `/api/ai-strategy` или `/api/custom-course`
5. Откройте вкладку **Logs**
6. Фильтруйте по тексту `[GEN]` в поиске

---

## 🔍 Что вы увидите в логах

### Структура логов

Каждая строка с префиксом `[GEN]` содержит:

```
[GEN][INFO] [AI Strategy 5] Step 1/5: Generating English strategy... (elapsed: 12.3s)
[GEN][INFO] [AI Strategy 5] Step 2/5: Generating cover image... (elapsed: 45.7s)
[GEN][ERROR] [AI Strategy 5] Failed to generate PDF: TimeoutError
```

### Уровни логов

- `[GEN][INFO]` — обычная информация (шаги генерации, прогресс)
- `[GEN][WARN]` — предупреждения (медленная генерация, повторные попытки)
- `[GEN][ERROR]` — ошибки (неудачная генерация, таймауты)

### Примеры логов

```
[GEN][INFO] [AI Strategy 4] Starting generation... { strategyRunId: 4, userId: 1 }
[GEN][INFO] [AI Strategy 4] Step 1/5: Generating English strategy... (elapsed: 15.2s)
[GEN][INFO] [AI Strategy 4] Step 1 completed: English strategy generated (tokens: 1234, model: gpt-4o-mini)
[GEN][INFO] [AI Strategy 4] Step 2/5: Generating cover image... (elapsed: 28.5s)
[GEN][INFO] [AI Strategy 4] Step 2 completed: Cover image saved (size: 245KB)
[GEN][INFO] [AI Strategy 4] Step 3/5: Generating diagrams... (elapsed: 1m 12s)
[GEN][INFO] [AI Strategy 4] Step 3 completed: 2 diagrams saved
[GEN][INFO] [AI Strategy 4] Step 4/5: Generating PDF (EN)... (elapsed: 2m 34s)
[GEN][INFO] [AI Strategy 4] Step 4 completed: PDF saved (size: 1.2MB)
[GEN][INFO] [AI Strategy 4] Step 5/5: Translating to Arabic... (elapsed: 3m 15s)
[GEN][INFO] [AI Strategy 4] Generation completed successfully! (total time: 4m 23s)
```

---

## 🗄️ Просмотр логов в базе данных (Neon)

Если `LOG_TO_DB=true`, все логи также сохраняются в таблицу `GenerationLog`.

### SQL запросы для Neon

1. Откройте Neon Dashboard: https://console.neon.tech
2. Выберите ваш проект
3. Перейдите в **SQL Editor**
4. Выполните запросы:

#### Последние 50 логов

```sql
SELECT 
  id,
  run_id,
  run_type,
  level,
  message,
  meta,
  created_at
FROM "GenerationLog"
ORDER BY created_at DESC
LIMIT 50;
```

#### Только ошибки

```sql
SELECT 
  id,
  run_id,
  run_type,
  message,
  meta,
  created_at
FROM "GenerationLog"
WHERE level = 'error'
ORDER BY created_at DESC
LIMIT 20;
```

#### Логи для конкретной генерации

```sql
-- Для AI Strategy с ID = 5
SELECT 
  id,
  level,
  message,
  meta,
  created_at
FROM "GenerationLog"
WHERE run_type = 'ai-strategy' AND run_id = 5
ORDER BY created_at ASC;
```

---

## 📊 Просмотр статуса генерации в БД

### AI Strategy

```sql
SELECT 
  id,
  status,
  status_stage,
  status_progress,
  status_message,
  status_error,
  pdf_url,
  created_at,
  updated_at
FROM "AiStrategyRun"
ORDER BY created_at DESC
LIMIT 10;
```

### Custom Course

```sql
SELECT 
  id,
  status,
  status_stage,
  status_progress,
  status_message,
  status_error,
  pdf_url,
  created_at,
  updated_at
FROM "CustomCourseRequest"
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🛠️ Устранение проблем

### Проблема: Команда `vercel logs` не работает

**Решение:**
1. Убедитесь, что вы авторизованы: `vercel whoami`
2. Если не авторизованы: `vercel login`
3. Убедитесь, что проект привязан: `vercel link`

### Проблема: Логи не появляются

**Проверьте:**
1. Переменная `LOG_TO_DB=true` установлена в Vercel Environment Variables
2. Выполнен redeploy после установки переменной
3. Генерация действительно запущена (проверьте статус в БД)

### Проблема: Логи слишком много

**Используйте фильтры:**
```powershell
# Только ошибки
vercel logs --follow --since 1h | Select-String -Pattern "\[GEN\]\[ERROR\]"

# Только конкретная генерация (например, ID = 5)
vercel logs --follow --since 1h | Select-String -Pattern "\[AI Strategy 5\]"
```

---

## 📝 Полезные команды

```powershell
# Проверить статус авторизации Vercel
vercel whoami

# Список всех проектов
vercel projects

# Логи конкретного деплоя (нужен deployment URL)
vercel logs <deployment-url> --follow

# Логи за последние 24 часа
vercel logs --since 24h | Select-String -Pattern "\[GEN\]"
```

---

## ✅ Чеклист для отслеживания генерации

- [ ] Установлена переменная `LOG_TO_DB=true` в Vercel
- [ ] Выполнен redeploy после установки переменной
- [ ] Запущена генерация (AI Strategy или Custom Course)
- [ ] Открыт терминал с командой `npm run logs:vercel:all`
- [ ] Видны логи с префиксом `[GEN]`
- [ ] Проверен статус в БД (Neon) через SQL запросы
- [ ] При ошибках проверены логи в таблице `GenerationLog`

---

## 🎯 Рекомендации

1. **Для быстрого мониторинга**: Используйте `npm run logs:vercel:all` в отдельном окне терминала
2. **Для детального анализа**: Используйте SQL запросы к таблице `GenerationLog`
3. **Для отладки ошибок**: Комбинируйте Vercel Logs (консоль) + БД логи (детали в `meta`)

---

**Готово!** Теперь вы можете отслеживать генерацию в реальном времени на Vercel так же удобно, как локально.

