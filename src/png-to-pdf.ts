#!/usr/bin/env node

/**
 * PNG to PDF Converter
 * 
 * Converts all PNG files in the dist folder to PDF format.
 * Skips PNG files that already have a corresponding PDF with the same name.
 * 
 * Usage:
 *   npx ts-node src/png-to-pdf.ts [options]
 *   node build/png-to-pdf.js [options]
 * 
 * Options:
 *   -i, --input <dir>       Input directory (default: ./dist)
 *   -o, --output <dir>      Output directory (default: same as input)
 *   -f, --force             Overwrite existing PDFs
 *   -h, --help              Show help
 * 
 * Examples:
 *   npx ts-node src/png-to-pdf.ts
 *   npx ts-node src/png-to-pdf.ts -i ./my-images -o ./my-pdfs
 *   node build/png-to-pdf.js --force
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
  pngFile: string;
  pdfFile: string;
  success: boolean;
  skipped: boolean;
  error?: string;
}

function parseArgs(): ParsedArgs {
  const args: string[] = process.argv.slice(2);
  
  if (args.includes('-h') || args.includes('--help')) {
    console.log(`
PNG to PDF Converter

Converts all PNG files in a directory to PDF format.
Skips files that already have a corresponding PDF (unless --force is used).

Usage: npx ts-node src/png-to-pdf.ts [options]

Options:
  -i, --input <dir>       Input directory containing PNG files (default: ./dist)
  -o, --output <dir>      Output directory for PDF files (default: same as input)
  -f, --force             Overwrite existing PDF files
  -h, --help              Show this help message

Examples:
  npx ts-node src/png-to-pdf.ts
  npx ts-node src/png-to-pdf.ts -i ./my-images
  npx ts-node src/png-to-pdf.ts -i ./dist -o ./pdfs
  npx ts-node src/png-to-pdf.ts --force
`);
    process.exit(0);
  }

  let inputDir: string = './dist';
  let outputDir: string | null = null;
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

  return { 
    inputDir, 
    outputDir: outputDir || inputDir,
    force 
  };
}

async function convertPNGToPDF(
  pngPath: string, 
  pdfPath: string, 
  browser: Browser
): Promise<void> {
  const page: Page = await browser.newPage();
  
  try {
    // Read image file as base64
    const imageBuffer: Buffer = fs.readFileSync(pngPath);
    const base64Image: string = imageBuffer.toString('base64');
    const dataUrl: string = `data:image/png;base64,${base64Image}`;

    // Get image dimensions using data URL
    const dimensions = await page.evaluate((imageDataUrl: string) => {
      return new Promise<{ width: number; height: number }>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        img.src = imageDataUrl;
      });
    }, dataUrl);

    // Set viewport to match image dimensions
    await page.setViewportSize({
      width: dimensions.width,
      height: dimensions.height
    });

    // Load the PNG image as an HTML page using base64 data URL
    const htmlContent: string = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            width: ${dimensions.width}px;
            height: ${dimensions.height}px;
            background: white;
          }
          img { 
            width: ${dimensions.width}px;
            height: ${dimensions.height}px;
            display: block;
          }
        </style>
      </head>
      <body>
        <img src="${dataUrl}" />
      </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle' });
    
    // Wait for image to render
    await page.waitForTimeout(300);

    // Generate PDF
    await page.pdf({
      path: pdfPath,
      width: dimensions.width,
      height: dimensions.height,
      printBackground: true,
      preferCSSPageSize: true
    });

  } finally {
    await page.close();
  }
}

async function main(): Promise<void> {
  const { inputDir, outputDir, force }: ParsedArgs = parseArgs();
  
  console.log('🚀 Starting PNG to PDF conversion...');
  console.log(`📁 Input directory: ${path.resolve(inputDir)}`);
  console.log(`📁 Output directory: ${path.resolve(outputDir)}`);
  if (force) {
    console.log('⚠️  Force mode: Will overwrite existing PDFs');
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

  // Get all PNG files
  const files: string[] = fs.readdirSync(inputDirPath);
  const pngFiles: string[] = files.filter(file => file.toLowerCase().endsWith('.png'));

  if (pngFiles.length === 0) {
    console.log('⚠️  No PNG files found in the input directory.');
    process.exit(0);
  }

  console.log(`📸 Found ${pngFiles.length} PNG file(s)`);
  console.log('');

  // Launch browser
  const browser: Browser = await chromium.launch({ headless: true });

  const results: ConversionResult[] = [];
  let converted: number = 0;
  let skipped: number = 0;
  let failed: number = 0;

  try {
    for (const pngFile of pngFiles) {
      const pngPath: string = path.join(inputDirPath, pngFile);
      const baseName: string = path.basename(pngFile, path.extname(pngFile));
      const pdfFile: string = `${baseName}.pdf`;
      const pdfPath: string = path.join(outputDirPath, pdfFile);

      // Check if PDF already exists
      if (!force && fs.existsSync(pdfPath)) {
        console.log(`⏭️  Skipped: ${pngFile} (PDF already exists: ${pdfFile})`);
        skipped++;
        results.push({ pngFile, pdfFile, success: true, skipped: true });
        continue;
      }

      if (force && fs.existsSync(pdfPath)) {
        console.log(`📝 Overwriting: ${pdfFile}`);
      }

      try {
        console.log(`🔄 Converting: ${pngFile} → ${pdfFile}`);
        await convertPNGToPDF(pngPath, pdfPath, browser);
        
        const stats: fs.Stats = fs.statSync(pdfPath);
        const sizeKB: string = (stats.size / 1024).toFixed(2);
        console.log(`✅ Created: ${pdfFile} (${sizeKB} KB)`);
        
        converted++;
        results.push({ pngFile, pdfFile, success: true, skipped: false });
      } catch (error) {
        const errorMessage: string = error instanceof Error ? error.message : String(error);
        console.error(`❌ Failed: ${pngFile} - ${errorMessage}`);
        failed++;
        results.push({ pngFile, pdfFile, success: false, skipped: false, error: errorMessage });
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
  console.log(`   📁 Total: ${pngFiles.length}`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  const errorMessage: string = error instanceof Error ? error.message : String(error);
  console.error('❌ Fatal error:', errorMessage);
  process.exit(1);
});
