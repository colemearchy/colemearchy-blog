#!/usr/bin/env tsx

/**
 * Knowledge Base 임베딩 스크립트
 * knowledge-base.txt 파일을 읽어 벡터 임베딩 후 DB 저장
 */

import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface KnowledgeEntry {
  source: string;
  content: string;
}

/**
 * knowledge-base.txt 파일 파싱
 */
function parseKnowledgeBase(filePath: string): KnowledgeEntry[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const entries: KnowledgeEntry[] = [];

  // [출처] 내용 형식으로 파싱
  const lines = content.split('\n');
  let currentEntry: KnowledgeEntry | null = null;

  for (const line of lines) {
    // 주석이나 빈 줄 무시
    if (line.trim().startsWith('#') || line.trim() === '') {
      continue;
    }

    // [출처] 패턴 찾기
    const sourceMatch = line.match(/^\[(.*?)\]\s*(.*)/);

    if (sourceMatch) {
      // 이전 엔트리 저장
      if (currentEntry && currentEntry.content.trim()) {
        entries.push(currentEntry);
      }

      // 새 엔트리 시작
      currentEntry = {
        source: sourceMatch[1].trim(),
        content: sourceMatch[2].trim()
      };
    } else if (currentEntry) {
      // 현재 엔트리에 내용 추가
      currentEntry.content += ' ' + line.trim();
    }
  }

  // 마지막 엔트리 저장
  if (currentEntry && currentEntry.content.trim()) {
    entries.push(currentEntry);
  }

  return entries;
}

/**
 * 텍스트를 벡터 임베딩으로 변환
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

/**
 * Knowledge Base 임베딩 및 저장
 */
async function embedKnowledgeBase() {
  console.log('🚀 Knowledge Base 임베딩 시작...\n');

  // 1. knowledge-base.txt 파일 읽기
  const knowledgeBasePath = path.join(process.cwd(), 'knowledge-base.txt');

  if (!fs.existsSync(knowledgeBasePath)) {
    console.error('❌ knowledge-base.txt 파일을 찾을 수 없습니다.');
    console.error(`   경로: ${knowledgeBasePath}`);
    process.exit(1);
  }

  console.log(`📄 파일 읽는 중: ${knowledgeBasePath}`);
  const entries = parseKnowledgeBase(knowledgeBasePath);
  console.log(`✅ ${entries.length}개 엔트리 발견\n`);

  // 2. 기존 Knowledge 테이블 비우기 (옵션)
  const shouldClear = process.argv.includes('--clear');
  if (shouldClear) {
    console.log('🗑️  기존 Knowledge 데이터 삭제 중...');
    await prisma.knowledge.deleteMany({});
    console.log('✅ 삭제 완료\n');
  }

  // 3. 각 엔트리 임베딩 후 저장
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    console.log(`[${i + 1}/${entries.length}] 처리 중: [${entry.source}]`);

    try {
      // 임베딩 생성
      const embedding = await generateEmbedding(entry.content);

      // DB 저장
      await prisma.knowledge.create({
        data: {
          source: entry.source,
          content: entry.content,
          embedding: JSON.stringify(embedding) // SQLite는 vector 타입 미지원, JSON으로 저장
        }
      });

      console.log(`   ✅ 저장 완료 (${entry.content.substring(0, 50)}...)`);
      successCount++;

      // API Rate Limit 방지 (1초 대기)
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`   ❌ 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
      failCount++;
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 임베딩 완료 요약');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`❌ 실패: ${failCount}개`);
  console.log(`📝 총: ${entries.length}개\n`);

  if (successCount === entries.length) {
    console.log('🎉 모든 Knowledge 임베딩 완료!');
    console.log('💡 이제 RAG 시스템이 이 지식을 활용할 수 있습니다.\n');
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  try {
    await embedKnowledgeBase();
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ 치명적 오류:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
