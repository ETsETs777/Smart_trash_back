<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).

# Rentesy App Template

NestJS приложение с поддержкой файлов, изображений и GraphQL API.

## 🚀 Быстрый старт

### Docker Compose (Разработка)

Запуск полного стека для разработки:

```bash
# Запуск всех сервисов
docker-compose -f docker-compose.dev.yml up -d

# Просмотр логов
docker-compose -f docker-compose.dev.yml logs -f app

# Остановка
docker-compose -f docker-compose.dev.yml down
```

**Доступные сервисы:**

- Приложение: http://localhost:3000
- GraphQL Playground: http://localhost:3000/graphql
- MinIO Console: http://localhost:9001 (admin: 12356789 / 12345678)
- PostgreSQL: localhost:5432

### Kubernetes

#### Предварительные требования

- Kubernetes кластер (minikube, kind, или облачный)
- kubectl
- NGINX Ingress Controller (опционально)

#### Развертывание

```bash
# Переход в директорию k8s
cd k8s

# Сделать скрипт исполняемым
chmod +x deploy.sh

# Запуск развертывания
./deploy.sh
```

#### Ручное развертывание

```bash
cd k8s

# 1. Создание namespace
kubectl apply -f namespace.yaml

# 2. Конфигурация
kubectl apply -f configmap.yaml
kubectl apply -f secret.yaml

# 3. База данных
kubectl apply -f postgres.yaml

# 4. Хранилище файлов
kubectl apply -f minio.yaml

# 5. Приложение
kubectl apply -f app.yaml

# 6. Автомасштабирование
kubectl apply -f hpa.yaml

# 7. Ingress (опционально)
kubectl apply -f ingress.yaml
```

#### Доступ к сервисам

**С Ingress:**

- Приложение: http://rentesy-app.local
- MinIO Console: http://minio.rentesy-app.local

**Через NodePort:**

- Приложение: http://localhost:30300
- MinIO Console: http://localhost:30901
- MinIO API: http://localhost:30900

#### Полезные команды

```bash
# Статус всех ресурсов
kubectl get all -n rentesy-app

# Логи приложения
kubectl logs -f deployment/rentesy-app-deployment -n rentesy-app

# Подключение к поду
kubectl exec -it deployment/rentesy-app-deployment -n rentesy-app -- /bin/sh

# Удаление всех ресурсов
kubectl delete namespace rentesy-app
```

## 🏗️ Архитектура

### Компоненты

- **NestJS App** - основное приложение
- **PostgreSQL** - база данных
- **MinIO** - S3-совместимое хранилище файлов

### Порты

- **3000** - NestJS приложение
- **5432** - PostgreSQL
- **9000** - MinIO API
- **9001** - MinIO Console

## 🔧 Конфигурация

### Переменные окружения

```bash
# База данных
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=1qa2ws3ed
DB_DATABASE=rentesy-app-template-dev

# S3 хранилище
S3_ENDPOINT=localhost
S3_PORT=9000
S3_ACCESS_KEY=12356789
S3_SECRET_KEY=12345678
S3_BUCKET_NAME=rentesy-bucket

# Приложение
NODE_ENV=dev
SERVER_PORT=3000
JWT_TOKEN_SECRET=dev-secret-key
JWT_USER_TOKEN_EXPIRES_IN=7d
```

## 📦 Сборка Docker образа

```bash
# Development
docker build -f Dockerfile.dev -t rentesy-app:dev .

# Production
docker build -t rentesy-app:latest .
```

## 🔄 CI/CD

GitHub Actions автоматически выполняет:

1. **Lint** - проверка кода
2. **Build** - сборка приложения
3. **E2E Tests** - интеграционные тесты

## 📝 API

- **REST API** - стандартные HTTP эндпоинты
- **GraphQL** - `/graphql` эндпоинт с Playground
- **File Upload** - `/files/upload` и `/images/upload`

## 🛠️ Разработка

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run start:dev

# Сборка
npm run build

# Тесты
npm run test
npm run test:e2e

# Линтер
npm run lint:fix
```
