#!/usr/bin/env node

/**
 * Batch HTML to PDF Converter
 *
 * Converts all HTML files in a directory to PDF format.
 * Skips HTML files that already have a corresponding PDF with the same name.
 *
 * Usage:
 *   npx ts-node src/batch-html-to-pdf.ts [options]
 *   node build/batch-html-to-pdf.js [options]
 *
 * Options:
 *   -i, --input <dir>       Input directory (default: ./examples)
 *   -o, --output <dir>      Output directory (default: ./dist)
 *   -f, --force             Overwrite existing PDFs
 *   -h, --help              Show help
 *
 * Examples:
 *   npx ts-node src/batch-html-to-pdf.ts
 *   npx ts-node src/batch-html-to-pdf.ts -i ./examples -o ./dist
 *   npx ts-node src/batch-html-to-pdf.ts --force
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
  pdfFile: string;
  success: boolean;
  skipped: boolean;
  error?: string;
}

function parseArgs(): ParsedArgs {
  const args: string[] = process.argv.slice(2);

  if (args.includes('-h') || args.includes('--help')) {
    console.log(`
Batch HTML to PDF Converter

Converts all HTML files in a directory to PDF format.
Skips files that already have a corresponding PDF (unless --force is used).

Usage: npx ts-node src/batch-html-to-pdf.ts [options]

Options:
  -i, --input <dir>       Input directory containing HTML files (default: ./examples)
  -o, --output <dir>      Output directory for PDF files (default: ./dist)
  -f, --force             Overwrite existing PDF files
  -h, --help              Show this help message

Examples:
  npx ts-node src/batch-html-to-pdf.ts
  npx ts-node src/batch-html-to-pdf.ts -i ./examples -o ./dist
  npx ts-node src/batch-html-to-pdf.ts --force
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

async function convertHTMLToPDF(
  htmlPath: string,
  pdfPath: string,
  browser: Browser
): Promise<void> {
  const page: Page = await browser.newPage();

  try {
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' });

    const hasMermaid: boolean = await page.evaluate(() => {
      return document.querySelectorAll('.mermaid').length > 0;
    });

    if (hasMermaid) {
      await page.waitForFunction(() => {
        const mermaidElements: NodeListOf<Element> = document.querySelectorAll('.mermaid');
        const renderedElements: NodeListOf<Element> = document.querySelectorAll('.mermaid svg');
        return renderedElements.length === mermaidElements.length;
      }, { timeout: 30000 });
      await page.waitForTimeout(3000);
    }

    await page.evaluate(() => document.fonts.ready);

    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      margin: { top: '40px', right: '30px', bottom: '40px', left: '30px' }
    });
  } finally {
    await page.close();
  }
}

async function main(): Promise<void> {
  const { inputDir, outputDir, force }: ParsedArgs = parseArgs();

  console.log('🚀 Starting batch HTML to PDF conversion...');
  console.log(`📁 Input directory: ${path.resolve(inputDir)}`);
  console.log(`📁 Output directory: ${path.resolve(outputDir)}`);
  if (force) {
    console.log('⚠️  Force mode: Will overwrite existing PDFs');
  }
  console.log('');

  const inputDirPath: string = path.resolve(inputDir);
  if (!fs.existsSync(inputDirPath)) {
    console.error(`❌ Error: Input directory not found: ${inputDirPath}`);
    process.exit(1);
  }

  const outputDirPath: string = path.resolve(outputDir);
  if (!fs.existsSync(outputDirPath)) {
    fs.mkdirSync(outputDirPath, { recursive: true });
    console.log(`📁 Created output directory: ${outputDirPath}`);
  }

  const files: string[] = fs.readdirSync(inputDirPath);
  const htmlFiles: string[] = files.filter(file => file.toLowerCase().endsWith('.html'));

  if (htmlFiles.length === 0) {
    console.log('⚠️  No HTML files found in the input directory.');
    process.exit(0);
  }

  console.log(`📄 Found ${htmlFiles.length} HTML file(s)`);
  console.log('');

  const browser: Browser = await chromium.launch({ headless: true });
  let converted = 0;
  let skipped = 0;
  let failed = 0;

  try {
    for (const htmlFile of htmlFiles) {
      const htmlPath: string = path.join(inputDirPath, htmlFile);
      const baseName: string = path.basename(htmlFile, path.extname(htmlFile));
      const pdfFile: string = `${baseName}.pdf`;
      const pdfPath: string = path.join(outputDirPath, pdfFile);

      if (!force && fs.existsSync(pdfPath)) {
        console.log(`⏭️  Skipped: ${htmlFile} (PDF already exists)`);
        skipped++;
        continue;
      }

      if (force && fs.existsSync(pdfPath)) {
        console.log(`📝 Overwriting: ${pdfFile}`);
      }

      try {
        console.log(`🔄 Converting: ${htmlFile} → ${pdfFile}`);
        await convertHTMLToPDF(htmlPath, pdfPath, browser);
        console.log(`✅ Created: ${pdfFile}`);
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

  console.log('');
  console.log(`✅ Converted: ${converted}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Failed: ${failed}`);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
