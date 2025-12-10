# 🚨 Быстрое отслеживание ошибок генерации

## ⚡ После запуска генерации Custom Course

### 1. **Vercel Logs (PowerShell)**
```powershell
# Откройте PowerShell в директории проекта
cd C:\Users\david\Documents\Web-Dev\Vitirni\forex_crypto

# Запустите мониторинг логов Custom Course
npm run logs:vercel:course

# Или следовать в реальном времени
.\scripts\vercel-logs-custom-course.ps1 --Follow
```

### 2. **Vercel Dashboard**
1. Откройте: https://vercel.com/dashboard
2. Выберите проект `forex_crypto`
3. Перейдите в **Logs** (левое меню)
4. Фильтр: `/api/custom-course`

### 3. **Database Logs (Neon SQL Editor)**
1. Откройте: https://console.neon.tech
2. Выберите проект → **SQL Editor**
3. Выполните:

```sql
-- Последние ошибки Custom Course
SELECT * FROM "GenerationLog" 
WHERE run_type = 'custom-course' 
  AND level = 'error'
ORDER BY created_at DESC 
LIMIT 20;

-- Статус последнего Custom Course
SELECT 
  id,
  status,
  status_stage,
  status_progress,
  status_message,
  status_error,
  created_at
FROM "CustomCourseRequest"
ORDER BY created_at DESC
LIMIT 1;
```

### 4. **Supabase Storage**
1. Откройте: https://supabase.com/dashboard
2. Проект → **Storage**
3. Проверьте bucket `course-pdf` на наличие загруженных PDF

---

## 🔧 Исправление проблемы с DATABASE_URL

**Проблема:** Build падает с ошибкой `DATABASE_URL is not set`

**Решение:**
1. Откройте Vercel Dashboard → Project → Settings → Environment Variables
2. Добавьте:
   - **Name:** `DATABASE_URL`
   - **Value:** `postgresql://neondb_owner:npg_obxJTEg3GZi8@ep-old-darkness-agz7s4qy-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require`
   - **Environment:** Production, Preview, Development (все три)
3. Сохраните и передеплойте проект

---

## 📋 Чек-лист Environment Variables в Vercel

Убедитесь что установлены:

- ✅ `DATABASE_URL` - **КРИТИЧНО!** (сейчас отсутствует)
- ✅ `LOG_TO_DB=true` - для записи логов в БД
- ✅ `NEXTAUTH_SECRET`
- ✅ `NEXTAUTH_URL=https://www.avenqor.net`
- ✅ `OPENAI_API_KEY`
- ✅ `BROWSERLESS_API_KEY`
- ✅ `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

---

## 🎯 Команды для быстрого мониторинга

```powershell
# 1. Проверить статус деплоев
vercel ls

# 2. Мониторинг логов Custom Course
npm run logs:vercel:course

# 3. Только ошибки
.\scripts\vercel-logs-errors.ps1

# 4. Build logs последнего деплоя
vercel inspect $(vercel ls | Select-String "https://.*vercel\.app" | Select-Object -First 1).Line.Trim() --logs
```

