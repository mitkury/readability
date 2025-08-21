#!/usr/bin/env node

import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import TurndownService from 'turndown';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Configure Turndown service with custom options
 */
function createTurndownService(options = {}) {
  const turndownService = new TurndownService({
    headingStyle: 'atx', // Use # style headings
    hr: '---', // Use --- for horizontal rules
    bulletListMarker: '-', // Use - for bullet lists
    codeBlockStyle: 'fenced', // Use ``` for code blocks
    emDelimiter: '*', // Use * for emphasis
    strongDelimiter: '**', // Use ** for strong
    linkStyle: 'inlined', // Use [text](url) style links
    linkReferenceStyle: 'full', // Use full reference style
    ...options
  });

  // Add custom rules for better Markdown conversion
  turndownService.addRule('preserveImages', {
    filter: 'img',
    replacement: function (content, node) {
      const alt = node.alt || '';
      const src = node.src || '';
      const title = node.title || '';
      
      if (!src) return '';
      
      const titleAttr = title ? ` "${title}"` : '';
      return `![${alt}](${src}${titleAttr})`;
    }
  });

  // Preserve code blocks with language detection
  turndownService.addRule('codeBlocks', {
    filter: function (node, options) {
      return (
        node.nodeName === 'PRE' &&
        node.firstChild &&
        node.firstChild.nodeName === 'CODE'
      );
    },
    replacement: function (content, node) {
      const code = node.firstChild;
      const className = code.className || '';
      const language = className.replace(/^language-/, '') || '';
      
      return `\n\`\`\`${language}\n${code.textContent}\n\`\`\`\n`;
    }
  });

  // Better table handling
  turndownService.addRule('tables', {
    filter: 'table',
    replacement: function (content, node) {
      const rows = Array.from(node.querySelectorAll('tr'));
      if (rows.length === 0) return '';
      
      let markdown = '\n';
      
      // Process header row
      const headerRow = rows[0];
      const headerCells = Array.from(headerRow.querySelectorAll('th, td'));
      const headers = headerCells.map(cell => cell.textContent.trim());
      
      markdown += '| ' + headers.join(' | ') + ' |\n';
      markdown += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
      
      // Process data rows
      for (let i = 1; i < rows.length; i++) {
        const cells = Array.from(rows[i].querySelectorAll('td'));
        const rowData = cells.map(cell => cell.textContent.trim());
        markdown += '| ' + rowData.join(' | ') + ' |\n';
      }
      
      return markdown + '\n';
    }
  });

  // Preserve blockquotes
  turndownService.addRule('blockquotes', {
    filter: 'blockquote',
    replacement: function (content, node) {
      const lines = content.split('\n');
      const quotedLines = lines.map(line => line ? `> ${line}` : '>');
      return '\n' + quotedLines.join('\n') + '\n';
    }
  });

  return turndownService;
}

/**
 * Extract content from URL and convert to Markdown
 */
async function extractToMarkdown(url, options = {}) {
  const {
    outputFilename = null,
    turndownOptions = {},
    includeMetadata = true,
    includeOriginalUrl = true,
    includeExtractionDate = true,
    customTitle = null,
    customAuthor = null
  } = options;

  try {
    console.log(`Fetching content from: ${url}`);
    
    // Fetch the HTML content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ReadabilityBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    console.log(`Fetched ${html.length} characters of HTML`);
    
    // Parse with JSDOM
    const dom = new JSDOM(html, { url });
    const doc = dom.window.document;
    
    // Extract content with Readability
    const reader = new Readability(doc);
    const article = reader.parse();
    
    if (!article) {
      throw new Error('No readable content found');
    }
    
    console.log(`Extracted article: "${article.title}"`);
    console.log(`Content length: ${article.length} characters`);
    console.log(`Author: ${article.byline || 'Unknown'}`);
    
    // Convert HTML content to Markdown
    const turndownService = createTurndownService(turndownOptions);
    const markdownContent = turndownService.turndown(article.content);
    
    // Generate output filename if not provided
    let finalOutputFilename = outputFilename;
    if (!finalOutputFilename) {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace(/[^a-zA-Z0-9]/g, '_');
      const title = (customTitle || article.title).replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 50);
      finalOutputFilename = `${hostname}_${title}.md`;
    }
    
    // Ensure output directory exists
    const outputDir = path.join(__dirname, 'output');
    await fs.mkdir(outputDir, { recursive: true });
    
    const outputPath = path.join(outputDir, finalOutputFilename);
    
    // Prepare Markdown content with metadata
    const markdownParts = [];
    
    // Add YAML front matter only if metadata is included
    if (includeMetadata) {
      const frontMatter = {
        title: customTitle || article.title,
        author: customAuthor || article.byline || 'Unknown',
        siteName: article.siteName,
        language: article.lang,
        publishedTime: article.publishedTime,
        extractedAt: new Date().toISOString(),
        wordCount: article.textContent.split(/\s+/).length,
        readingTime: Math.ceil(article.textContent.split(/\s+/).length / 200)
      };
      
      // Remove undefined values
      Object.keys(frontMatter).forEach(key => {
        if (frontMatter[key] === undefined || frontMatter[key] === null) {
          delete frontMatter[key];
        }
      });
      
      markdownParts.push('---');
      markdownParts.push('title: ' + JSON.stringify(frontMatter.title));
      if (frontMatter.author) markdownParts.push('author: ' + JSON.stringify(frontMatter.author));
      if (frontMatter.siteName) markdownParts.push('siteName: ' + JSON.stringify(frontMatter.siteName));
      if (frontMatter.language) markdownParts.push('language: ' + JSON.stringify(frontMatter.language));
      if (frontMatter.publishedTime) markdownParts.push('publishedTime: ' + JSON.stringify(frontMatter.publishedTime));
      markdownParts.push('extractedAt: ' + JSON.stringify(frontMatter.extractedAt));
      markdownParts.push('wordCount: ' + frontMatter.wordCount);
      markdownParts.push('readingTime: ' + frontMatter.readingTime);
      markdownParts.push('---');
      markdownParts.push('');
    }
    
    // Add title
    markdownParts.push(`# ${customTitle || article.title}`);
    markdownParts.push('');
    
    // Add metadata section only if metadata is included
    if (includeMetadata) {
      markdownParts.push('## Metadata');
      markdownParts.push('');
      if (customAuthor || article.byline) {
        markdownParts.push(`**Author:** ${customAuthor || article.byline}`);
        markdownParts.push('');
      }
      if (article.siteName) {
        markdownParts.push(`**Site:** ${article.siteName}`);
        markdownParts.push('');
      }
      if (article.excerpt) {
        markdownParts.push(`**Excerpt:** ${article.excerpt}`);
        markdownParts.push('');
      }
      if (includeOriginalUrl) {
        markdownParts.push(`**Original URL:** ${url}`);
        markdownParts.push('');
      }
      if (includeExtractionDate) {
        markdownParts.push(`**Extracted:** ${new Date().toLocaleString()}`);
        markdownParts.push('');
      }
      markdownParts.push('---');
      markdownParts.push('');
    }
    
    // Add main content
    if (includeMetadata) {
      markdownParts.push('## Content');
      markdownParts.push('');
    }
    markdownParts.push(markdownContent);
    
    // Add footer
    markdownParts.push('');
    markdownParts.push('---');
    markdownParts.push('');
    markdownParts.push('*This content was extracted using Readability.js and converted to Markdown format.*');
    
    const finalMarkdown = markdownParts.join('\n');
    
    // Save to file
    await fs.writeFile(outputPath, finalMarkdown, 'utf8');
    
    console.log(`Markdown saved to: ${outputPath}`);
    console.log(`File size: ${finalMarkdown.length} characters`);
    
    return {
      success: true,
      title: article.title,
      length: article.length,
      markdownLength: finalMarkdown.length,
      outputPath,
      metadata: {
        byline: article.byline,
        siteName: article.siteName,
        lang: article.lang,
        publishedTime: article.publishedTime,
        excerpt: article.excerpt,
        wordCount: article.textContent.split(/\s+/).length,
        readingTime: Math.ceil(article.textContent.split(/\s+/).length / 200)
      }
    };
    
  } catch (error) {
    console.error('Error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Batch convert multiple URLs to Markdown
 */
async function batchConvertToMarkdown(urls, options = {}) {
  const {
    concurrency = 3,
    outputDir = 'output',
    includeMetadata = true,
    customTurndownOptions = {}
  } = options;
  
  console.log(`Converting ${urls.length} URLs to Markdown with concurrency: ${concurrency}`);
  console.log('');
  
  const results = [];
  const startTime = Date.now();
  
  // Process URLs in batches
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const batchPromises = batch.map(url => extractToMarkdown(url, {
      includeMetadata,
      turndownOptions: customTurndownOptions
    }));
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Progress update
    const processed = Math.min(i + concurrency, urls.length);
    const successCount = results.filter(r => r.success).length;
    console.log(`Progress: ${processed}/${urls.length} (${successCount} successful)`);
  }
  
  const endTime = Date.now();
  const processingTime = (endTime - startTime) / 1000;
  
  // Generate summary report
  await generateMarkdownReport(results, processingTime, outputDir);
  
  return {
    results,
    summary: {
      total: urls.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      processingTime,
      averageTime: processingTime / urls.length
    }
  };
}

/**
 * Generate summary report for batch conversion
 */
async function generateMarkdownReport(results, processingTime, outputDir) {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  const report = {
    summary: {
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      successRate: (successful.length / results.length * 100).toFixed(1),
      processingTime: processingTime.toFixed(2),
      averageTime: (processingTime / results.length).toFixed(2),
      totalMarkdownSize: successful.reduce((sum, r) => sum + r.markdownLength, 0)
    },
    successful: successful.map(r => ({
      title: r.title,
      outputPath: r.outputPath,
      length: r.length,
      markdownLength: r.markdownLength,
      metadata: r.metadata
    })),
    failed: failed.map(r => ({
      error: r.error
    }))
  };
  
  // Save JSON report
  const jsonPath = path.join(__dirname, outputDir, 'markdown-conversion-report.json');
  await fs.writeFile(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  
  // Generate human-readable summary
  const summaryText = [
    'MARKDOWN CONVERSION REPORT',
    '=========================',
    '',
    `Total URLs: ${report.summary.total}`,
    `Successful: ${report.summary.successful}`,
    `Failed: ${report.summary.failed}`,
    `Success Rate: ${report.summary.successRate}%`,
    `Processing Time: ${report.summary.processingTime}s`,
    `Average Time per URL: ${report.summary.averageTime}s`,
    `Total Markdown Size: ${report.summary.totalMarkdownSize.toLocaleString()} characters`,
    '',
    'SUCCESSFUL CONVERSIONS',
    '=====================',
    ...successful.map(r => `- ${r.title} (${r.markdownLength} chars) - ${r.outputPath}`),
    '',
    'FAILED CONVERSIONS',
    '==================',
    ...failed.map(r => `- ${r.error}`)
  ].join('\n');
  
  const summaryPath = path.join(__dirname, outputDir, 'markdown-conversion-summary.txt');
  await fs.writeFile(summaryPath, summaryText, 'utf8');
  
  console.log('\n📊 Generated conversion reports:');
  console.log(`  📄 JSON Report: ${jsonPath}`);
  console.log(`  📝 Text Summary: ${summaryPath}`);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node extract-to-markdown.js <URL> [output-filename] [options]');
    console.log('');
    console.log('Options:');
    console.log('  --no-metadata        Skip YAML front matter and metadata section');
    console.log('  --no-url            Skip original URL in metadata');
    console.log('  --no-date           Skip extraction date in metadata');
    console.log('  --title "Title"     Use custom title instead of extracted title');
    console.log('  --author "Author"   Use custom author instead of extracted author');
    console.log('');
    console.log('Examples:');
    console.log('  node extract-to-markdown.js https://example.com');
    console.log('  node extract-to-markdown.js https://en.wikipedia.org/wiki/JavaScript "javascript-article.md"');
    console.log('  node extract-to-markdown.js https://example.com --no-metadata --title "Custom Title"');
    console.log('');
    console.log('The script will:');
    console.log('1. Fetch the HTML content from the URL');
    console.log('2. Extract the main readable content using Readability.js');
    console.log('3. Convert the HTML content to Markdown format');
    console.log('4. Add YAML front matter with metadata');
    console.log('5. Save the result as a .md file');
    process.exit(1);
  }
  
  const url = args[0];
  let outputFilename = args[1] || null;
  const options = {
    includeMetadata: true,
    includeOriginalUrl: true,
    includeExtractionDate: true
  };
  
  // Parse command line options
  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--no-metadata':
        options.includeMetadata = false;
        break;
      case '--no-url':
        options.includeOriginalUrl = false;
        break;
      case '--no-date':
        options.includeExtractionDate = false;
        break;
      case '--title':
        options.customTitle = args[++i];
        break;
      case '--author':
        options.customAuthor = args[++i];
        break;
    }
  }
  
  // Validate URL
  try {
    new URL(url);
  } catch (error) {
    console.error('Error: Invalid URL provided');
    process.exit(1);
  }
  
  console.log('Readability.js Markdown Converter');
  console.log('==================================');
  console.log('');
  
  const result = await extractToMarkdown(url, options);
  
  if (result.success) {
    console.log('');
    console.log('✅ Markdown conversion completed successfully!');
    console.log('');
    console.log('Metadata:');
    console.log(`  Site: ${result.metadata.siteName || 'Unknown'}`);
    console.log(`  Language: ${result.metadata.lang || 'Unknown'}`);
    console.log(`  Word Count: ${result.metadata.wordCount.toLocaleString()}`);
    console.log(`  Reading Time: ${result.metadata.readingTime} minutes`);
    if (result.metadata.publishedTime) {
      console.log(`  Published: ${result.metadata.publishedTime}`);
    }
  } else {
    console.log('');
    console.log('❌ Markdown conversion failed');
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});