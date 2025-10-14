import { GoogleGenerativeAI } from '@google/generative-ai'
import { env } from './env'

export function detectLanguage(text: string): 'ko' | 'en' {
  // Simple language detection based on character ranges
  const koreanRegex = /[\u3131-\uD79D]/
  const koreanChars = (text.match(koreanRegex) || []).length
  const totalChars = text.replace(/\s/g, '').length
  
  // If more than 20% of characters are Korean, consider it Korean
  return koreanChars / totalChars > 0.2 ? 'ko' : 'en'
}

export async function translate(text: string, targetLang: 'en' | 'ko', context: 'title' | 'content' | 'excerpt' = 'content'): Promise<string> {
  try {
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
    
    let prompt = ''
    
    switch (context) {
      case 'title':
        prompt = targetLang === 'en' 
          ? `Translate the following Korean blog post title to English. Make it engaging and SEO-friendly while preserving the original meaning:

"${text}"

Provide only the translated title without any explanation.`
          : `Translate the following English blog post title to Korean. Make it natural and appropriate for Korean readers while preserving the original meaning:

"${text}"

Provide only the translated title without any explanation.`
        break
        
      case 'excerpt':
        prompt = targetLang === 'en'
          ? `Translate the following Korean blog excerpt to English. Keep it concise and engaging:

"${text}"

Provide only the translated excerpt without any explanation.`
          : `Translate the following English blog excerpt to Korean. Keep it concise and natural for Korean readers:

"${text}"

Provide only the translated excerpt without any explanation.`
        break
        
      case 'content':
        prompt = targetLang === 'en'
          ? `You are a professional translator specializing in tech blogs. Translate the following Korean blog post content to English. 

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
          : `You are a professional translator specializing in tech blogs. Translate the following English blog post content to Korean. 

Requirements:
- Preserve all markdown formatting
- Keep technical terms accurate
- Maintain the author's tone and style
- Make it natural for Korean readers
- Keep any code blocks unchanged
- Translate image alt texts if present
- Use appropriate honorifics and formal language

English content:
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

// 하위 호환성을 위한 기존 함수
export async function translateToEnglish(text: string, context: 'title' | 'content' | 'excerpt' = 'content'): Promise<string> {
  return translate(text, 'en', context)
}

export async function translateToKorean(text: string, context: 'title' | 'content' | 'excerpt' = 'content'): Promise<string> {
  return translate(text, 'ko', context)
}

export async function createPostTranslation(post: {
  title: string
  content: string
  excerpt?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
}, targetLang: 'en' | 'ko' = 'en') {
  const [translatedTitle, translatedContent, translatedExcerpt] = await Promise.all([
    translate(post.title, targetLang, 'title'),
    translate(post.content, targetLang, 'content'),
    post.excerpt ? translate(post.excerpt, targetLang, 'excerpt') : Promise.resolve(null),
  ])
  
  // For SEO fields, use translated versions or fall back to main translations
  const translatedSeoTitle = post.seoTitle 
    ? await translate(post.seoTitle, targetLang, 'title')
    : translatedTitle
    
  const translatedSeoDescription = post.seoDescription
    ? await translate(post.seoDescription, targetLang, 'excerpt')
    : translatedExcerpt
  
  return {
    locale: targetLang,
    title: translatedTitle,
    content: translatedContent,
    excerpt: translatedExcerpt,
    seoTitle: translatedSeoTitle,
    seoDescription: translatedSeoDescription,
  }
}