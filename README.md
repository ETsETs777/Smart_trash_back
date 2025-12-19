# Smart Trash Backend

Backend приложение для системы управления сортировкой отходов, построенное на NestJS с GraphQL API.

## Технологии

- **NestJS** - Node.js фреймворк
- **GraphQL** - API с Apollo Server
- **TypeORM** - ORM для работы с PostgreSQL
- **PostgreSQL** - база данных
- **MinIO** - S3-совместимое хранилище файлов
- **Redis** - кэширование и очереди (BullMQ)
- **GigaChat** - AI для классификации отходов
- **JWT** - аутентификация
- **Docker** - контейнеризация

## Требования

- Node.js 18+ 
- npm или yarn
- Docker и Docker Compose
- PostgreSQL 15+ (через Docker)

## Установка и запуск

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка переменных окружения

Создайте файл `.env.dev` в корне проекта (или скопируйте из `dev.env`):

```env
NODE_ENV=dev
SERVER_PORT=5000
JWT_TOKEN_SECRET=dev-secret-key-change-in-production
JWT_USER_TOKEN_EXPIRES_IN=7d

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=1qa2ws3ed
DB_DATABASE=smart_trash_app_template_dev

# S3 (MinIO)
S3_ENDPOINT=localhost
S3_PORT=9000
S3_ACCESS_KEY=12345678
S3_SECRET_KEY=12345678
S3_BUCKET_NAME=smart-trash

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# SMTP (опционально для разработки)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password
SMTP_FROM=your-email@gmail.com

# GigaChat
GIGACHAT_API_KEY=your-api-key
GIGACHAT_SCOPE=GIGACHAT_API_PERS
GIGACHAT_REJECT_UNAUTHORIZED=false
GIGACHAT_BASE_URL=https://ngw.devices.sberbank.ru:9443/api/v2
GIGACHAT_AUTH_URL=https://ngw.devices.sberbank.ru:9443/api/v2/oauth
GIGACHAT_MODEL=GigaChat

# Public API URL
PUBLIC_API_URL=http://localhost:5000
```

### 3. Запуск Docker контейнеров

Из корневой директории проекта (где находится `docker-compose.yml`):

```bash
cd ../..
docker-compose up -d postgres minio redis
```

Это запустит:
- **PostgreSQL** на порту `5432`
- **MinIO** на портах `9000` (API) и `9001` (Console)
- **Redis** на порту `6379`

### 4. Создание базы данных

После запуска PostgreSQL, создайте базу данных:

```bash
docker exec smart-trash-postgres psql -U postgres -c "CREATE DATABASE smart_trash_app_template_dev OWNER postgres;"
```

### 5. Запуск бэкенда

#### Режим разработки (с hot-reload):

```bash
npm run start:dev
```

Приложение будет доступно на `http://localhost:5000`

#### Другие команды:

```bash
# Production режим
npm run start:prod

# Debug режим
npm run start:debug

# Сборка
npm run build
```

## API Endpoints

### GraphQL

- **Playground**: http://localhost:5000/graphql
- **API**: http://localhost:5000/graphql

### REST API

- **Health check**: `GET /`
- **Email confirmation**: `GET /confirm-email?token=...`
- **Images**: 
  - `GET /images/:id` - получить изображение
  - `POST /images/upload` - загрузить изображение
- **Files**: 
  - `GET /files/:id` - получить файл
  - `POST /files/upload` - загрузить файл

## Структура проекта

```
src/
├── entities/          # TypeORM сущности
│   ├── files/         # Файлы и изображения
│   └── smart-trash/   # Доменные сущности
├── modules/           # Модули приложения
│   ├── auth/          # Аутентификация и авторизация
│   ├── config/        # Конфигурация
│   ├── files/         # Работа с файлами
│   ├── gigachat/      # Интеграция с GigaChat
│   └── smart-trash/   # Основной бизнес-логика
│       ├── resolvers/ # GraphQL резолверы
│       ├── services/   # Сервисы
│       └── queues/    # Очереди BullMQ
├── decorators/        # Кастомные декораторы
├── common/            # Общие утилиты
└── main.ts            # Точка входа
```

## Основные функции

- ✅ Регистрация и аутентификация (JWT)
- ✅ Управление компаниями
- ✅ Управление сотрудниками
- ✅ Классификация отходов через GigaChat AI
- ✅ Геймификация (достижения, рейтинг)
- ✅ Аналитика и статистика
- ✅ Загрузка и хранение файлов (MinIO)
- ✅ Email подтверждение

## Миграции базы данных

TypeORM автоматически создает таблицы при запуске (`synchronize: true` в dev режиме).

Для production используйте миграции:

```bash
# Создать миграцию
npm run migration:create

# Сгенерировать миграцию
npm run migration:generate

# Применить миграции
npm run migration:run

# Откатить миграцию
npm run migration:revert
```

## Тестирование

```bash
# Unit тесты
npm run test

# E2E тесты
npm run test:e2e

# Покрытие кода
npm run test:cov
```

## Troubleshooting

### Ошибка подключения к базе данных

1. Убедитесь, что Docker контейнеры запущены:
   ```bash
   docker ps
   ```

2. Проверьте, что база данных создана:
   ```bash
   docker exec smart-trash-postgres psql -U postgres -c "\l"
   ```

3. Проверьте переменные окружения в `.env.dev`

### Ошибка подключения к MinIO

1. Проверьте, что MinIO запущен:
   ```bash
   docker ps | grep minio
   ```

2. Откройте MinIO Console: http://localhost:9001
   - Логин: `12345678`
   - Пароль: `12345678`

### Ошибка подключения к Redis

1. Проверьте статус Redis:
   ```bash
   docker exec smart-trash-redis redis-cli ping
   ```

## Лицензия

MIT
