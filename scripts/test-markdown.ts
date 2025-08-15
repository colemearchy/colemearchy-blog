import { prisma } from '../src/lib/prisma'

async function testMarkdown() {
  const slug = 'the-no-code-era-is-over-welcome-to-the-age-of-vibe-coding'
  
  const post = await prisma.post.findUnique({
    where: { slug },
    select: {
      content: true,
      title: true
    }
  })
  
  if (post) {
    console.log('Post Title:', post.title)
    console.log('\nFirst 500 characters of content:')
    console.log(post.content.substring(0, 500))
    console.log('\n...')
    
    // Check if content contains markdown elements
    const hasHeaders = post.content.includes('##')
    const hasBold = post.content.includes('**')
    const hasIframe = post.content.includes('<iframe')
    
    console.log('\nContent analysis:')
    console.log('- Contains headers (##):', hasHeaders)
    console.log('- Contains bold (**):', hasBold)
    console.log('- Contains iframe:', hasIframe)
  }
  
  await prisma.$disconnect()
}

testMarkdown().catch(console.error)