import fs from 'fs'
import path from 'path'

type Metadata = {
  title: string
  publishedAt: string
  summary: string
  image?: string
  category?: 'professional' | 'personal'
}

export function parseFrontmatter(fileContent: string) {
  const frontmatterRegex = /---\s*([\s\S]*?)\s*---/
  const match = frontmatterRegex.exec(fileContent)
  if (!match || !match[1] || match[1].trim() === '') {
    throw new Error('Missing or empty frontmatter block (expected content between --- delimiters)')
  }
  const frontMatterBlock = match[1]
  const content = fileContent.replace(frontmatterRegex, '').trim()
  const frontMatterLines = frontMatterBlock.trim().split('\n')
  const metadata: Partial<Metadata> = {}

  frontMatterLines.forEach((line) => {
    const [key, ...valueArr] = line.split(': ')
    let value = valueArr.join(': ').trim()
    value = value.replace(/^['"](.*)['"]$/, '$1') // Remove quotes
    const trimmedKey = key.trim() as keyof Metadata
    if (trimmedKey === 'category') {
      metadata[trimmedKey] = value as 'professional' | 'personal'
    } else {
      metadata[trimmedKey] = value
    }
  })

  const missingFields: string[] = []
  if (!metadata.title || metadata.title.trim() === '') missingFields.push('title')
  if (!metadata.publishedAt || metadata.publishedAt.trim() === '') missingFields.push('publishedAt')
  if (!metadata.summary || metadata.summary.trim() === '') missingFields.push('summary')
  if (missingFields.length > 0) {
    throw new Error(`Frontmatter is missing required field(s): ${missingFields.join(', ')}`)
  }

  const parsedDate = new Date(metadata.publishedAt as string)
  if (isNaN(parsedDate.getTime())) {
    throw new Error(`Frontmatter publishedAt is not a valid date: "${metadata.publishedAt}"`)
  }

  return { metadata: metadata as Metadata, content }
}

function getMDXFiles(dir: string) {
  return fs.readdirSync(dir).filter((file) => path.extname(file) === '.mdx')
}

function readMDXFile(filePath: string) {
  const rawContent = fs.readFileSync(filePath, 'utf-8')
  try {
    return parseFrontmatter(rawContent)
  } catch (err) {
    throw new Error(`${filePath}: ${(err as Error).message}`)
  }
}

function getMDXData(dir: string) {
  const mdxFiles = getMDXFiles(dir)
  return mdxFiles.map((file) => {
    const { metadata, content } = readMDXFile(path.join(dir, file))
    const slug = path.basename(file, path.extname(file))

    return {
      metadata,
      slug,
      content,
    }
  })
}

export function getBlogPosts() {
  const postsDir = path.join(process.cwd(), 'src', 'app', 'thoughts', 'posts')
  
  if (!fs.existsSync(postsDir)) {
    return []
  }
  
  return getMDXData(postsDir)
}

export { formatDate } from './blog-utils'
