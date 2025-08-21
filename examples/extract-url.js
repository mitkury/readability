#!/usr/bin/env node

import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Extract readable content from a URL and save it to a file
 * Usage: node extract-url.js <URL> [output-filename]
 */
async function extractAndSave(url, outputFilename = null) {
  try {
    console.log(`Fetching content from: ${url}`);
    
    // Fetch the HTML content
    const response = await fetch(url);
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
    
    // Generate output filename if not provided
    if (!outputFilename) {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace(/[^a-zA-Z0-9]/g, '_');
      const title = article.title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 50);
      outputFilename = `${hostname}_${title}.txt`;
    }
    
    // Ensure output directory exists
    const outputDir = path.join(__dirname, 'output');
    await fs.mkdir(outputDir, { recursive: true });
    
    const outputPath = path.join(outputDir, outputFilename);
    
    // Prepare content for saving
    const content = [
      `Title: ${article.title}`,
      `Author: ${article.byline || 'Unknown'}`,
      `URL: ${url}`,
      `Extracted: ${new Date().toISOString()}`,
      `Length: ${article.length} characters`,
      '',
      '='.repeat(80),
      '',
      article.textContent
    ].join('\n');
    
    // Save to file
    await fs.writeFile(outputPath, content, 'utf8');
    
    console.log(`Content saved to: ${outputPath}`);
    console.log(`File size: ${content.length} characters`);
    
    return {
      success: true,
      title: article.title,
      length: article.length,
      outputPath,
      metadata: {
        byline: article.byline,
        siteName: article.siteName,
        lang: article.lang,
        publishedTime: article.publishedTime
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

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node extract-url.js <URL> [output-filename]');
    console.log('');
    console.log('Examples:');
    console.log('  node extract-url.js https://example.com/article');
    console.log('  node extract-url.js https://news.ycombinator.com/item?id=123456 "hacker-news-article.txt"');
    console.log('');
    console.log('The script will:');
    console.log('1. Fetch the HTML content from the URL');
    console.log('2. Extract the main readable content using Readability.js');
    console.log('3. Save the plain text content to a file in the output/ directory');
    console.log('4. Display metadata about the extracted content');
    process.exit(1);
  }
  
  const url = args[0];
  const outputFilename = args[1] || null;
  
  // Validate URL
  try {
    new URL(url);
  } catch (error) {
    console.error('Error: Invalid URL provided');
    process.exit(1);
  }
  
  console.log('Readability.js URL Content Extractor');
  console.log('=====================================');
  console.log('');
  
  const result = await extractAndSave(url, outputFilename);
  
  if (result.success) {
    console.log('');
    console.log('✅ Extraction completed successfully!');
    console.log('');
    console.log('Metadata:');
    console.log(`  Site: ${result.metadata.siteName || 'Unknown'}`);
    console.log(`  Language: ${result.metadata.lang || 'Unknown'}`);
    if (result.metadata.publishedTime) {
      console.log(`  Published: ${result.metadata.publishedTime}`);
    }
  } else {
    console.log('');
    console.log('❌ Extraction failed');
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});