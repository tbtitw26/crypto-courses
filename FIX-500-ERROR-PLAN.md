# План исправления 500 ошибки

## Анализ проблемы

### Ошибка:
```
× the name `generateCustomCourse` is defined multiple times
× the name `generateAIStrategy` is defined multiple times
```

### Причина:
В файле `inngest/functions.ts` происходит конфликт имен:

1. **Импорты из `@/lib/openai/generate`:**
   - Строка 5: `import { generateCustomCourse } from "@/lib/openai/generate";`
   - Строка 6: `import { generateAIStrategy } from "@/lib/openai/generate";`
   - Это функции для генерации контента через LLM

2. **Экспорты Inngest functions:**
   - Строка 24: `export const generateCustomCourse = inngest.createFunction(...)`
   - Строка 329: `export const generateAIStrategy = inngest.createFunction(...)`
   - Это Inngest функции (workers)

3. **Использование:**
   - Строка 103: `const result = await generateCustomCourse({...})` - используется импортированная LLM функция
   - Строка 408: `const result = await generateAIStrategy({...})` - используется импортированная LLM функция

4. **Регистрация в `app/api/inngest/route.ts`:**
   - Строка 3: `import { helloWorld, generateCustomCourse, generateAIStrategy } from "../../../inngest/functions";`
   - Строка 12: `functions: [helloWorld, generateCustomCourse, generateAIStrategy],`
   - Здесь нужны экспортируемые Inngest functions

### Конфликт:
TypeScript/JavaScript не позволяет иметь два символа с одинаковым именем в одной области видимости:
- Импортированная функция `generateCustomCourse` (из `@/lib/openai/generate`)
- Экспортируемая константа `generateCustomCourse` (Inngest function)

---

## Решение

### Вариант 1: Переименовать импорты (рекомендуется)
Использовать aliases для импортов LLM функций, чтобы избежать конфликта:

**Изменения в `inngest/functions.ts`:**
1. Изменить импорты:
   ```ts
   import { generateCustomCourse as generateCustomCourseLLM } from "@/lib/openai/generate";
   import { generateAIStrategy as generateAIStrategyLLM } from "@/lib/openai/generate";
   ```

2. Обновить использование внутри функций:
   - Строка 103: `generateCustomCourse(...)` → `generateCustomCourseLLM(...)`
   - Строка 408: `generateAIStrategy(...)` → `generateAIStrategyLLM(...)`

3. Экспортируемые Inngest functions остаются с теми же именами:
   - `export const generateCustomCourse = ...` (без изменений)
   - `export const generateAIStrategy = ...` (без изменений)

**Преимущества:**
- Минимальные изменения
- Не требует изменений в `app/api/inngest/route.ts`
- Четкое разделение: LLM функции vs Inngest functions

---

### Вариант 2: Переименовать экспорты (не рекомендуется)
Переименовать экспортируемые Inngest functions, но это потребует изменений в `app/api/inngest/route.ts`.

---

## План действий

### Шаг 1: Изменить импорты в `inngest/functions.ts`
- Заменить строки 5-6 на импорты с aliases

### Шаг 2: Обновить использование LLM функций
- Найти все места, где используются `generateCustomCourse` и `generateAIStrategy` как LLM функции
- Заменить на `generateCustomCourseLLM` и `generateAIStrategyLLM`

### Шаг 3: Проверить, что экспорты остались без изменений
- Убедиться, что `export const generateCustomCourse = ...` и `export const generateAIStrategy = ...` остались с теми же именами

### Шаг 4: Проверить линтер
- Запустить `read_lints` для проверки ошибок

### Шаг 5: Проверить, что `app/api/inngest/route.ts` не требует изменений
- Убедиться, что импорты и регистрация функций работают корректно

---

## TODO список

- [ ] Изменить импорты в `inngest/functions.ts` (строки 5-6)
- [ ] Заменить `generateCustomCourse(...)` на `generateCustomCourseLLM(...)` (строка 103)
- [ ] Заменить `generateAIStrategy(...)` на `generateAIStrategyLLM(...)` (строка 408)
- [ ] Проверить линтер
- [ ] Убедиться, что экспорты Inngest functions остались с теми же именами
- [ ] Проверить, что `app/api/inngest/route.ts` не требует изменений

---

## Ожидаемый результат

После исправления:
- Нет конфликта имен
- LLM функции используются с aliases (`generateCustomCourseLLM`, `generateAIStrategyLLM`)
- Inngest functions экспортируются с оригинальными именами (`generateCustomCourse`, `generateAIStrategy`)
- `app/api/inngest/route.ts` продолжает работать без изменений
- 500 ошибка исчезает

