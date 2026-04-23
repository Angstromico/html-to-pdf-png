# HTML to PDF & PNG Converter - Example

This is an example markdown file that demonstrates the HTML to PDF/PNG converter.

## About

This tool allows you to convert any HTML file to:
- **PDF** - Perfect for documents, reports, and printing
- **PNG** - High-quality images for web, presentations, and documentation

## Usage

```bash
# Convert to PDF
node html-to-pdf.js ./examples/example.html

# Convert to PNG
node html-to-png.js ./examples/example.html

# Custom output directory
node html-to-pdf.js ./examples/example.html -o ./my-output

# Custom filename
node html-to-png.js ./examples/example.html -f my-screenshot
```

## Features

- ✅ Full page capture
- ✅ Mermaid diagram support
- ✅ High resolution (1920x1080)
- ✅ CLI interface with customizable options
- ✅ Preserves CSS styling and backgrounds

## Example Output

Run `npm run example:all` to generate both PDF and PNG versions of this example file.

The output will be saved to the `dist/` folder by default.
