#!/usr/bin/env node

/**
 * Batch HTML to PNG Converter
 * 
 * Converts all HTML files in a directory to PNG format.
 * Skips HTML files that already have a corresponding PNG with the same name.
 * 
 * Usage:
 *   npx ts-node src/batch-html-to-png.ts [options]
 *   node build/batch-html-to-png.js [options]
 * 
 * Options:
 *   -i, --input <dir>       Input directory (default: ./examples)
 *   -o, --output <dir>      Output directory (default: ./dist)
 *   -f, --force             Overwrite existing PNGs
 *   -h, --help              Show help
 * 
 * Examples:
 *   npx ts-node src/batch-html-to-png.ts
 *   npx ts-node src/batch-html-to-png.ts -i ./examples -o ./dist
 *   npx ts-node src/batch-html-to-png.ts --force
 */

import { chromium, Browser, Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

interface ParsedArgs {
  inputDir: string;
  outputDir: string;
  force: boolean;
}

interface ConversionResult {
  htmlFile: string;
  pngFile: string;
  success: boolean;
  skipped: boolean;
  error?: string;
}

function parseArgs(): ParsedArgs {
  const args: string[] = process.argv.slice(2);
  
  if (args.includes('-h') || args.includes('--help')) {
    console.log(`
Batch HTML to PNG Converter

Converts all HTML files in a directory to PNG format.
Skips files that already have a corresponding PNG (unless --force is used).

Usage: npx ts-node src/batch-html-to-png.ts [options]

Options:
  -i, --input <dir>       Input directory containing HTML files (default: ./examples)
  -o, --output <dir>      Output directory for PNG files (default: ./dist)
  -f, --force             Overwrite existing PNG files
  -h, --help              Show this help message

Examples:
  npx ts-node src/batch-html-to-png.ts
  npx ts-node src/batch-html-to-png.ts -i ./my-html-files
  npx ts-node src/batch-html-to-png.ts -i ./examples -o ./my-pngs
  npx ts-node src/batch-html-to-png.ts --force
`);
    process.exit(0);
  }

  let inputDir: string = './examples';
  let outputDir: string = './dist';
  let force: boolean = false;

  for (let i = 0; i < args.length; i++) {
    const arg: string = args[i];
    const nextArg: string | undefined = args[i + 1];

    if ((arg === '-i' || arg === '--input') && nextArg) {
      inputDir = nextArg;
      i++;
    } else if ((arg === '-o' || arg === '--output') && nextArg) {
      outputDir = nextArg;
      i++;
    } else if (arg === '-f' || arg === '--force') {
      force = true;
    }
  }

  return { inputDir, outputDir, force };
}

async function convertHTMLToPNG(
  htmlPath: string,
  pngPath: string,
  browser: Browser
): Promise<void> {
  const page: Page = await browser.newPage();
  
  try {
    // Configure viewport for desktop (1920x1080)
    await page.setViewportSize({
      width: 1920,
      height: 1080
    });
    
    // Load HTML file
    await page.goto(`file://${htmlPath}`, {
      waitUntil: 'networkidle'
    });
    
    // Wait for Mermaid diagrams to render
    const hasMermaid: boolean = await page.evaluate(() => {
      return document.querySelectorAll('.mermaid').length > 0;
    });
    
    if (hasMermaid) {
      await page.waitForFunction(() => {
        const mermaidElements: NodeListOf<Element> = document.querySelectorAll('.mermaid');
        const renderedElements: NodeListOf<Element> = document.querySelectorAll('.mermaid svg');
        return renderedElements.length === mermaidElements.length;
      }, { timeout: 30000 });
      
      // Additional wait for rendering
      await page.waitForTimeout(3000);
    }
    
    // Get full page dimensions
    const pageDimensions = await page.evaluate(() => {
      return {
        width: Math.max(
          document.body.scrollWidth,
          document.body.offsetWidth,
          document.documentElement.scrollWidth,
          document.documentElement.offsetWidth
        ),
        height: Math.max(
          document.body.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.scrollHeight,
          document.documentElement.offsetHeight
        )
      };
    });
    
    // Generate full page screenshot
    await page.screenshot({
      path: pngPath,
      fullPage: true,
      type: 'png',
      omitBackground: false,
      animations: 'disabled'
    });
    
  } finally {
    await page.close();
  }
}

async function main(): Promise<void> {
  const { inputDir, outputDir, force }: ParsedArgs = parseArgs();
  
  console.log('🚀 Starting batch HTML to PNG conversion...');
  console.log(`📁 Input directory: ${path.resolve(inputDir)}`);
  console.log(`📁 Output directory: ${path.resolve(outputDir)}`);
  if (force) {
    console.log('⚠️  Force mode: Will overwrite existing PNGs');
  }
  console.log('');

  // Check if input directory exists
  const inputDirPath: string = path.resolve(inputDir);
  if (!fs.existsSync(inputDirPath)) {
    console.error(`❌ Error: Input directory not found: ${inputDirPath}`);
    process.exit(1);
  }

  // Ensure output directory exists
  const outputDirPath: string = path.resolve(outputDir);
  if (!fs.existsSync(outputDirPath)) {
    fs.mkdirSync(outputDirPath, { recursive: true });
    console.log(`📁 Created output directory: ${outputDirPath}`);
  }

  // Get all HTML files
  const files: string[] = fs.readdirSync(inputDirPath);
  const htmlFiles: string[] = files.filter(file => file.toLowerCase().endsWith('.html'));

  if (htmlFiles.length === 0) {
    console.log('⚠️  No HTML files found in the input directory.');
    process.exit(0);
  }

  console.log(`📄 Found ${htmlFiles.length} HTML file(s)`);
  console.log('');

  // Launch browser
  const browser: Browser = await chromium.launch({ headless: true });

  let converted: number = 0;
  let skipped: number = 0;
  let failed: number = 0;

  try {
    for (const htmlFile of htmlFiles) {
      const htmlPath: string = path.join(inputDirPath, htmlFile);
      const baseName: string = path.basename(htmlFile, path.extname(htmlFile));
      const pngFile: string = `${baseName}.png`;
      const pngPath: string = path.join(outputDirPath, pngFile);

      // Check if PNG already exists
      if (!force && fs.existsSync(pngPath)) {
        console.log(`⏭️  Skipped: ${htmlFile} (PNG already exists: ${pngFile})`);
        skipped++;
        continue;
      }

      if (force && fs.existsSync(pngPath)) {
        console.log(`📝 Overwriting: ${pngFile}`);
      }

      try {
        console.log(`🔄 Converting: ${htmlFile} → ${pngFile}`);
        await convertHTMLToPNG(htmlPath, pngPath, browser);
        
        const stats: fs.Stats = fs.statSync(pngPath);
        const sizeMB: string = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`✅ Created: ${pngFile} (${sizeMB} MB)`);
        
        converted++;
      } catch (error) {
        const errorMessage: string = error instanceof Error ? error.message : String(error);
        console.error(`❌ Failed: ${htmlFile} - ${errorMessage}`);
        failed++;
      }
    }
  } finally {
    await browser.close();
    console.log('🔒 Browser closed');
  }

  // Print summary
  console.log('');
  console.log('📊 Conversion Summary:');
  console.log(`   ✅ Converted: ${converted}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📁 Total: ${htmlFiles.length}`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  const errorMessage: string = error instanceof Error ? error.message : String(error);
  console.error('❌ Fatal error:', errorMessage);
  process.exit(1);
});
