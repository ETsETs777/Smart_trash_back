# Smart Trash Backend

![NestJS](https://img.shields.io/badge/NestJS-10.0.0-E0234E?logo=nestjs)
![GraphQL](https://img.shields.io/badge/GraphQL-16.10.0-E10098?logo=graphql)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)
![TypeScript](https://img.shields.io/badge/TypeScript-5.1.3-3178C6?logo=typescript)

Backend приложение для системы управления сортировкой отходов, построенное на NestJS с GraphQL API.

## 📋 Содержание

- [Технологии](#технологии)
- [Требования](#требования)
- [Быстрый старт](#быстрый-старт)
- [Установка и настройка](#установка-и-настройка)
- [API документация](#api-документация)
- [Структура проекта](#структура-проекта)
- [Разработка](#разработка)
- [Тестирование](#тестирование)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## 🛠 Технологии

### Основной стек
- **[NestJS](https://nestjs.com/)** 10.0.0 - Node.js фреймворк для построения масштабируемых серверных приложений
- **[GraphQL](https://graphql.org/)** 16.10.0 - Язык запросов для API с Apollo Server
- **[TypeORM](https://typeorm.io/)** 0.3.20 - ORM для работы с PostgreSQL
- **[PostgreSQL](https://www.postgresql.org/)** 15+ - Реляционная база данных
- **[TypeScript](https://www.typescriptlang.org/)** 5.1.3 - Типизированный JavaScript

### Дополнительные сервисы
- **[MinIO](https://min.io/)** - S3-совместимое хранилище файлов
- **[Redis](https://redis.io/)** 7 - Кэширование и очереди (BullMQ)
- **[GigaChat](https://developers.sber.ru/gigachat)** - AI для классификации отходов
- **[BullMQ](https://docs.bullmq.io/)** - Очереди задач на основе Redis
- **[JWT](https://jwt.io/)** - Аутентификация и авторизация
- **[Nodemailer](https://nodemailer.com/)** - Отправка email

## 📦 Требования

- **Node.js** 18+ ([скачать](https://nodejs.org/))
- **npm** или **yarn**
- **Docker** и **Docker Compose** ([скачать](https://www.docker.com/get-started))
- **PostgreSQL** 15+ (через Docker)

## 🚀 Быстрый старт

```bash
# 1. Установить зависимости
npm install

# 2. Создать .env.dev файл (см. раздел "Настройка переменных окружения")

# 3. Запустить Docker контейнеры
docker-compose -f docker-compose.dev.yml up -d postgres minio redis

# 4. Создать базу данных
docker exec smart-trash-postgres-dev psql -U postgres -c "CREATE DATABASE smart_trash_app_template_dev;"

# 5. Запустить backend
npm run start:dev
```

Backend будет доступен на `http://localhost:5000`

## ⚙️ Установка и настройка

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка переменных окружения

Создайте файл `.env.dev` в корне проекта:

```env
# Общие настройки
NODE_ENV=dev
SERVER_PORT=5000
PUBLIC_API_URL=http://localhost:5000

# JWT
JWT_TOKEN_SECRET=dev-secret-key-change-in-production
JWT_USER_TOKEN_EXPIRES_IN=7d

# База данных PostgreSQL
DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=1qa2ws3ed
DB_DATABASE=smart_trash_app_template_dev

# S3 (MinIO) - хранилище файлов
S3_ENDPOINT=localhost
S3_PORT=9000
S3_ACCESS_KEY=12345678
S3_SECRET_KEY=12345678
S3_BUCKET_NAME=smart-trash

# Redis - кэширование и очереди
REDIS_HOST=localhost
REDIS_PORT=6379

# SMTP - отправка email (опционально для разработки)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password
SMTP_FROM=your-email@gmail.com

# GigaChat AI - классификация отходов
GIGACHAT_API_KEY=your-api-key
GIGACHAT_SCOPE=GIGACHAT_API_PERS
GIGACHAT_REJECT_UNAUTHORIZED=false
GIGACHAT_BASE_URL=https://ngw.devices.sberbank.ru:9443/api/v2
GIGACHAT_AUTH_URL=https://ngw.devices.sberbank.ru:9443/api/v2/oauth
GIGACHAT_MODEL=GigaChat
```

**⚠️ Важно:** Для production используйте безопасные значения для всех секретов!

### 3. Запуск Docker контейнеров

Из директории проекта:

```bash
docker-compose -f docker-compose.dev.yml up -d postgres minio redis
```

Это запустит:
- **PostgreSQL** на порту `5433` (внутри контейнера `5432`)
- **MinIO** на портах `9000` (API) и `9001` (Console)
- **Redis** на порту `6379`

### 4. Создание базы данных

После запуска PostgreSQL, создайте базу данных:

```bash
docker exec smart-trash-postgres-dev psql -U postgres -c "CREATE DATABASE smart_trash_app_template_dev;"
```

**Примечание:** TypeORM автоматически создаст таблицы при первом запуске (`synchronize: true` в dev режиме).

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

# Линтинг
npm run lint
npm run lint:fix
```

## 📡 API документация

### GraphQL API

- **Playground**: http://localhost:5000/graphql
- **Endpoint**: http://localhost:5000/graphql

GraphQL Playground предоставляет интерактивную документацию и возможность тестирования запросов.

#### Основные типы запросов:

**Queries:**
- `healthCheck` - проверка работоспособности
- `me` - текущий пользователь
- `companies` - список компаний
- `company(id)` - информация о компании
- `collectionAreas(companyId)` - зоны сбора
- `wastePhotos` - история сортировок
- `companyAnalytics` - аналитика компании
- `companyAchievements` - достижения компании

**Mutations:**
- `registerAdmin` - регистрация администратора
- `registerEmployee` - регистрация сотрудника
- `login` - вход в систему
- `confirmEmail` - подтверждение email
- `createWastePhoto` - создание фотографии отхода
- `createCollectionArea` - создание зоны сбора
- `createAchievement` - создание достижения

### REST API

- **Health check**: `GET /`
- **Email confirmation**: `GET /confirm-email?token=...`
- **Images**: 
  - `GET /images/:id` - получить изображение
  - `POST /images/upload` - загрузить изображение
- **Files**: 
  - `GET /files/:id` - получить файл
  - `POST /files/upload` - загрузить файл

## 📂 Структура проекта

```
src/
├── entities/              # TypeORM сущности
│   ├── files/             # Файлы и изображения
│   │   ├── file.entity.ts
│   │   └── image.entity.ts
│   └── smart-trash/       # Доменные сущности
│       ├── user.entity.ts
│       ├── company.entity.ts
│       ├── collection-area.entity.ts
│       ├── waste-photo.entity.ts
│       └── achievement.entity.ts
│
├── modules/               # Модули приложения
│   ├── auth/             # Аутентификация и авторизация
│   │   ├── auth.resolver.ts
│   │   ├── auth.service.ts
│   │   ├── jwt.strategy.ts
│   │   └── services/
│   │       └── email.service.ts
│   │
│   ├── config/            # Конфигурация
│   │   └── config.service.ts
│   │
│   ├── files/             # Работа с файлами
│   │   ├── files.resolver.ts
│   │   └── files.service.ts
│   │
│   ├── gigachat/          # Интеграция с GigaChat AI
│   │   ├── gigachat.service.ts
│   │   └── gigachat.module.ts
│   │
│   └── smart-trash/       # Основной бизнес-логика
│       ├── resolvers/     # GraphQL резолверы
│       │   ├── company.resolver.ts
│       │   ├── user.resolver.ts
│       │   └── waste-photo.resolver.ts
│       ├── services/      # Сервисы
│       │   ├── company.service.ts
│       │   └── waste-photo.service.ts
│       └── queues/        # Очереди BullMQ
│           └── waste-classification.queue.ts
│
├── decorators/            # Кастомные декораторы
│   └── auth/
│       ├── public.decorator.ts
│       ├── current-user.decorator.ts
│       └── roles.decorator.ts
│
├── common/               # Общие утилиты
│   ├── filters/          # Exception filters
│   ├── gql/              # GraphQL типы
│   └── type-utils/       # TypeScript утилиты
│
├── errors/                # Коды ошибок
│   └── error-message.code.ts
│
├── app.module.ts         # Главный модуль
└── main.ts               # Точка входа
```

## 💻 Разработка

### Основные функции

- ✅ Регистрация и аутентификация (JWT)
- ✅ Управление компаниями
- ✅ Управление сотрудниками
- ✅ Классификация отходов через GigaChat AI
- ✅ Геймификация (достижения, рейтинг)
- ✅ Аналитика и статистика
- ✅ Загрузка и хранение файлов (MinIO)
- ✅ Email подтверждение
- ✅ Очереди задач (BullMQ)

### Миграции базы данных

TypeORM автоматически создает таблицы при запуске (`synchronize: true` в dev режиме).

**⚠️ Для production используйте миграции:**

```bash
# Создать миграцию
npm run migration:create

# Сгенерировать миграцию на основе изменений
npm run migration:generate

# Применить миграции
npm run migration:run

# Откатить последнюю миграцию
npm run migration:revert
```

### Docker команды

```bash
# Запуск контейнеров
docker-compose -f docker-compose.dev.yml up -d

# Остановка контейнеров
docker-compose -f docker-compose.dev.yml stop

# Остановка и удаление контейнеров
docker-compose -f docker-compose.dev.yml down

# Просмотр логов
docker-compose -f docker-compose.dev.yml logs -f

# Просмотр статуса
docker-compose -f docker-compose.dev.yml ps
```

## 🧪 Тестирование

```bash
# Unit тесты
npm run test

# E2E тесты
npm run test:e2e

# E2E тесты (медленные)
npm run test:e2e:slow

# Покрытие кода
npm run test:cov

# Тесты в watch режиме
npm run test:watch
```

## 🚢 Deployment

### Production сборка

```bash
# Сборка проекта
npm run build

# Запуск production версии
npm run start:prod
```

### Docker deployment

```bash
# Сборка образа
docker build -f Dockerfile -t smart-trash-backend .

# Запуск контейнера
docker run -p 5000:5000 --env-file .env.prod smart-trash-backend
```

### Kubernetes

Конфигурационные файлы находятся в папке `k8s/`:

```bash
cd k8s
./deploy.sh
```

## 👤 Создание администратора

Для создания администратора заранее используйте скрипт:

```bash
npm run create:admin
```

Это создаст администратора с данными:
- Email: `admin@smarttrash.ru`
- Пароль: `admin123`
- Компания: `Тестовая Компания`

Вы можете настроить данные через переменные окружения в `.env.dev`:
```env
ADMIN_EMAIL=admin@smarttrash.ru
ADMIN_PASSWORD=admin123
ADMIN_FULL_NAME=Администратор Системы
ADMIN_COMPANY_NAME=Тестовая Компания
ADMIN_COMPANY_DESCRIPTION=Тестовая компания для разработки
```

**Примечание:** Email администратора автоматически подтверждается (`isEmailConfirmed: true`), поэтому можно сразу войти в систему.

## 🐛 Troubleshooting

### Ошибка подключения к базе данных

1. Убедитесь, что Docker контейнеры запущены:
   ```bash
   docker ps
   ```

2. Проверьте, что база данных создана:
   ```bash
   docker exec smart-trash-postgres-dev psql -U postgres -c "\l"
   ```

3. Создайте базу данных вручную, если нужно:
   ```bash
   docker exec smart-trash-postgres-dev psql -U postgres -c "CREATE DATABASE smart_trash_app_template_dev;"
   ```

4. Проверьте переменные окружения в `.env.dev`:
   - `DB_HOST=localhost`
   - `DB_PORT=5433` (порт на хосте, внутри контейнера 5432)
   - `DB_DATABASE=smart_trash_app_template_dev`

### Ошибка подключения к MinIO

1. Проверьте, что MinIO запущен:
   ```bash
   docker ps | grep minio
   ```

2. Откройте MinIO Console: http://localhost:9001
   - Логин: `12345678`
   - Пароль: `12345678`

3. Проверьте переменные окружения:
   - `S3_ENDPOINT=localhost`
   - `S3_PORT=9000`
   - `S3_ACCESS_KEY=12345678`
   - `S3_SECRET_KEY=12345678`

### Ошибка подключения к Redis

1. Проверьте статус Redis:
   ```bash
   docker exec smart-trash-redis-dev redis-cli ping
   ```
   Должен вернуть `PONG`

2. Проверьте переменные окружения:
   - `REDIS_HOST=localhost`
   - `REDIS_PORT=6379`

### Ошибка отправки email

Email отправка настроена асинхронно и не блокирует регистрацию. Ошибки логируются, но не прерывают процесс.

Для настройки SMTP:
1. Получите учетные данные от провайдера email
2. Обновите переменные окружения в `.env.dev`
3. Для Gmail используйте "Пароль приложения" вместо обычного пароля

### Проблемы с GigaChat API

1. Убедитесь, что у вас есть валидный API ключ
2. Проверьте переменные окружения:
   - `GIGACHAT_API_KEY`
   - `GIGACHAT_SCOPE=GIGACHAT_API_PERS`

### Проблемы с портами

Если порты заняты, измените их в:
- `.env.dev` - для backend
- `docker-compose.dev.yml` - для Docker контейнеров

## 📝 Лицензия

MIT License

## 🔗 Полезные ссылки

- [NestJS Documentation](https://docs.nestjs.com/)
- [GraphQL Documentation](https://graphql.org/learn/)
- [TypeORM Documentation](https://typeorm.io/)
- [Apollo Server](https://www.apollographql.com/docs/apollo-server/)
- [GigaChat API](https://developers.sber.ru/gigachat)

---

**Примечание:** Для production обязательно измените все секретные ключи и используйте безопасные настройки!
