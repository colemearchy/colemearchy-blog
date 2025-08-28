import { prisma } from '../src/lib/prisma.js';

async function debugPost() {
  const slug = 'provocative-take-on-founder-mental-health-discuss-the-psych-1755408242351';
  const post = await prisma.post.findUnique({
    where: { slug }
  });
  
  if (post) {
    console.log('Title:', post.title);
    console.log('Content length:', post.content.length);
    console.log('First 500 chars:', post.content.substring(0, 500));
    console.log('Has JSON structure:', post.content.includes('"title"'));
    console.log('Content type:', typeof post.content);
  } else {
    console.log('Post not found');
  }
  
  process.exit(0);
}

debugPost();