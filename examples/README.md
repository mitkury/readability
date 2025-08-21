# Readability.js Examples

This directory contains practical examples demonstrating how to use the Readability.js library with Node.js and ES modules.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Make sure you have Node.js version 14 or higher installed.

## Examples

### 1. Extract URL Content (`extract-url.js`)

Extract readable content from any URL and save it as a plain text file.

**Usage:**
```bash
node extract-url.js <URL> [output-filename]
```

**Examples:**
```bash
# Extract content from a website
node extract-url.js https://example.com

# Extract content with custom filename
node extract-url.js https://en.wikipedia.org/wiki/JavaScript "javascript-article.txt"

# Extract from a news article
node extract-url.js https://news.ycombinator.com/item?id=123456
```

**Features:**
- Fetches HTML content from any URL
- Extracts main readable content using Readability.js
- Saves plain text content to a file
- Displays metadata (title, author, length, etc.)
- Auto-generates filenames based on URL and title
- Handles errors gracefully

**Output:**
- Files are saved in the `output/` directory
- Each file includes metadata header and extracted content
- Filename format: `{hostname}_{title}.txt`

### 2. Batch Processing (`batch-process.js`)

Process multiple URLs in parallel and generate a summary report.

**Usage:**
```bash
node batch-process.js <urls-file>
```

**URLs file format:**
```
https://example.com/article1
https://example.com/article2
https://example.com/article3
```

**Features:**
- Processes multiple URLs concurrently
- Generates summary report with statistics
- Handles failures gracefully
- Configurable concurrency and timeouts

### 3. Content Analyzer (`content-analyzer.js`)

Analyze extracted content for reading metrics and statistics.

**Usage:**
```bash
node content-analyzer.js <input-file>
```

**Features:**
- Calculates reading time and word count
- Analyzes text complexity and readability
- Generates content statistics
- Exports analysis results

## Output Directory

All extracted content is saved to the `output/` directory, which is automatically created and excluded from version control.

## File Structure

```
examples/
├── package.json          # Dependencies and scripts
├── extract-url.js        # URL content extractor
├── batch-process.js      # Batch URL processor
├── content-analyzer.js   # Content analysis tool
├── output/               # Generated content files (gitignored)
└── README.md            # This file
```

## Dependencies

- `@mozilla/readability`: The main Readability library
- `jsdom`: DOM implementation for Node.js
- `node-fetch`: HTTP client for fetching web content

## Error Handling

All examples include comprehensive error handling:
- Invalid URLs
- Network errors
- Parsing failures
- File system errors
- Content extraction failures

## Performance Notes

- The `extract-url.js` example processes one URL at a time
- For batch processing, use `batch-process.js` with configurable concurrency
- Large documents are handled efficiently with configurable limits
- Memory usage is optimized for processing multiple documents

## Security Considerations

- Always validate URLs before processing
- Be aware of rate limiting when scraping websites
- Consider using appropriate user agents for web requests
- Sanitize output content if displaying in web applications

## Troubleshooting

**Common Issues:**

1. **Network errors**: Check your internet connection and URL accessibility
2. **Parsing failures**: Some sites may block automated requests
3. **Memory issues**: Large documents may require adjusting limits
4. **Permission errors**: Ensure write access to the output directory

**Debug Mode:**
Enable debug logging by modifying the Readability options:
```javascript
const reader = new Readability(doc, { debug: true });
```

## Contributing

Feel free to add new examples or improve existing ones. Make sure to:
- Test with various types of content
- Handle edge cases gracefully
- Include proper error handling
- Document any new features