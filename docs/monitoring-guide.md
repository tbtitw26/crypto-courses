# 🔍 Руководство по мониторингу ошибок генерации

## 📍 Где отслеживать ошибки

### 1. **Vercel Logs** (Runtime ошибки)
Логи выполнения функций и API routes в реальном времени.

**Команды:**
```powershell
# Логи Custom Course (фильтрованные)
npm run logs:vercel:course

# Все логи генерации
npm run logs:vercel:all

# Только ошибки
.\scripts\vercel-logs-errors.ps1

# Следить в реальном времени
.\scripts\vercel-logs-custom-course.ps1 --Follow
```

**Или через Vercel Dashboard:**
1. Откройте https://vercel.com/dashboard
2. Выберите проект `forex_crypto`
3. Перейдите в раздел **Logs**
4. Фильтруйте по `/api/custom-course` или `/api/ai-strategy`

**Что искать:**
- `[ERROR]` - ошибки логирования
- `Custom Course API` - события Custom Course
- `Generation failed` - ошибки генерации
- `Watchdog timeout` - таймауты
- `Error sending` - ошибки отправки email

---

### 2. **Vercel Build Logs** (Ошибки сборки)
Логи процесса сборки проекта.

**Команда:**
```powershell
# Получить последний deployment
$deployments = vercel ls
# Скопировать URL из вывода

# Просмотреть build logs
vercel inspect <deployment-url> --logs
```

**Или через Dashboard:**
1. Vercel Dashboard → Project → Deployments
2. Выберите deployment с ошибкой (статус ● Error)
3. Откройте вкладку **Build Logs**

**Что искать:**
- `Error:` - ошибки компиляции
- `Failed to build` - ошибки сборки
- `Module not found` - отсутствующие зависимости
- `Type error` - ошибки TypeScript

---

### 3. **Database Logs (GenerationLog таблица)**
Детальные логи генерации, записанные в БД.

**Требования:**
- Убедитесь что `LOG_TO_DB=true` в Vercel Environment Variables

**Просмотр через Neon SQL Editor:**
1. Откройте https://console.neon.tech
2. Выберите проект → SQL Editor
3. Выполните запрос:

```sql
-- Последние ошибки Custom Course
SELECT * FROM "GenerationLog" 
WHERE run_type = 'custom-course' 
  AND level = 'error'
ORDER BY created_at DESC 
LIMIT 50;

-- Все логи конкретного Custom Course
SELECT * FROM "GenerationLog" 
WHERE run_id = <courseRequestId>
  AND run_type = 'custom-course'
ORDER BY created_at ASC;

-- Статистика ошибок за последние 24 часа
SELECT 
  run_type,
  level,
  COUNT(*) as count,
  MAX(created_at) as last_error
FROM "GenerationLog"
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND level = 'error'
GROUP BY run_type, level
ORDER BY count DESC;
```

**Просмотр через Prisma Studio (локально):**
```powershell
npx prisma studio
```
Откройте таблицу `GenerationLog` и фильтруйте по `run_type` и `level`.

---

### 4. **Supabase Storage Logs**
Ошибки загрузки/доступа к файлам (PDF, изображения).

**Просмотр:**
1. Откройте https://supabase.com/dashboard
2. Выберите проект → Storage
3. Проверьте buckets:
   - `course-pdf` - PDF файлы курсов
   - `course-images` - изображения курсов
   - `course-media` - медиа файлы

**Что проверять:**
- Успешные загрузки файлов
- Ошибки доступа (403, 404)
- Размеры файлов (слишком большие?)

**Логи в коде:**
Ищите в Vercel logs:
- `Failed to upload to Supabase`
- `Supabase storage error`
- `Error creating signed URL`

---

### 5. **Email Logs (SMTP)**
Ошибки отправки email (invoice, course delivery).

**Просмотр:**
Ищите в Vercel logs:
```powershell
.\scripts\vercel-logs-errors.ps1 | Select-String -Pattern "email|Email|SMTP|sendCourseDeliveryEmail|sendPurchaseConfirmationEmail"
```

**Что искать:**
- `Error sending invoice email`
- `Error sending course delivery email`
- `SMTP connection failed`
- `Email delivery failed`

**Проверка SMTP настроек:**
Убедитесь что в Vercel Environment Variables установлены:
- `SMTP_HOST`
- `SMTP_PORT=465`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `SMTP_FROM_NAME`

---

## 🚨 Быстрая диагностика после запуска генерации

### Шаг 1: Проверьте статус деплоя
```powershell
vercel ls
```
Если все деплои показывают `● Error` - проблема в сборке, проверьте Build Logs.

### Шаг 2: Запустите мониторинг логов
```powershell
# В отдельном окне PowerShell
.\scripts\vercel-logs-custom-course.ps1 --Follow
```

### Шаг 3: Проверьте статус генерации в БД
```sql
-- В Neon SQL Editor
SELECT 
  id,
  status,
  status_stage,
  status_progress,
  status_message,
  status_error,
  created_at,
  updated_at
FROM "CustomCourseRequest"
WHERE user_id = <your_user_id>
ORDER BY created_at DESC
LIMIT 5;
```

### Шаг 4: Проверьте логи в GenerationLog
```sql
SELECT 
  run_id,
  run_type,
  level,
  message,
  meta,
  created_at
FROM "GenerationLog"
WHERE run_type = 'custom-course'
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

---

## 📊 Типичные ошибки и решения

### 1. "Watchdog timeout"
**Причина:** Генерация превысила 12 минут
**Решение:** Проверьте логи на этапе зависания, возможно проблема с OpenAI API или PDF генерацией

### 2. "Error in PostgreSQL connection: Closed"
**Причина:** Потеря соединения с БД
**Решение:** Уже исправлено через `withPrismaRetry`, но проверьте `DATABASE_URL` в Vercel

### 3. "Failed to write log to DB"
**Причина:** Проблема записи в `GenerationLog`
**Решение:** Проверьте что `LOG_TO_DB=true` и таблица `GenerationLog` существует

### 4. "Error sending email"
**Причина:** Проблема SMTP
**Решение:** Проверьте SMTP credentials в Vercel Environment Variables

### 5. "Supabase storage error"
**Причина:** Проблема загрузки файлов
**Решение:** Проверьте `SUPABASE_SERVICE_ROLE_KEY` и права доступа к buckets

---

## 🔧 Полезные команды

### Получить последний успешный deployment
```powershell
vercel ls | Select-String -Pattern "Ready" | Select-Object -First 1
```

### Просмотреть все environment variables
```powershell
vercel env ls
```

### Проверить конкретный deployment
```powershell
vercel inspect https://forexcrypto-xxxxx.vercel.app
```

### Просмотреть build logs конкретного deployment
```powershell
vercel inspect https://forexcrypto-xxxxx.vercel.app --logs
```

---

## 📝 Чек-лист после запуска генерации

- [ ] Проверить статус в Vercel Dashboard (Deployments)
- [ ] Запустить мониторинг логов: `npm run logs:vercel:course`
- [ ] Проверить статус в БД: `SELECT status FROM CustomCourseRequest WHERE id = X`
- [ ] Проверить логи в `GenerationLog` таблице
- [ ] Проверить загрузку файлов в Supabase Storage
- [ ] Проверить отправку email (если статус `ready` или `completed`)

---

## 🆘 Если ничего не помогает

1. **Проверьте все Environment Variables в Vercel**
2. **Проверьте что последний коммит успешно задеплоился**
3. **Проверьте Build Logs на ошибки компиляции**
4. **Проверьте что `LOG_TO_DB=true` установлен**
5. **Проверьте подключение к БД через `vercel env pull` и `npx prisma studio`**

