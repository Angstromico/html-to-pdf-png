#!/usr/bin/env node

/**
 * Markdown to HTML Converter with Mermaid.js support
 *
 * Usage:
 *   npx ts-node src/md-to-html.ts <input-md-file> [options]
 *   node build/md-to-html.js <input-md-file> [options]
 *
 * Options:
 *   -o, --output <path>     Output directory (default: ./dist)
 *   -f, --filename <name>   Output filename (default: input filename with .html extension)
 *   -t, --title <title>     HTML page title (default: filename)
 *   -h, --help              Show help
 *
 * Examples:
 *   npx ts-node src/md-to-html.ts ./examples/administracion.md
 *   node build/md-to-html.js ./examples/administracion.md -o ./output -f report -t "Technical Report"
 */

import * as fs from 'fs';
import * as path from 'path';
import MarkdownIt from 'markdown-it';
// @ts-ignore - markdown-it-mermaid doesn't have TypeScript definitions
import markdownItMermaid from 'markdown-it-mermaid';

interface ParsedArgs {
  inputFile: string;
  outputDir: string;
  outputFilename: string | null;
  title: string | null;
}

function parseArgs(): ParsedArgs {
  const args: string[] = process.argv.slice(2);

  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    console.log(`
Markdown to HTML Converter with Mermaid.js support

Usage: npx ts-node src/md-to-html.ts <input-md-file> [options]

Arguments:
  input-md-file         Path to the Markdown file to convert (required)

Options:
  -o, --output <dir>    Output directory (default: ./dist)
  -f, --filename <name> Output filename without extension (default: input filename)
  -t, --title <title>   HTML page title (default: filename)
  -h, --help            Show this help message

Examples:
  npx ts-node src/md-to-html.ts ./examples/administracion.md
  npx ts-node src/md-to-html.ts ./examples/administracion.md -o ./output -f report -t "Technical Report"
`);
    process.exit(0);
  }

  const inputFile = args[0];
  let outputDir = './dist';
  let outputFilename: string | null = null;
  let title: string | null = null;

  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '-o':
      case '--output':
        outputDir = args[++i];
        break;
      case '-f':
      case '--filename':
        outputFilename = args[++i];
        break;
      case '-t':
      case '--title':
        title = args[++i];
        break;
    }
  }

  return { inputFile, outputDir, outputFilename, title };
}

function createHtmlTemplate(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f8f9fa;
        }

        .container {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            margin: 20px auto;
        }

        h1, h2, h3, h4, h5, h6 {
            color: #2c3e50;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            font-weight: 600;
        }

        h1 {
            font-size: 2.2em;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            margin-top: 0;
        }

        h2 {
            font-size: 1.8em;
            border-bottom: 2px solid #e74c3c;
            padding-bottom: 8px;
        }

        h3 {
            font-size: 1.4em;
            color: #27ae60;
        }

        p {
            margin-bottom: 1em;
            font-size: 1.1em;
        }

        ul, ol {
            margin-bottom: 1em;
            padding-left: 2em;
        }

        li {
            margin-bottom: 0.5em;
            font-size: 1.1em;
        }

        code {
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }

        pre {
            background: #2c3e50;
            color: #ecf0f1;
            padding: 15px;
            border-radius: 8px;
            overflow-x: auto;
            margin: 1em 0;
        }

        pre code {
            background: none;
            padding: 0;
            color: inherit;
        }

        blockquote {
            border-left: 4px solid #3498db;
            padding-left: 1em;
            margin: 1em 0;
            font-style: italic;
            color: #555;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 1em 0;
            font-size: 1em;
        }

        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }

        th {
            background: #f8f9fa;
            font-weight: 600;
            color: #2c3e50;
        }

        tr:nth-child(even) {
            background: #f8f9fa;
        }

        .mermaid {
            background: white;
            border: 2px solid #e1e8ed;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }

        @media print {
            body {
                background: white;
                max-width: none;
                margin: 0;
                padding: 0;
            }

            .container {
                box-shadow: none;
                border-radius: 0;
                padding: 20px;
                margin: 0;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        ${bodyContent}
    </div>

    <script>
        // Initialize Mermaid
        mermaid.initialize({
            startOnLoad: true,
            theme: 'default',
            securityLevel: 'loose',
            fontFamily: 'arial',
            fontSize: 14
        });
    </script>
</body>
</html>`;
}

async function convertMarkdownToHtml(inputPath: string, outputPath: string, title: string): Promise<void> {
  try {
    // Read the markdown file
    const markdownContent = fs.readFileSync(inputPath, 'utf-8');

    // Initialize markdown-it with mermaid plugin
    const md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true
    });

    // Configure mermaid plugin
    md.use(markdownItMermaid, {
      startOnLoad: false, // We'll initialize manually
      theme: 'default',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true
      },
      sequence: {
        useMaxWidth: true
      }
    });

    // Convert markdown to HTML
    const htmlContent = md.render(markdownContent);

    // Create the full HTML document
    const fullHtml = createHtmlTemplate(title, htmlContent);

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write the HTML file
    fs.writeFileSync(outputPath, fullHtml, 'utf-8');

    console.log(`✅ Successfully converted ${inputPath} to ${outputPath}`);
    console.log(`📄 HTML file created with Mermaid.js support`);

  } catch (error) {
    console.error('❌ Error converting markdown to HTML:', error);
    process.exit(1);
  }
}

async function main() {
  const args = parseArgs();

  // Validate input file
  if (!fs.existsSync(args.inputFile)) {
    console.error(`❌ Input file '${args.inputFile}' does not exist`);
    process.exit(1);
  }

  // Determine output filename
  const inputBasename = path.basename(args.inputFile, path.extname(args.inputFile));
  const outputFilename = args.outputFilename || inputBasename;
  const outputPath = path.join(args.outputDir, `${outputFilename}.html`);

  // Determine title
  const title = args.title || inputBasename.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  console.log(`🔄 Converting ${args.inputFile} to HTML with Mermaid support...`);

  await convertMarkdownToHtml(args.inputFile, outputPath, title);

  console.log(`🎉 Conversion complete!`);
  console.log(`📁 Output: ${outputPath}`);
  console.log(`💡 You can now use this HTML file with the existing html-to-pdf or html-to-png tools`);
}

main().catch(console.error);