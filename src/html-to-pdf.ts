#!/usr/bin/env node

/**
 * HTML to PDF Converter using Playwright
 * 
 * Usage:
 *   npx ts-node src/html-to-pdf.ts <input-html-file> [options]
 *   node build/html-to-pdf.js <input-html-file> [options]
 * 
 * Options:
 *   -o, --output <path>     Output directory (default: ./dist)
 *   -f, --filename <name>   Output filename (default: input filename with .pdf extension)
 *   -h, --help              Show help
 * 
 * Examples:
 *   npx ts-node src/html-to-pdf.ts ./examples/example.html
 *   node build/html-to-pdf.js ./my-file.html -o ./output -f my-document
 *   npx ts-node src/html-to-pdf.ts ./examples/example.html --output ./my-pdfs --filename report
 */

import { chromium, Browser, Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

interface ParsedArgs {
  inputFile: string;
  outputDir: string;
  outputFilename: string | null;
}

function parseArgs(): ParsedArgs {
  const args: string[] = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    console.log(`
HTML to PDF Converter

Usage: npx ts-node src/html-to-pdf.ts <input-html-file> [options]

Arguments:
  input-html-file         Path to the HTML file to convert (required)

Options:
  -o, --output <dir>      Output directory (default: ./dist)
  -f, --filename <name>   Output filename without extension (default: input filename)
  -h, --help              Show this help message

Examples:
  npx ts-node src/html-to-pdf.ts ./examples/example.html
  npx ts-node src/html-to-pdf.ts ./my-file.html -o ./output -f my-document
  npx ts-node src/html-to-pdf.ts ./examples/example.html --output ./my-pdfs
`);
    process.exit(0);
  }

  const inputFile: string = args[0];
  let outputDir: string = './dist';
  let outputFilename: string | null = null;

  for (let i = 1; i < args.length; i++) {
    const arg: string = args[i];
    const nextArg: string | undefined = args[i + 1];

    if ((arg === '-o' || arg === '--output') && nextArg) {
      outputDir = nextArg;
      i++;
    } else if ((arg === '-f' || arg === '--filename') && nextArg) {
      outputFilename = nextArg;
      i++;
    }
  }

  return { inputFile, outputDir, outputFilename };
}

async function convertHTMLToPDF(
  inputFile: string, 
  outputDir: string, 
  outputFilename: string | null
): Promise<void> {
  console.log('🚀 Starting HTML to PDF conversion...');
  
  // Resolve paths
  const htmlPath: string = path.resolve(inputFile);
  const outputDirPath: string = path.resolve(outputDir);
  
  // Generate output filename
  const inputBasename: string = path.basename(inputFile, path.extname(inputFile));
  const finalFilename: string = outputFilename || inputBasename;
  const outputPath: string = path.join(outputDirPath, `${finalFilename}.pdf`);
  
  // Check if input file exists
  if (!fs.existsSync(htmlPath)) {
    console.error(`❌ Error: HTML file not found: ${htmlPath}`);
    process.exit(1);
  }
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDirPath)) {
    fs.mkdirSync(outputDirPath, { recursive: true });
    console.log(`📁 Created output directory: ${outputDirPath}`);
  }
  
  console.log('📄 HTML file:', htmlPath);
  console.log('📁 Output path:', outputPath);
  
  // Launch browser
  const browser: Browser = await chromium.launch({
    headless: true
  });
  
  try {
    const page: Page = await browser.newPage();
    
    // Configure viewport for desktop (1920x1080)
    await page.setViewportSize({
      width: 1920,
      height: 1080
    });
    
    console.log('🌐 Loading page...');
    
    // Load HTML file
    await page.goto(`file://${htmlPath}`, {
      waitUntil: 'networkidle'
    });
    
    console.log('⏳ Waiting for Mermaid diagrams to render...');
    
    // Wait for Mermaid diagrams to render
    await page.waitForFunction(() => {
      const mermaidElements: NodeListOf<Element> = document.querySelectorAll('.mermaid');
      const renderedElements: NodeListOf<Element> = document.querySelectorAll('.mermaid svg');
      return renderedElements.length === mermaidElements.length && mermaidElements.length > 0;
    }, {
      timeout: 30000 // 30 seconds max
    });
    
    // Additional wait to ensure everything is rendered
    await page.waitForTimeout(3000);
    
    console.log('✅ Diagrams rendered successfully');
    
    // Generate PDF
    console.log('📑 Generating PDF...');
    
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true, // Include backgrounds and gradients
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 10px; text-align: center; width: 100%; padding: 10px 40px;">
          <span style="color: #666; font-weight: bold;">HTML to PDF Converter</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 10px; text-align: center; width: 100%; padding: 10px 40px;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
      `,
      margin: {
        top: '60px',
        right: '40px',
        bottom: '60px',
        left: '40px'
      }
    });
    
    console.log('✅ PDF generated successfully!');
    console.log('📁 Location:', outputPath);
    
    // Check file size
    const stats: fs.Stats = fs.statSync(outputPath);
    const sizeMB: string = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`📊 File size: ${sizeMB} MB`);
    
  } catch (error) {
    const errorMessage: string = error instanceof Error ? error.message : String(error);
    console.error('❌ Error during conversion:', errorMessage);
    process.exit(1);
  } finally {
    await browser.close();
    console.log('🔒 Browser closed');
  }
}

// Main execution
const { inputFile, outputDir, outputFilename }: ParsedArgs = parseArgs();
convertHTMLToPDF(inputFile, outputDir, outputFilename).catch(console.error);
