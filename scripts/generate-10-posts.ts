import { prisma } from '../src/lib/prisma'

const topics = [
  {
    title: "Why I Quit My $500K Tech Job to Build a One-Person Business",
    prompt: "Write about leaving a high-paying FAANG job to pursue entrepreneurial freedom. Include personal struggles with golden handcuffs, the moment of realization, and practical steps for others considering the same path.",
    keywords: ["quit tech job", "one person business", "entrepreneurial freedom", "FAANG burnout"],
    affiliateProducts: ["Notion", "Stripe Atlas", "ConvertKit"]
  },
  {
    title: "My $10K/Month Biohacking Stack: What Actually Works",
    prompt: "Deep dive into expensive biohacking experiments, from peptides to red light therapy. Be brutally honest about what's worth the money and what's snake oil.",
    keywords: ["biohacking stack", "peptides", "red light therapy", "nootropics"],
    affiliateProducts: ["Joovv Red Light", "Inside Tracker", "Oura Ring"]
  },
  {
    title: "The Hidden Cost of 'Hustle Culture' - My Burnout at 28",
    prompt: "Personal story about burnout, ADHD diagnosis, and finding balance. Include specific symptoms, recovery strategies, and why the grind mentality is toxic.",
    keywords: ["hustle culture burnout", "ADHD diagnosis adult", "work life balance", "millennial burnout"],
    affiliateProducts: ["Headspace", "Calm App", "BetterHelp"]
  },
  {
    title: "How I Built a $100K ARR SaaS in 6 Months (Solo)",
    prompt: "Step-by-step breakdown of building a profitable SaaS alone. Include tech stack, marketing strategies, and biggest mistakes. Focus on actionable insights.",
    keywords: ["build saas solo", "100k arr", "indie hacker", "micro saas"],
    affiliateProducts: ["Vercel", "Supabase", "Plausible Analytics"]
  },
  {
    title: "The Truth About Ozempic: My 6-Month Journey",
    prompt: "Honest review of using Ozempic for weight management. Include side effects, costs, lifestyle changes, and whether it's sustainable long-term.",
    keywords: ["ozempic review", "ozempic side effects", "GLP-1 weight loss", "semaglutide experience"],
    affiliateProducts: ["MyFitnessPal Premium", "Withings Scale", "Noom"]
  },
  {
    title: "Why Your Startup's First Hire Should Be a Therapist",
    prompt: "Provocative take on founder mental health. Discuss the psychological toll of entrepreneurship and why therapy should be a business expense.",
    keywords: ["founder mental health", "startup therapy", "entrepreneur depression", "founder burnout"],
    affiliateProducts: ["BetterHelp", "Headspace for Work", "Notion"]
  },
  {
    title: "I Tried Every Productivity System - Here's the Only One That Stuck",
    prompt: "Review of GTD, Zettelkasten, PARA, and other systems. Explain why most fail and share the hybrid system that actually works for ADHD brains.",
    keywords: ["productivity systems", "GTD vs PARA", "ADHD productivity", "second brain"],
    affiliateProducts: ["Obsidian", "Todoist", "Readwise"]
  },
  {
    title: "The $50K Mistake That Taught Me Everything About Investing",
    prompt: "Story about a major investment loss (crypto, options, or startup). Include lessons learned, risk management, and building wealth sustainably.",
    keywords: ["investment mistakes", "crypto losses", "risk management", "wealth building"],
    affiliateProducts: ["Vanguard", "Personal Capital", "The Intelligent Investor book"]
  },
  {
    title: "How I Healed My Chronic Neck Pain Without Surgery",
    prompt: "Journey from chronic pain to recovery. Include specific exercises, tools, mindset shifts, and why most treatments don't address root causes.",
    keywords: ["chronic neck pain", "pain without surgery", "posture correction", "desk job pain"],
    affiliateProducts: ["Theragun", "Standing Desk", "Ergonomic Chair"]
  },
  {
    title: "The Minimalist's Guide to a $1M Net Worth by 35",
    prompt: "How minimalism accelerates wealth building. Include specific numbers, investment strategies, and the psychology of enough.",
    keywords: ["minimalist millionaire", "FIRE movement", "net worth 35", "financial independence"],
    affiliateProducts: ["YNAB", "Vanguard VTSAX", "Mr. Money Mustache book"]
  }
]

async function generatePosts() {
  console.log('Starting to generate 10 blog posts...\n')
  
  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i]
    console.log(`\n[${i + 1}/10] Generating: ${topic.title}`)
    
    try {
      // Call the generate content API
      const response = await fetch('http://localhost:3001/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: topic.prompt,
          keywords: topic.keywords,
          affiliateProducts: topic.affiliateProducts
        })
      })
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }
      
      const generatedContent = await response.json()
      
      // Create the post in database
      const post = await prisma.post.create({
        data: {
          title: generatedContent.title || topic.title,
          slug: generatedContent.slug,
          content: generatedContent.content,
          excerpt: generatedContent.excerpt,
          tags: generatedContent.tags || topic.keywords,
          seoTitle: generatedContent.seoTitle || generatedContent.title,
          seoDescription: generatedContent.seoDescription || generatedContent.excerpt,
          author: 'Colemearchy',
          status: 'PUBLISHED',
          publishedAt: new Date(Date.now() + (i * 24 * 60 * 60 * 1000)), // Stagger by 1 day each
          coverImage: `/api/og?title=${encodeURIComponent(generatedContent.title || topic.title)}`
        }
      })
      
      console.log(`✅ Created: ${post.slug}`)
      console.log(`   Scheduled for: ${post.publishedAt?.toLocaleDateString()}`)
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 3000))
      
    } catch (error) {
      console.error(`❌ Failed to generate post ${i + 1}:`, error)
    }
  }
  
  console.log('\n✨ Finished generating all posts!')
  await prisma.$disconnect()
}

// Run if this file is executed directly
if (require.main === module) {
  generatePosts().catch(console.error)
}