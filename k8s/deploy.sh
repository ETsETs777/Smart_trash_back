#!/bin/bash

# Скрипт для развертывания Rentesy App в Kubernetes

set -e

echo "🚀 Развертывание Rentesy App в Kubernetes..."

# Создание namespace
echo "📁 Создание namespace..."
kubectl apply -f namespace.yaml

# Создание ConfigMap и Secret
echo "⚙️ Создание конфигурации..."
kubectl apply -f configmap.yaml
kubectl apply -f secret.yaml

# Развертывание PostgreSQL
echo "🐘 Развертывание PostgreSQL..."
kubectl apply -f postgres.yaml

# Развертывание MinIO
echo "📦 Развертывание MinIO..."
kubectl apply -f minio.yaml

# Ожидание готовности сервисов
echo "⏳ Ожидание готовности сервисов..."
kubectl wait --for=condition=ready pod -l app=postgres -n rentesy-app --timeout=300s
kubectl wait --for=condition=ready pod -l app=minio -n rentesy-app --timeout=300s

# Развертывание приложения
echo "🏗️ Развертывание приложения..."
kubectl apply -f app.yaml

# Создание HPA
echo "📈 Настройка автомасштабирования..."
kubectl apply -f hpa.yaml

# Создание Ingress
echo "🌐 Настройка Ingress..."
kubectl apply -f ingress.yaml

echo "✅ Развертывание завершено!"
echo ""
echo "📋 Информация о сервисах:"
echo "- Приложение: http://rentesy-app.local (или NodePort :30300)"
echo "- MinIO Console: http://minio.rentesy-app.local (или NodePort :30901)"
echo "- MinIO API: NodePort :30900"
echo ""
echo "🔍 Проверка статуса:"
echo "kubectl get all -n rentesy-app"
echo ""
echo "📝 Логи приложения:"
echo "kubectl logs -f deployment/rentesy-app-deployment -n rentesy-app" 