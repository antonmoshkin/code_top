# Настройка и запуск проекта Medusa Next.js

## Предварительные требования

1. **Docker Desktop** - должен быть установлен и запущен
2. **Node.js** версии 18 или выше
3. **Yarn** пакетный менеджер

## Быстрый запуск

### Вариант 1: Автоматический запуск (Windows)

```powershell
# В PowerShell
.\start-project.ps1
```

### Вариант 2: Автоматический запуск (Linux/Mac)

```bash
# Сделать скрипт исполняемым
chmod +x start-project.sh

# Запустить
./start-project.sh
```

### Вариант 3: Ручной запуск

1. **Запустить базу данных:**
   ```bash
   docker-compose up -d
   ```

2. **Установить зависимости:**
   ```bash
   yarn install
   ```

3. **Создать .env.local файл** (скопировать содержимое из .env.example)

4. **Запустить Next.js приложение:**
   ```bash
   yarn dev
   ```

## Настройка Medusa сервера

Для полной работы e-commerce функциональности нужен Medusa сервер:

```bash
# Создать новый Medusa проект
npx create-medusa-app@latest

# Или клонировать существующий
git clone <your-medusa-repo>
cd <medusa-project>
yarn install
yarn dev
```

Medusa сервер должен работать на порту 9000.

## Структура проекта

- **Frontend**: Next.js приложение на порту 8000
- **Database**: PostgreSQL на порту 5432
- **Cache**: Redis на порту 6379
- **Backend**: Medusa сервер на порту 9000

## Переменные окружения

Основные переменные в `.env.local`:

```env
DATABASE_URL=postgres://medusa:medusa123@localhost:5432/medusa
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
JWT_SECRET=your_jwt_secret_here
COOKIE_SECRET=your_cookie_secret_here
```

## Полезные команды

```bash
# Остановить контейнеры
docker-compose down

# Просмотреть логи контейнеров
docker-compose logs -f

# Перезапустить контейнеры
docker-compose restart

# Очистить все данные (осторожно!)
docker-compose down -v
```

## Устранение проблем

1. **Docker не запущен**: Запустите Docker Desktop
2. **Порт занят**: Измените порты в docker-compose.yml
3. **Ошибки подключения к БД**: Подождите 10-15 секунд после запуска контейнеров
4. **Medusa сервер недоступен**: Убедитесь что он запущен на порту 9000

## Доступ к приложению

- **Frontend**: http://localhost:8000
- **Medusa Admin**: http://localhost:9000/app
- **API**: http://localhost:9000/store
