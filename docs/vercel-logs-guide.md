# 📋 Vercel Logs Guide - Просмотр логов через PowerShell

## ⚠️ Важно: Изменения в Vercel CLI v49

В новой версии Vercel CLI (49.1.2) синтаксис команд изменился:
- ❌ **Старый синтаксис** (не работает): `vercel logs --prod --follow`
- ✅ **Новый синтаксис**: `vercel logs <deployment-url>`

## 🚀 Быстрый старт

### 1. Авторизация (один раз)
```powershell
vercel login
```

### 2. Просмотр логов Custom Course
```powershell
# Через npm script
npm run logs:vercel:course

# Или напрямую
.\scripts\vercel-logs-custom-course.ps1
```

### 3. Просмотр всех логов генерации
```powershell
npm run logs:vercel:all
```

### 4. Просмотр только ошибок
```powershell
.\scripts\vercel-logs-errors.ps1
```

## 📝 Доступные скрипты

### `scripts/vercel-logs-custom-course.ps1`
Фильтрует логи для Custom Course генерации:
- Custom Course API
- [ERROR], [GEN] префиксы
- Generation failed
- Error sending
- Watchdog timeout

**Использование:**
```powershell
.\scripts\vercel-logs-custom-course.ps1
.\scripts\vercel-logs-custom-course.ps1 --Follow
```

### `scripts/vercel-logs-ai-strategy.ps1`
Фильтрует логи для AI Strategy генерации:
- AI Strategy
- /api/ai-strategy
- [GEN] префиксы

**Использование:**
```powershell
.\scripts\vercel-logs-ai-strategy.ps1
.\scripts\vercel-logs-ai-strategy.ps1 --Follow
```

### `scripts/vercel-logs-all.ps1`
Показывает все логи генерации (Custom Course + AI Strategy):
- [GEN] префиксы
- Custom Course
- AI Strategy
- Generation

**Использование:**
```powershell
.\scripts\vercel-logs-all.ps1
.\scripts\vercel-logs-all.ps1 --Follow
```

### `scripts/vercel-logs-errors.ps1`
Показывает только ошибки:
- error, Error, ERROR
- failed, Failed, FAILED
- exception, Exception

**Использование:**
```powershell
.\scripts\vercel-logs-errors.ps1
.\scripts\vercel-logs-errors.ps1 --Follow
```

### `scripts/vercel-logs.ps1`
Универсальный скрипт с фильтрацией:
```powershell
.\scripts\vercel-logs.ps1
.\scripts\vercel-logs.ps1 --Follow
.\scripts\vercel-logs.ps1 --Filter "Custom Course"
```

## 🔧 Ручные команды

### Получить список деплоев
```powershell
vercel ls
```

### Получить последний production deployment
```powershell
$deployments = vercel ls --json | ConvertFrom-Json
$prod = $deployments | Where-Object { $_.target -eq "production" } | Sort-Object -Property createdAt -Descending | Select-Object -First 1
$prod.url
```

### Просмотр логов конкретного деплоя
```powershell
vercel logs https://forexcrypto-xxxxx.vercel.app
```

### Просмотр логов в JSON формате
```powershell
vercel logs https://forexcrypto-xxxxx.vercel.app --json
```

### Просмотр build логов
```powershell
vercel inspect https://forexcrypto-xxxxx.vercel.app --logs
```

## 📊 Что показывают логи

### Runtime Logs (`vercel logs`)
- Логи выполнения функций (API routes)
- Console.log, console.error из вашего кода
- Ошибки выполнения
- **Важно**: Показывает логи только за последние 5 минут с момента запуска команды

### Build Logs (`vercel inspect --logs`)
- Логи сборки проекта
- Ошибки компиляции
- Ошибки установки зависимостей

## 🎯 Рекомендации

1. **Для отслеживания Custom Course генерации:**
   ```powershell
   npm run logs:vercel:course
   ```

2. **Для поиска ошибок:**
   ```powershell
   .\scripts\vercel-logs-errors.ps1 --Follow
   ```

3. **Для общего мониторинга:**
   ```powershell
   npm run logs:vercel:all
   ```

## ⚡ NPM Scripts

В `package.json` доступны удобные команды:
- `npm run logs:vercel:course` - логи Custom Course
- `npm run logs:vercel:ai` - логи AI Strategy  
- `npm run logs:vercel:all` - все логи генерации

## 🔍 Фильтрация в PowerShell

Все скрипты используют `Select-String` для фильтрации. Вы можете модифицировать паттерны:

```powershell
# Пример: добавить свой фильтр
vercel logs $deploymentUrl | Select-String -Pattern "ваш_паттерн"
```

## ⚠️ Ограничения

1. **Runtime logs** показывают только логи за последние 5 минут с момента запуска команды
2. Для просмотра старых логов используйте Vercel Dashboard или `vercel inspect --logs`
3. Логи в реальном времени требуют активного деплоя

## 📚 Дополнительные ресурсы

- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Vercel Logs API](https://vercel.com/docs/observability/logs)
