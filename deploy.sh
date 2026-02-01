#!/bin/bash

# 누리뷰 배포 스크립트

echo "📦 변경사항 확인..."
git status --short

echo ""
read -p "커밋 메시지 입력: " message

if [ -z "$message" ]; then
  message="Update"
fi

echo ""
echo "🔄 커밋 중..."
git add -A
git commit -m "$message"

echo ""
echo "🚀 Push 중..."
git push

echo ""
echo "✅ 완료! Vercel이 자동 배포합니다."
echo "📍 배포 확인: https://vercel.com/dashboard"
