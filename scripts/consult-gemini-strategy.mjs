import { GoogleGenerativeAI } from '@google/generative-ai'
import dotenv from 'dotenv'

dotenv.config()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

async function consultGemini() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    const prompt = `
You are a YC-backed CTO and system architect expert. I need your advice on a blog automation strategy.

## CONTEXT

I run a tech blog (colemearchy.com) with YouTube video integration. I just improved the Shorts content generation system:
- **Before**: Shorts videos (< 2min) generated minimal content (~400-500 chars, just "Watch the Video")
- **After**: New AI prompt generates comprehensive 1000+ char blog posts with intro, detailed content, insights, and conclusion

## CURRENT SITUATION

Total YouTube Shorts: 167 videos
- ✅ Already have posts: 103 (but generated with OLD system)
- 🆕 Need NEW posts: 64
- 🔄 Need REGENERATION (< 1000 chars): 2

**Total work: 66 Shorts** (2 regenerate + 64 new)

## CONSTRAINTS

- Daily quota: Process 9 Shorts per day (API rate limits)
- Time: 8 days to complete
- Automation: Need GitHub Actions cron job
- Database: PostgreSQL with Prisma ORM
- API: /api/youtube-to-blog endpoint (takes videoId, creates post)

## STRATEGIC QUESTIONS

As a seasoned CTO, please advise on:

### 1. **Task Prioritization**
Should I prioritize:
- A) Regenerate existing 2 posts first, then new 64
- B) Do new 64 first, then regenerate 2
- C) Mix both (e.g., 1-2 regenerations per day + 7-8 new)

### 2. **Regeneration Approach**
For the 2 posts needing regeneration:
- A) DELETE old post → CREATE new (clean slate, new slug, lose SEO)
- B) FETCH video again → UPDATE existing post (keep slug/SEO, update content/title/tags)
- C) Mark as DRAFT → Regenerate → Review before publishing

Which preserves SEO best while improving quality?

### 3. **Error Handling**
What's the best retry strategy?
- A) Immediate retry on failure (within same run)
- B) Log failures, retry next day
- C) Skip failures, manual review later

### 4. **Daily Batch Size**
Is 9/day optimal or should I:
- A) Start with 5/day, increase gradually (safer)
- B) Do 9/day consistently (faster, use full quota)
- C) Do 15/day with delays between calls (aggressive)

### 5. **Monitoring & Rollback**
How to ensure quality?
- A) Generate all, review later
- B) Auto-publish if content > 1000 chars, else DRAFT
- C) All DRAFT, manual approval before publishing

### 6. **Script Architecture**
Better approach:
- A) Single script: check DB → call API → update post (all-in-one)
- B) Separate API endpoint for batch processing (reusable)
- C) Queue-based system (overkill for 66 items?)

## YOUR TASK

Provide a **concrete, implementable strategy** with:
1. **Recommended approach** for each question (with brief rationale)
2. **Execution timeline** (Day 1-8 breakdown)
3. **Risk mitigation** (top 2-3 risks and how to handle)
4. **Code architecture** (brief pseudocode structure)

Keep it practical and actionable - this needs to be implemented in the next hour.
`.trim()

    console.log('🧠 Gemini에게 전략 자문 요청 중...\n')

    const result = await model.generateContent(prompt)
    const response = await result.response
    const advice = response.text()

    console.log('=' .repeat(80))
    console.log('💡 GEMINI\'S STRATEGIC ADVICE')
    console.log('='.repeat(80))
    console.log()
    console.log(advice)
    console.log()
    console.log('='.repeat(80))

    // Save to file for reference
    const fs = await import('fs')
    fs.writeFileSync(
      'scripts/gemini-strategy-advice.md',
      `# Gemini Strategic Advice for Shorts Regeneration\n\nGenerated: ${new Date().toISOString()}\n\n${advice}`,
      'utf-8'
    )

    console.log('\n✅ 조언이 scripts/gemini-strategy-advice.md 에 저장되었습니다.')

  } catch (error) {
    console.error('Error:', error)
  }
}

consultGemini()
