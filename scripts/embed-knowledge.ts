import { GoogleGenerativeAI } from '@google/generative-ai'
import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'

// Initialize Prisma and Gemini
const prisma = new PrismaClient()
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

async function extractBookInfo(text: string): Promise<{ content: string; source?: string }[]> {
  const books: { content: string; source?: string }[] = []
  
  // Split text into sections by book title pattern
  const bookSections = text.split(/책 제목 \[([^\]]*)\]/)
  
  // Skip the first element (content before first book) and process pairs
  for (let i = 1; i < bookSections.length; i += 2) {
    if (i + 1 < bookSections.length) {
      const title = bookSections[i].trim()
      const content = bookSections[i + 1].trim()
      
      // Skip books with empty titles or very short content
      if (title && content.length > 100) {
        // Split long content into chunks of ~1000 characters
        const chunkSize = 1000
        
        for (let j = 0; j < content.length; j += chunkSize) {
          const chunk = content.substring(j, Math.min(j + chunkSize, content.length))
          if (chunk.trim().length > 50) { // Skip very short chunks
            books.push({
              content: chunk.trim(),
              source: title
            })
          }
        }
      }
    }
  }
  
  return books
}

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" })
    const result = await model.embedContent(text)
    return result.embedding.values
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw error
  }
}

async function main() {
  console.log('🚀 Starting knowledge embedding process...')
  
  try {
    // Read knowledge base file
    const knowledgePath = path.join(process.cwd(), 'knowledge-base.txt')
    const knowledgeText = await fs.readFile(knowledgePath, 'utf-8')
    
    console.log('📖 Parsing knowledge base...')
    const allBooks = await extractBookInfo(knowledgeText)
    // For initial testing, only process first 100 chunks
    const books = allBooks.slice(0, 100)
    console.log(`Found ${allBooks.length} total chunks, processing first ${books.length} for testing`)
    
    // Clear existing knowledge (optional)
    console.log('🗑️  Clearing existing knowledge...')
    await prisma.knowledge.deleteMany({})
    
    // Process books in smaller batches to handle API limits
    const batchSize = 50
    const totalBatches = Math.ceil(books.length / batchSize)
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * batchSize
      const endIndex = Math.min(startIndex + batchSize, books.length)
      const batch = books.slice(startIndex, endIndex)
      
      console.log(`Processing batch ${batchIndex + 1}/${totalBatches} (chunks ${startIndex + 1}-${endIndex})`)
      
      for (let i = 0; i < batch.length; i++) {
        const book = batch[i]
        const globalIndex = startIndex + i
        console.log(`Processing chunk ${globalIndex + 1}/${books.length} from "${book.source || 'Unknown'}"...`)
        
        try {
          // Generate embedding
          const embedding = await generateEmbedding(book.content)
          
          // Create raw SQL query for pgvector
          await prisma.$executeRaw`
            INSERT INTO "Knowledge" (id, content, source, embedding, "createdAt")
            VALUES (
              gen_random_uuid(),
              ${book.content},
              ${book.source},
              ${embedding}::vector,
              NOW()
            )
          `
          
          // Minimal delay to avoid overwhelming the API
          if (i < batch.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 50))
          }
          
        } catch (error) {
          console.error(`Error processing chunk ${globalIndex + 1}:`, error)
        }
      }
      
      // Longer pause between batches
      if (batchIndex < totalBatches - 1) {
        console.log(`Completed batch ${batchIndex + 1}. Pausing before next batch...`)
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
    
    console.log('✅ Knowledge embedding complete!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Load environment variables
import dotenv from 'dotenv'
dotenv.config()

main().catch(console.error)