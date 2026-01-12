#!/usr/bin/env tsx

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs'
import { join, dirname, basename, extname } from 'path'

type AssetType = 'image' | 'video'

interface ExternalAsset {
  url: string
  filePath: string
  lineNumber: number
  type: AssetType
  newPath?: string
}

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.avi', '.mkv']
const EXTERNAL_URL_REGEX = /https?:\/\/[^\s"`'<>]+\.(jpg|jpeg|png|gif|webp|svg|mp4|mov|webm|avi|mkv)/gi

function getAssetType(url: string): AssetType {
  const ext = extname(new URL(url).pathname).toLowerCase()
  if (IMAGE_EXTENSIONS.includes(ext)) return 'image'
  if (VIDEO_EXTENSIONS.includes(ext)) return 'video'
  throw new Error(`Unknown asset type for URL: ${url}`)
}

function sanitizeFilename(filename: string): string {
  // Extract filename from URL, preserving extension
  const url = new URL(filename.includes('://') ? filename : `https://${filename}`)
  const pathname = url.pathname
  const ext = extname(pathname)
  const name = basename(pathname, ext)
  
  // Sanitize: remove special chars, keep alphanumeric, hyphens, underscores
  const sanitized = name
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
  
  return `${sanitized}${ext}`
}

function determineLocalPath(url: string, type: AssetType, sourceFile: string): string {
  const filename = sanitizeFilename(url)
  
  // Determine directory based on source file context
  if (sourceFile.includes('/thoughts/posts/')) {
    // Extract post slug from path
    const postMatch = sourceFile.match(/\/thoughts\/posts\/([^/]+)\.mdx/)
    if (postMatch) {
      const postSlug = postMatch[1]
      
      if (type === 'video') {
        return join('public', 'assets', 'videos', filename)
      } else {
        // Try to infer category from post slug
        if (postSlug.includes('backbone')) {
          const category = postSlug.includes('post-malone') 
            ? 'post-malone'
            : postSlug.includes('labs-program')
            ? 'labs-program'
            : postSlug.includes('games-db')
            ? 'games-db-figma-plugin'
            : 'web'
          return join('public', 'images', 'work', 'backbone', category, filename)
        } else if (postSlug.includes('amex')) {
          return join('public', 'images', 'work', 'amex', 'time-machine', filename)
        } else if (postSlug.includes('thoughts')) {
          return join('public', 'images', 'thoughts', postSlug, filename)
        }
      }
    }
  }
  
  // Default fallback
  if (type === 'video') {
    return join('public', 'assets', 'videos', filename)
  } else {
    return join('public', 'images', 'external', filename)
  }
}

async function downloadAsset(url: string, outputPath: string): Promise<void> {
  console.log(`Downloading ${url} -> ${outputPath}`)
  
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`)
  }
  
  const buffer = Buffer.from(await response.arrayBuffer())
  
  // Ensure directory exists
  const dir = dirname(outputPath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  
  writeFileSync(outputPath, buffer)
  console.log(`✓ Saved to ${outputPath}`)
}

function findFiles(dir: string, extensions: string[]): string[] {
  const files: string[] = []
  
  function walk(currentDir: string) {
    const entries = readdirSync(currentDir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name)
      
      if (entry.isDirectory()) {
        // Skip node_modules and .next
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          walk(fullPath)
        }
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase()
        if (extensions.includes(ext)) {
          files.push(fullPath)
        }
      }
    }
  }
  
  walk(dir)
  return files
}

function findExternalAssets(): ExternalAsset[] {
  const assets: ExternalAsset[] = []
  
  // Find all relevant files
  const extensions = ['.tsx', '.ts', '.mdx', '.md', '.jsx', '.js']
  const srcFiles = existsSync('src') ? findFiles('src', extensions) : []
  const appFiles = existsSync('app') ? findFiles('app', extensions) : []
  const files = [...srcFiles, ...appFiles]
  
  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8')
      const lines = content.split('\n')
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const matches = line.matchAll(EXTERNAL_URL_REGEX)
        
        for (const match of matches) {
          const url = match[0]
          
          // Skip if already a local path
          if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
            continue
          }
          
          try {
            const type = getAssetType(url)
            assets.push({
              url,
              filePath: file,
              lineNumber: i + 1,
              type,
            })
          } catch (e) {
            console.warn(`Skipping ${url}: ${e instanceof Error ? e.message : 'Unknown error'}`)
          }
        }
      }
    } catch (e) {
      console.warn(`Error reading ${file}: ${e instanceof Error ? e.message : 'Unknown error'}`)
    }
  }
  
  return assets
}

async function updateReferences(asset: ExternalAsset, newPath: string): Promise<void> {
  const content = readFileSync(asset.filePath, 'utf-8')
  const lines = content.split('\n')
  
  // Update the line containing the URL
  const lineIndex = asset.lineNumber - 1
  const oldLine = lines[lineIndex]
  
  // Replace the URL with the new local path
  // Handle both quoted and unquoted URLs
  const newLine = oldLine.replace(
    new RegExp(asset.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
    newPath.startsWith('/') ? newPath : `/${newPath.replace(/^public\//, '')}`
  )
  
  lines[lineIndex] = newLine
  
  writeFileSync(asset.filePath, lines.join('\n'), 'utf-8')
  console.log(`✓ Updated reference in ${asset.filePath}:${asset.lineNumber}`)
}

async function main() {
  console.log('Scanning for external assets...\n')
  
  const assets = findExternalAssets()
  
  if (assets.length === 0) {
    console.log('No external assets found.')
    return
  }
  
  console.log(`Found ${assets.length} external asset(s):\n`)
  
  for (const asset of assets) {
    console.log(`  ${asset.type.toUpperCase()}: ${asset.url}`)
    console.log(`    In: ${asset.filePath}:${asset.lineNumber}`)
  }
  
  console.log('\n' + '='.repeat(60) + '\n')
  
  // Group by URL to avoid duplicates
  const uniqueAssets = new Map<string, ExternalAsset>()
  for (const asset of assets) {
    if (!uniqueAssets.has(asset.url)) {
      uniqueAssets.set(asset.url, asset)
    }
  }
  
  console.log(`Downloading ${uniqueAssets.size} unique asset(s)...\n`)
  
  const results: Array<{ asset: ExternalAsset; newPath: string; success: boolean }> = []
  
  for (const [url, asset] of uniqueAssets) {
    try {
      const newPath = determineLocalPath(url, asset.type, asset.filePath)
      await downloadAsset(url, newPath)
      asset.newPath = newPath
      results.push({ asset, newPath, success: true })
    } catch (e) {
      console.error(`✗ Failed to download ${url}: ${e instanceof Error ? e.message : 'Unknown error'}`)
      results.push({ asset, newPath: '', success: false })
    }
  }
  
  console.log('\n' + '='.repeat(60) + '\n')
  console.log('Updating references in source files...\n')
  
  // Update all references to each URL
  for (const result of results) {
    if (!result.success) continue
    
    // Find all assets with the same URL
    const matchingAssets = assets.filter(a => a.url === result.asset.url)
    
    for (const asset of matchingAssets) {
      try {
        await updateReferences(asset, result.newPath)
      } catch (e) {
        console.error(`✗ Failed to update ${asset.filePath}:${asset.lineNumber}: ${e instanceof Error ? e.message : 'Unknown error'}`)
      }
    }
  }
  
  console.log('\n✓ Done!')
}

main().catch(console.error)
