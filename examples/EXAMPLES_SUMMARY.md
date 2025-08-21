# Readability.js Examples - Summary

This directory contains three practical examples demonstrating how to use the Readability.js library with Node.js and ES modules.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run examples:**
   ```bash
   # Extract content from a single URL
   node extract-url.js https://example.com
   
   # Process multiple URLs in batch
   node batch-process.js sample-urls.txt
   
   # Analyze extracted content
   node content-analyzer.js output/
   ```

## 📋 Example Overview

### 1. **extract-url.js** - Single URL Content Extractor

**Purpose:** Extract readable content from any URL and save it as a plain text file.

**Features:**
- ✅ Fetches HTML content from any URL
- ✅ Extracts main readable content using Readability.js
- ✅ Saves plain text content to a file
- ✅ Displays metadata (title, author, length, etc.)
- ✅ Auto-generates filenames based on URL and title
- ✅ Handles errors gracefully

**Usage:**
```bash
node extract-url.js <URL> [output-filename]
```

**Example Output:**
```
Readability.js URL Content Extractor
=====================================

Fetching content from: https://en.wikipedia.org/wiki/JavaScript
Fetched 446789 characters of HTML
Extracted article: "JavaScript"
Content length: 53362 characters
Author: Contributors to Wikimedia projects
Content saved to: /workspace/examples/output/en_wikipedia_org_JavaScript.txt
File size: 53613 characters

✅ Extraction completed successfully!
```

### 2. **batch-process.js** - Batch URL Processor

**Purpose:** Process multiple URLs in parallel and generate comprehensive reports.

**Features:**
- ✅ Processes multiple URLs concurrently
- ✅ Configurable concurrency and timeouts
- ✅ Generates detailed summary reports
- ✅ Saves individual content files
- ✅ Handles failures gracefully with retries
- ✅ Provides progress updates

**Usage:**
```bash
node batch-process.js <urls-file> [options]
```

**Options:**
- `--concurrency <number>` - Number of concurrent requests (default: 3)
- `--timeout <ms>` - Request timeout in milliseconds (default: 30000)
- `--no-save` - Skip saving individual files
- `--no-report` - Skip generating summary report

**Example Output:**
```
Readability.js Batch Processor
==============================

Processing 4 URLs with concurrency: 2
Progress: 2/4 (2 successful)
Progress: 4/4 (4 successful)

🎉 Batch processing completed!

SUMMARY:
  Total URLs: 4
  Successful: 4
  Failed: 0
  Success Rate: 100.0%
  Processing Time: 1.98s
  Average Time per URL: 0.49s
```

### 3. **content-analyzer.js** - Content Analysis Tool

**Purpose:** Analyze extracted content for reading metrics and statistics.

**Features:**
- ✅ Calculates reading time and word count
- ✅ Analyzes text complexity and readability scores
- ✅ Detects content type (Technical, News, Academic, etc.)
- ✅ Estimates target audience
- ✅ Generates detailed reports in JSON and text formats
- ✅ Processes single files or entire directories

**Usage:**
```bash
node content-analyzer.js <input-file-or-directory>
```

**Example Output:**
```
Readability.js Content Analyzer
===============================

Found 5 text files in directory

Analyzing content...
  Analyzing: en_wikipedia_org_JavaScript.txt
  Analyzing: developer_mozilla_org_JavaScript_MDN.txt

🎉 Content analysis completed!

SUMMARY:
  Files Analyzed: 5/5
  Total Words: 22,222
  Average Grade Level: 9.6
```

## 📊 Generated Reports

### Batch Processing Reports
- **batch-report.json** - Structured JSON data with all results
- **batch-summary.txt** - Human-readable summary report
- **Individual .txt files** - Extracted content for each URL

### Content Analysis Reports
- **content-analysis.json** - Detailed analysis data in JSON format
- **content-analysis.txt** - Human-readable analysis summary

## 🔧 Configuration

### Performance Tuning
```bash
# Process with higher concurrency for faster results
node batch-process.js urls.txt --concurrency 5

# Use shorter timeout for faster failure detection
node batch-process.js urls.txt --timeout 15000
```

### Custom Output
```bash
# Extract with custom filename
node extract-url.js https://example.com "my-article.txt"

# Batch process without saving individual files
node batch-process.js urls.txt --no-save
```

## 📁 File Structure

```
examples/
├── package.json              # Dependencies and scripts
├── extract-url.js            # Single URL extractor
├── batch-process.js          # Batch URL processor
├── content-analyzer.js       # Content analysis tool
├── sample-urls.txt           # Sample URLs for testing
├── output/                   # Generated content (gitignored)
│   ├── *.txt                 # Extracted articles
│   ├── batch-report.json     # Batch processing report
│   ├── batch-summary.txt     # Batch summary
│   ├── content-analysis.json # Content analysis report
│   └── content-analysis.txt  # Analysis summary
├── .gitignore               # Excludes output files
└── README.md                # Detailed documentation
```

## 🎯 Use Cases

### Content Aggregation
```bash
# Extract articles from RSS feed URLs
node batch-process.js rss-urls.txt --concurrency 5
```

### Research and Analysis
```bash
# Extract and analyze multiple sources
node batch-process.js research-urls.txt
node content-analyzer.js output/
```

### Content Monitoring
```bash
# Extract content from news sites
node extract-url.js https://news-site.com/article
```

### Educational Content Processing
```bash
# Extract and analyze educational materials
node batch-process.js educational-urls.txt
node content-analyzer.js output/ --detailed
```

## ⚠️ Important Notes

### Rate Limiting
- Be respectful of website rate limits
- Use appropriate delays between requests
- Consider using `--concurrency 1` for sensitive sites

### Content Quality
- Some sites may block automated requests
- Paywalled content won't be accessible
- Dynamic content (JavaScript-heavy) may not extract properly

### File Management
- Output files are automatically excluded from git
- Large batch operations can generate many files
- Consider cleanup strategies for long-term use

## 🚀 Advanced Usage

### Custom User Agents
Modify the `userAgent` in `batch-process.js` for different sites:
```javascript
const userAgent = 'Mozilla/5.0 (compatible; MyBot/1.0)';
```

### Error Handling
All examples include comprehensive error handling:
- Network failures
- Invalid URLs
- Parsing errors
- File system issues

### Performance Monitoring
Monitor processing times and success rates:
- Batch processing shows real-time progress
- Summary reports include timing statistics
- Failed URLs are logged with error details

## 🔍 Troubleshooting

### Common Issues
1. **Network errors** - Check internet connection and URL accessibility
2. **Parsing failures** - Some sites may block automated requests
3. **Memory issues** - Large documents may require adjusting limits
4. **Permission errors** - Ensure write access to output directory

### Debug Mode
Enable debug logging by modifying Readability options:
```javascript
const reader = new Readability(doc, { debug: true });
```

## 📈 Performance Benchmarks

Based on testing with various content types:

- **Single URL extraction**: ~0.5-2 seconds
- **Batch processing**: ~0.5 seconds per URL (with concurrency)
- **Content analysis**: ~0.1 seconds per file
- **Memory usage**: ~50-100MB for large batches

## 🤝 Contributing

Feel free to extend these examples:
- Add new analysis metrics
- Implement different output formats
- Create specialized extractors for specific sites
- Add visualization capabilities

Remember to test with various content types and handle edge cases gracefully.