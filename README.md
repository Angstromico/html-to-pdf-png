# HTML to PDF & PNG Converter

A powerful and easy-to-use CLI tool to convert any HTML file to **PDF** or **high-quality PNG** images using Playwright. Perfect for documentation, diagrams, reports, and any HTML content.

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

### Convert a Single HTML File

**To PDF:**
```bash
node html-to-pdf.js ./examples/example.html
```

**To PNG:**
```bash
node html-to-png.js ./examples/example.html
```

### Run Examples

The repository includes an example HTML file with Mermaid diagrams:

```bash
# Convert example to PDF
npm run example:pdf

# Convert example to PNG
npm run example:png

# Convert example to both PDF and PNG
npm run example:all
```

Results will be saved to the `dist/` folder.

## CLI Usage

### PDF Converter

```bash
node html-to-pdf.js <input-html-file> [options]
```

**Options:**
- `-o, --output <dir>` - Output directory (default: `./dist`)
- `-f, --filename <name>` - Output filename without extension (default: input filename)
- `-h, --help` - Show help message

**Examples:**

```bash
# Basic usage - outputs to ./dist/example.pdf
node html-to-pdf.js ./examples/example.html

# Custom output directory
node html-to-pdf.js ./my-file.html -o ./my-documents

# Custom filename
node html-to-pdf.js ./examples/example.html -f my-report

# Both custom directory and filename
node html-to-pdf.js ./index.html --output ./exports --filename homepage
```

### PNG Converter

```bash
node html-to-png.js <input-html-file> [options]
```

**Options:**
- `-o, --output <dir>` - Output directory (default: `./dist`)
- `-f, --filename <name>` - Output filename without extension (default: input filename)
- `-h, --help` - Show help message

**Examples:**

```bash
# Basic usage - outputs to ./dist/example.png
node html-to-png.js ./examples/example.html

# Custom output directory
node html-to-png.js ./my-file.html -o ./my-images

# Custom filename
node html-to-png.js ./examples/example.html -f screenshot

# Both custom directory and filename
node html-to-png.js ./index.html --output ./exports --filename homepage
```

## Project Structure

```
html-to-pdf-png/
├── examples/                 # Example HTML files
│   ├── example.html          # Example with Mermaid diagrams
│   └── example.md            # Source markdown
├── dist/                     # Default output folder (created on first run)
├── html-to-pdf.js            # PDF conversion script
├── html-to-png.js            # PNG conversion script
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

### Diagrams not appearing in PDF/PNG

The script automatically waits 30 seconds for Mermaid diagrams to render. If your connection is slow, you can increase the wait time in the scripts:

**For PDF (`html-to-pdf.js`):**
```javascript
await page.waitForTimeout(5000); // Increase to 5 seconds or more
```

**For PNG (`html-to-png.js`):**
```javascript
await page.waitForTimeout(5000); // Increase to 5 seconds or more
```

### Memory Error

If the process fails due to memory (especially with PNG images due to their size), try closing other applications or use:

```bash
# For PDF
node --max-old-space-size=4096 html-to-pdf.js ./my-file.html

# For PNG
node --max-old-space-size=4096 html-to-png.js ./my-file.html
```

PNG images consume more memory because they capture the full page in high resolution.

## Technical Notes

- Uses **Chromium** in headless mode (no GUI)
- Viewport configured to **1920x1080** to capture desktop layout
- Actively waits for all Mermaid diagrams to render before capturing
- PDF includes headers/footers with automatic page numbering
- PNG captures in **full-page** format including all scrollable content
- Both formats maintain the visual quality of the original HTML

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
