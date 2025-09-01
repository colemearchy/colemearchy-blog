import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function translateToEnglish(text: string, context: 'title' | 'content' | 'excerpt' = 'content'): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
    
    let prompt = ''
    
    switch (context) {
      case 'title':
        prompt = `Translate the following Korean blog post title to English. Make it engaging and SEO-friendly while preserving the original meaning:

"${text}"

Provide only the translated title without any explanation.`
        break
        
      case 'excerpt':
        prompt = `Translate the following Korean blog excerpt to English. Keep it concise and engaging:

"${text}"

Provide only the translated excerpt without any explanation.`
        break
        
      case 'content':
        prompt = `You are a professional translator specializing in tech blogs. Translate the following Korean blog post content to English. 

Requirements:
- Preserve all markdown formatting
- Keep technical terms accurate
- Maintain the author's tone and style
- Make it natural for English readers
- Keep any code blocks unchanged
- Translate image alt texts if present

Korean content:
${text}

Provide only the translated content without any explanation.`
        break
    }
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text().trim()
  } catch (error) {
    console.error('Translation error:', error)
    throw new Error('Failed to translate content')
  }
}

export async function createPostTranslation(post: {
  title: string
  content: string
  excerpt?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
}) {
  const [translatedTitle, translatedContent, translatedExcerpt] = await Promise.all([
    translateToEnglish(post.title, 'title'),
    translateToEnglish(post.content, 'content'),
    post.excerpt ? translateToEnglish(post.excerpt, 'excerpt') : Promise.resolve(null),
  ])
  
  // For SEO fields, use translated versions or fall back to main translations
  const translatedSeoTitle = post.seoTitle 
    ? await translateToEnglish(post.seoTitle, 'title')
    : translatedTitle
    
  const translatedSeoDescription = post.seoDescription
    ? await translateToEnglish(post.seoDescription, 'excerpt')
    : translatedExcerpt
  
  return {
    locale: 'en',
    title: translatedTitle,
    content: translatedContent,
    excerpt: translatedExcerpt,
    seoTitle: translatedSeoTitle,
    seoDescription: translatedSeoDescription,
  }
}