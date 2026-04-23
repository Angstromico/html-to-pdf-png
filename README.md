# HTML to PDF & PNG Converter

A powerful and easy-to-use CLI tool to convert any HTML file to **PDF** or **high-quality PNG** images using Playwright. Built with TypeScript for type safety and better developer experience. Perfect for documentation, diagrams, reports, and any HTML content.

## Features

### PDF Output
- ✅ **Maintains exact desktop layout** (1920x1080 viewport)
- ✅ **Renders Mermaid diagrams** as vector graphics
- ✅ **Preserves gradients and colors**
- ✅ **A4 format** optimized for printing
- ✅ **Headers and footers** with page numbering
- ✅ **Print backgrounds** included (CSS, images, gradients)

### PNG Output
- ✅ **Full page capture** (scrollable content included)
- ✅ **High resolution** (1920x1080 viewport)
- ✅ **Renders Mermaid diagrams** as high-quality images
- ✅ **Preserves backgrounds and gradients**
- ✅ **PNG format** without quality loss
- ✅ **Perfect for** web documentation, presentations, wikis

## Prerequisites

- **Node.js** (version 16 or higher)
- **npm** (included with Node.js)
- **TypeScript** (installed automatically via npm)

## Installation

1. **Clone or download this repository**

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Install Chromium browser** (required by Playwright):
   ```bash
   npm run install:browsers
   ```
   
   Or manually:
   ```bash
   npx playwright install chromium
   ```

## Quick Start

### Development Mode (TypeScript - Direct)

**To PDF:**
```bash
npx ts-node src/html-to-pdf.ts ./examples/example.html
```

**To PNG:**
```bash
npx ts-node src/html-to-png.ts ./examples/example.html
```

### Build and Run (Compiled JavaScript)

**To PDF:**
```bash
npm run pdf
# Then: node build/html-to-pdf.js ./examples/example.html
```

**To PNG:**
```bash
npm run png
# Then: node build/html-to-png.js ./examples/example.html
```

### Run Examples

The repository includes an example HTML file with Mermaid diagrams:

```bash
# Build TypeScript first, then convert example to PDF
npm run example:pdf

# Build TypeScript first, then convert example to PNG
npm run example:png

# Build TypeScript first, then convert example to both PDF and PNG
npm run example:all

# Or run directly with ts-node (no build step)
npx ts-node src/html-to-pdf.ts ./examples/example.html
npx ts-node src/html-to-png.ts ./examples/example.html
```

Results will be saved to the `dist/` folder.

## CLI Usage

### Development (TypeScript)

```bash
npx ts-node src/html-to-pdf.ts <input-html-file> [options]
npx ts-node src/html-to-png.ts <input-html-file> [options]
```

### Production (Compiled)

First build the TypeScript:
```bash
npm run build
```

Then run the compiled JavaScript:
```bash
node build/html-to-pdf.js <input-html-file> [options]
```

**Options:**
- `-o, --output <dir>` - Output directory (default: `./dist`)
- `-f, --filename <name>` - Output filename without extension (default: input filename)
- `-h, --help` - Show help message

**Examples (TypeScript - Development):**

```bash
# Basic usage - outputs to ./dist/example.pdf
npx ts-node src/html-to-pdf.ts ./examples/example.html

# Custom output directory
npx ts-node src/html-to-pdf.ts ./my-file.html -o ./my-documents

# Custom filename
npx ts-node src/html-to-pdf.ts ./examples/example.html -f my-report

# Both custom directory and filename
npx ts-node src/html-to-pdf.ts ./index.html --output ./exports --filename homepage
```

**Examples (Compiled JavaScript - Production):**

```bash
# First build
npm run build

# Then run
node build/html-to-pdf.js ./examples/example.html
node build/html-to-pdf.js ./my-file.html -o ./my-documents -f report
```

### PNG Converter

```bash
npx ts-node src/html-to-png.ts <input-html-file> [options]
# or after building:
node build/html-to-png.js <input-html-file> [options]
```

**Options:**
- `-o, --output <dir>` - Output directory (default: `./dist`)
- `-f, --filename <name>` - Output filename without extension (default: input filename)
- `-h, --help` - Show help message

**Examples:**

```bash
# Basic usage - outputs to ./dist/example.png
npx ts-node src/html-to-png.ts ./examples/example.html

# Custom output directory
npx ts-node src/html-to-png.ts ./my-file.html -o ./my-images

# Custom filename
npx ts-node src/html-to-png.ts ./examples/example.html -f screenshot

# Both custom directory and filename
npx ts-node src/html-to-png.ts ./index.html --output ./exports --filename homepage
```

Or with compiled JavaScript:
```bash
npm run build
node build/html-to-png.js ./examples/example.html
```

### PNG to PDF Converter (Batch)

Converts all PNG files in a directory to PDF format. Automatically skips PNG files that already have a corresponding PDF with the same name.

```bash
npx ts-node src/png-to-pdf.ts [options]
# or after building:
node build/png-to-pdf.js [options]
```

**Options:**
- `-i, --input <dir>` - Input directory containing PNG files (default: `./dist`)
- `-o, --output <dir>` - Output directory for PDF files (default: same as input)
- `-f, --force` - Overwrite existing PDF files
- `-h, --help` - Show help message

**Examples:**

```bash
# Convert all PNGs in ./dist (skips if PDF already exists)
npx ts-node src/png-to-pdf.ts

# Convert PNGs from a custom directory
npx ts-node src/png-to-pdf.ts -i ./my-images

# Specify different input and output directories
npx ts-node src/png-to-pdf.ts -i ./dist -o ./pdfs

# Force overwrite existing PDFs
npx ts-node src/png-to-pdf.ts --force

# Using npm script
npm run png-to-pdf
npm run png-to-pdf:dev
```

## Project Structure

```
html-to-pdf-png/
├── src/                      # TypeScript source files
│   ├── html-to-pdf.ts        # HTML to PDF conversion script
│   ├── html-to-png.ts        # HTML to PNG conversion script
│   └── png-to-pdf.ts         # PNG to PDF batch converter
├── examples/                 # Example HTML files
│   ├── example.html          # Example with Mermaid diagrams
│   └── example.md            # Source markdown
├── build/                    # Compiled JavaScript (generated by tsc)
├── dist/                     # Default output folder for conversions
├── tsconfig.json             # TypeScript configuration
├── package.json              # Dependencies and npm scripts
└── README.md                 # This file
```

## Troubleshooting

### Error: "Cannot find module 'playwright'"

Make sure you've run `npm install` first.

### Error: "Executable doesn't exist"

Install the browsers with:
```bash
npx playwright install chromium
```

### TypeScript Type Errors

If you see errors like "Cannot find module 'path'" or "Cannot find name 'process'", you need to install the Node.js type definitions:

```bash
npm install
```

This will install `@types/node` which provides TypeScript definitions for Node.js built-in modules.

### Diagrams not appearing in PDF/PNG

The script automatically waits 30 seconds for Mermaid diagrams to render. If your connection is slow, you can increase the wait time in the scripts:

**For PDF (`src/html-to-pdf.ts`):**
```typescript
await page.waitForTimeout(5000); // Increase to 5 seconds or more
```

**For PNG (`src/html-to-png.ts`):**
```typescript
await page.waitForTimeout(5000); // Increase to 5 seconds or more
```

### Memory Error

If the process fails due to memory (especially with PNG images due to their size), try closing other applications or use:

```bash
# For PDF (after building)
node --max-old-space-size=4096 build/html-to-pdf.js ./my-file.html

# For PNG (after building)
node --max-old-space-size=4096 build/html-to-png.js ./my-file.html

# Or with ts-node
node --max-old-space-size=4096 -r ts-node/register src/html-to-pdf.ts ./my-file.html
```

PNG images consume more memory because they capture the full page in high resolution.

## Technical Notes

- Built with **TypeScript** for type safety and better IDE support
- Uses **Chromium** in headless mode (no GUI)
- Viewport configured to **1920x1080** to capture desktop layout
- Actively waits for all Mermaid diagrams to render before capturing
- PDF includes headers/footers with automatic page numbering
- PNG captures in **full-page** format including all scrollable content
- Both formats maintain the visual quality of the original HTML
- TypeScript compiles to `build/` folder; run with `node build/*.js`
- Or use `ts-node` for direct TypeScript execution without compilation

## Use Cases

- **Documentation**: Convert HTML documentation to PDF for distribution
- **Diagrams**: Convert Mermaid or SVG diagrams to PNG for embedding
- **Reports**: Generate PDF reports from HTML templates
- **Screenshots**: Capture full-page screenshots of web pages
- **Archiving**: Save web content in portable formats

## License

MIT

---

Created with ❤️ using Playwright
