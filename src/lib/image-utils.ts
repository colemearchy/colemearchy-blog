import sharp from 'sharp'

export interface ImageOptimizationOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
}

export async function optimizeImage(
  buffer: Buffer,
  options: ImageOptimizationOptions = {}
): Promise<Buffer> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 85,
    format = 'webp'
  } = options

  try {
    let image = sharp(buffer)
    
    // Get metadata
    const metadata = await image.metadata()
    
    // Resize if needed
    if (metadata.width && metadata.height) {
      if (metadata.width > maxWidth || metadata.height > maxHeight) {
        image = image.resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
      }
    }
    
    // Convert format and optimize
    switch (format) {
      case 'jpeg':
        image = image.jpeg({ quality, progressive: true })
        break
      case 'png':
        image = image.png({ quality, compressionLevel: 9 })
        break
      case 'webp':
        image = image.webp({ quality })
        break
    }
    
    return await image.toBuffer()
  } catch (error) {
    console.error('Image optimization error:', error)
    // Return original buffer if optimization fails
    return buffer
  }
}

export function getImageMimeType(format: string): string {
  const mimeTypes: Record<string, string> = {
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp'
  }
  return mimeTypes[format.toLowerCase()] || 'image/jpeg'
}