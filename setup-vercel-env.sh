#!/bin/bash

echo "Setting up YouTube API environment variables in Vercel..."

# Vercel에 환경 변수 설정
echo "Setting YOUTUBE_API_KEY..."
vercel env add YOUTUBE_API_KEY production <<< "AIzaSyCDeAse0cwYDMYGiG8cg6zkVZ4e1KChqt8"

echo "Setting YOUTUBE_CHANNEL_ID..."
vercel env add YOUTUBE_CHANNEL_ID production <<< "UCoAoO5cUnk_yG4lOUHKvfqg"

echo ""
echo "Environment variables set. Now pulling to verify..."
vercel env pull

echo ""
echo "Contents of .env.production.local:"
cat .env.production.local

echo ""
echo "To deploy with these variables, run:"
echo "vercel --prod"