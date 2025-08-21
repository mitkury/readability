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
 * Extract content from a single URL
 */
async function extractContent(url, options = {}) {
  const {
    timeout = 30000,
    userAgent = 'Mozilla/5.0 (compatible; ReadabilityBot/1.0)',
    retries = 2
  } = options;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`  Fetching: ${url} (attempt ${attempt}/${retries})`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      
      // Parse with JSDOM
      const dom = new JSDOM(html, { url });
      const doc = dom.window.document;
      
      // Extract content with Readability
      const reader = new Readability(doc);
      const article = reader.parse();
      
      if (!article) {
        throw new Error('No readable content found');
      }
      
      return {
        success: true,
        url,
        title: article.title,
        length: article.length,
        byline: article.byline,
        siteName: article.siteName,
        lang: article.lang,
        publishedTime: article.publishedTime,
        excerpt: article.excerpt,
        textContent: article.textContent
      };
      
    } catch (error) {
      console.log(`  ❌ Failed: ${error.message}`);
      
      if (attempt === retries) {
        return {
          success: false,
          url,
          error: error.message
        };
      }
      
      // Wait before retry with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Process multiple URLs in batches
 */
async function batchProcess(urls, options = {}) {
  const {
    concurrency = 3,
    outputDir = 'output',
    saveIndividual = true,
    generateReport = true
  } = options;
  
  console.log(`Processing ${urls.length} URLs with concurrency: ${concurrency}`);
  console.log('');
  
  const results = [];
  const startTime = Date.now();
  
  // Process URLs in batches
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const batchPromises = batch.map(url => extractContent(url, options));
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Progress update
    const processed = Math.min(i + concurrency, urls.length);
    const successCount = results.filter(r => r.success).length;
    console.log(`Progress: ${processed}/${urls.length} (${successCount} successful)`);
  }
  
  const endTime = Date.now();
  const processingTime = (endTime - startTime) / 1000;
  
  // Save individual files if requested
  if (saveIndividual) {
    await saveIndividualFiles(results, outputDir);
  }
  
  // Generate summary report
  if (generateReport) {
    await generateSummaryReport(results, processingTime, outputDir);
  }
  
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
 * Save individual content files
 */
async function saveIndividualFiles(results, outputDir) {
  const outputPath = path.join(__dirname, outputDir);
  await fs.mkdir(outputPath, { recursive: true });
  
  console.log('\nSaving individual files...');
  
  for (const result of results) {
    if (!result.success) continue;
    
    const urlObj = new URL(result.url);
    const hostname = urlObj.hostname.replace(/[^a-zA-Z0-9]/g, '_');
    const title = result.title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 50);
    const filename = `${hostname}_${title}.txt`;
    
    const content = [
      `Title: ${result.title}`,
      `Author: ${result.byline || 'Unknown'}`,
      `URL: ${result.url}`,
      `Extracted: ${new Date().toISOString()}`,
      `Length: ${result.length} characters`,
      '',
      '='.repeat(80),
      '',
      result.textContent
    ].join('\n');
    
    const filePath = path.join(outputPath, filename);
    await fs.writeFile(filePath, content, 'utf8');
    console.log(`  ✅ Saved: ${filename}`);
  }
}

/**
 * Generate summary report
 */
async function generateSummaryReport(results, processingTime, outputDir) {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  const report = {
    summary: {
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      successRate: (successful.length / results.length * 100).toFixed(1),
      processingTime: processingTime.toFixed(2),
      averageTime: (processingTime / results.length).toFixed(2)
    },
    successful: successful.map(r => ({
      url: r.url,
      title: r.title,
      length: r.length,
      byline: r.byline,
      siteName: r.siteName
    })),
    failed: failed.map(r => ({
      url: r.url,
      error: r.error
    })),
    statistics: {
      totalCharacters: successful.reduce((sum, r) => sum + r.length, 0),
      averageLength: successful.length > 0 ? Math.round(successful.reduce((sum, r) => sum + r.length, 0) / successful.length) : 0,
      sites: [...new Set(successful.map(r => r.siteName).filter(Boolean))],
      languages: [...new Set(successful.map(r => r.lang).filter(Boolean))]
    }
  };
  
  const outputPath = path.join(__dirname, outputDir, 'batch-report.json');
  await fs.writeFile(outputPath, JSON.stringify(report, null, 2), 'utf8');
  
  // Also create a human-readable summary
  const summaryText = [
    'BATCH PROCESSING REPORT',
    '=====================',
    '',
    `Total URLs: ${report.summary.total}`,
    `Successful: ${report.summary.successful}`,
    `Failed: ${report.summary.failed}`,
    `Success Rate: ${report.summary.successRate}%`,
    `Processing Time: ${report.summary.processingTime}s`,
    `Average Time per URL: ${report.summary.averageTime}s`,
    '',
    'STATISTICS',
    '==========',
    `Total Characters: ${report.statistics.totalCharacters.toLocaleString()}`,
    `Average Article Length: ${report.statistics.averageLength.toLocaleString()} characters`,
    `Unique Sites: ${report.statistics.sites.length}`,
    `Languages: ${report.statistics.languages.join(', ') || 'Unknown'}`,
    '',
    'SUCCESSFUL EXTRACTIONS',
    '=====================',
    ...successful.map(r => `- ${r.title} (${r.length} chars) - ${r.url}`),
    '',
    'FAILED EXTRACTIONS',
    '==================',
    ...failed.map(r => `- ${r.url}: ${r.error}`)
  ].join('\n');
  
  const summaryPath = path.join(__dirname, outputDir, 'batch-summary.txt');
  await fs.writeFile(summaryPath, summaryText, 'utf8');
  
  console.log('\n📊 Generated reports:');
  console.log(`  📄 JSON Report: ${outputPath}`);
  console.log(`  📝 Text Summary: ${summaryPath}`);
}

/**
 * Load URLs from file
 */
async function loadUrlsFromFile(filename) {
  try {
    const content = await fs.readFile(filename, 'utf8');
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .filter(line => {
        try {
          new URL(line);
          return true;
        } catch {
          console.warn(`Warning: Invalid URL skipped: ${line}`);
          return false;
        }
      });
  } catch (error) {
    throw new Error(`Failed to read URLs file: ${error.message}`);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node batch-process.js <urls-file> [options]');
    console.log('');
    console.log('Options:');
    console.log('  --concurrency <number>  Number of concurrent requests (default: 3)');
    console.log('  --timeout <ms>          Request timeout in milliseconds (default: 30000)');
    console.log('  --no-save               Skip saving individual files');
    console.log('  --no-report             Skip generating summary report');
    console.log('');
    console.log('URLs file format:');
    console.log('  https://example.com/article1');
    console.log('  https://example.com/article2');
    console.log('  # Comments start with #');
    console.log('');
    console.log('Example:');
    console.log('  node batch-process.js urls.txt --concurrency 5 --timeout 15000');
    process.exit(1);
  }
  
  const urlsFile = args[0];
  const options = {
    concurrency: 3,
    timeout: 30000,
    saveIndividual: true,
    generateReport: true
  };
  
  // Parse command line options
  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--concurrency':
        options.concurrency = parseInt(args[++i]) || 3;
        break;
      case '--timeout':
        options.timeout = parseInt(args[++i]) || 30000;
        break;
      case '--no-save':
        options.saveIndividual = false;
        break;
      case '--no-report':
        options.generateReport = false;
        break;
    }
  }
  
  console.log('Readability.js Batch Processor');
  console.log('==============================');
  console.log('');
  console.log(`URLs file: ${urlsFile}`);
  console.log(`Concurrency: ${options.concurrency}`);
  console.log(`Timeout: ${options.timeout}ms`);
  console.log('');
  
  try {
    const urls = await loadUrlsFromFile(urlsFile);
    
    if (urls.length === 0) {
      console.error('No valid URLs found in file');
      process.exit(1);
    }
    
    console.log(`Loaded ${urls.length} URLs from file`);
    console.log('');
    
    const result = await batchProcess(urls, options);
    
    console.log('');
    console.log('🎉 Batch processing completed!');
    console.log('');
    console.log('SUMMARY:');
    console.log(`  Total URLs: ${result.summary.total}`);
    console.log(`  Successful: ${result.summary.successful}`);
    console.log(`  Failed: ${result.summary.failed}`);
    console.log(`  Success Rate: ${(result.summary.successful / result.summary.total * 100).toFixed(1)}%`);
    console.log(`  Processing Time: ${result.summary.processingTime.toFixed(2)}s`);
    console.log(`  Average Time per URL: ${result.summary.averageTime.toFixed(2)}s`);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});