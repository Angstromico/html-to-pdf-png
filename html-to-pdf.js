#!/usr/bin/env node

/**
 * HTML to PDF Converter using Playwright
 * 
 * Usage:
 *   node html-to-pdf.js <input-html-file> [options]
 * 
 * Options:
 *   -o, --output <path>     Output directory (default: ./dist)
 *   -f, --filename <name>   Output filename (default: input filename with .pdf extension)
 *   -h, --help              Show help
 * 
 * Examples:
 *   node html-to-pdf.js ./examples/example.html
 *   node html-to-pdf.js ./my-file.html -o ./output -f my-document
 *   node html-to-pdf.js ./examples/example.html --output ./my-pdfs --filename report
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

function parseArgs() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    console.log(`
HTML to PDF Converter

Usage: node html-to-pdf.js <input-html-file> [options]

Arguments:
  input-html-file         Path to the HTML file to convert (required)

Options:
  -o, --output <dir>      Output directory (default: ./dist)
  -f, --filename <name>   Output filename without extension (default: input filename)
  -h, --help              Show this help message

Examples:
  node html-to-pdf.js ./examples/example.html
  node html-to-pdf.js ./my-file.html -o ./output -f my-document
  node html-to-pdf.js ./examples/example.html --output ./my-pdfs
`);
    process.exit(0);
  }

  const inputFile = args[0];
  let outputDir = './dist';
  let outputFilename = null;

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

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

async function convertHTMLToPDF(inputFile, outputDir, outputFilename) {
  console.log('🚀 Starting HTML to PDF conversion...');
  
  // Resolve paths
  const htmlPath = path.resolve(inputFile);
  const outputDirPath = path.resolve(outputDir);
  
  // Generate output filename
  const inputBasename = path.basename(inputFile, path.extname(inputFile));
  const finalFilename = outputFilename || inputBasename;
  const outputPath = path.join(outputDirPath, `${finalFilename}.pdf`);
  
  // Check if input file exists
  if (!fs.existsSync(htmlPath)) {
    console.error(`❌ Error: HTML file not found: ${htmlPath}`);
    process.exit(1);
  }
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDirPath)) {
    fs.mkdirSync(outputDirPath, { recursive: true });
    console.log(`� Created output directory: ${outputDirPath}`);
  }
  
  console.log('📄 HTML file:', htmlPath);
  console.log('📁 Output path:', outputPath);
  
  // Launch browser
  const browser = await chromium.launch({
    headless: true
  });
  
  try {
    const page = await browser.newPage();
    
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
      const mermaidElements = document.querySelectorAll('.mermaid');
      const renderedElements = document.querySelectorAll('.mermaid svg');
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
    const stats = fs.statSync(outputPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`📊 File size: ${sizeMB} MB`);
    
  } catch (error) {
    console.error('❌ Error during conversion:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
    console.log('🔒 Browser closed');
  }
}

// Main execution
const { inputFile, outputDir, outputFilename } = parseArgs();
convertHTMLToPDF(inputFile, outputDir, outputFilename).catch(console.error);
