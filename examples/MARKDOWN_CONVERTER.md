# Markdown Converter Example

The `extract-to-markdown.js` example demonstrates how to use Readability.js with Turndown to convert web content into clean Markdown format with YAML front matter.

## Overview

This example combines the content extraction capabilities of Readability.js with the HTML-to-Markdown conversion power of Turndown to create a comprehensive content processing pipeline.

## Features

### 🎯 **Content Extraction**
- Extracts main readable content from any URL
- Removes navigation, ads, and other clutter
- Preserves important content structure

### 📝 **Markdown Conversion**
- Converts HTML to clean Markdown format
- Preserves images, links, tables, and code blocks
- Handles complex formatting and structure
- Customizable conversion options

### 📊 **Metadata Management**
- YAML front matter with article metadata
- Configurable metadata inclusion
- Custom title and author support
- Extraction timestamps and statistics

### ⚙️ **Configuration Options**
- Toggle metadata inclusion
- Custom titles and authors
- Selective metadata fields
- Output filename control

## Usage

### Basic Usage

```bash
# Convert a single URL to Markdown
node extract-to-markdown.js https://example.com

# Convert with custom filename
node extract-to-markdown.js https://en.wikipedia.org/wiki/JavaScript "javascript-article.md"
```

### Advanced Options

```bash
# Skip all metadata (clean output)
node extract-to-markdown.js https://example.com --no-metadata

# Use custom title and author
node extract-to-markdown.js https://example.com --title "My Custom Title" --author "John Doe"

# Skip specific metadata fields
node extract-to-markdown.js https://example.com --no-url --no-date
```

## Output Format

### With Metadata (Default)

```markdown
---
title: "Article Title"
author: "Author Name"
siteName: "Website Name"
language: "en"
publishedTime: "2023-01-01T12:00:00Z"
extractedAt: "2025-08-21T06:44:47.237Z"
wordCount: 1500
readingTime: 8
---

# Article Title

## Metadata

**Author:** Author Name

**Site:** Website Name

**Excerpt:** Brief description of the article...

**Original URL:** https://example.com/article

**Extracted:** 8/21/2025, 6:44:47 AM

---

## Content

The main article content converted to Markdown format...

[Link text](https://example.com)

![Image alt text](https://example.com/image.jpg)

---

*This content was extracted using Readability.js and converted to Markdown format.*
```

### Without Metadata (Clean)

```markdown
# Article Title

The main article content converted to Markdown format...

[Link text](https://example.com)

![Image alt text](https://example.com/image.jpg)

---

*This content was extracted using Readability.js and converted to Markdown format.*
```

## Configuration

### Turndown Options

The converter uses a customized Turndown service with the following settings:

```javascript
const turndownService = new TurndownService({
  headingStyle: 'atx',        // Use # style headings
  hr: '---',                  // Use --- for horizontal rules
  bulletListMarker: '-',      // Use - for bullet lists
  codeBlockStyle: 'fenced',   // Use ``` for code blocks
  emDelimiter: '*',           // Use * for emphasis
  strongDelimiter: '**',      // Use ** for strong
  linkStyle: 'inlined',       // Use [text](url) style links
  linkReferenceStyle: 'full'  // Use full reference style
});
```

### Custom Rules

The converter includes several custom rules for better Markdown conversion:

1. **Image Preservation**: Maintains image alt text and titles
2. **Code Block Detection**: Preserves language hints for syntax highlighting
3. **Table Conversion**: Converts HTML tables to Markdown tables
4. **Blockquote Handling**: Properly formats quoted content

## Command Line Options

| Option | Description | Example |
|--------|-------------|---------|
| `--no-metadata` | Skip YAML front matter and metadata section | `--no-metadata` |
| `--no-url` | Skip original URL in metadata | `--no-url` |
| `--no-date` | Skip extraction date in metadata | `--no-date` |
| `--title` | Use custom title | `--title "My Title"` |
| `--author` | Use custom author | `--author "John Doe"` |

## Use Cases

### Content Migration
```bash
# Convert existing web content to Markdown for migration
node extract-to-markdown.js https://old-blog.com/post-123 "migrated-post.md"
```

### Documentation Generation
```bash
# Extract technical documentation
node extract-to-markdown.js https://docs.example.com/api --title "API Documentation"
```

### Content Aggregation
```bash
# Convert multiple articles to Markdown
for url in $(cat urls.txt); do
  node extract-to-markdown.js "$url"
done
```

### Static Site Generation
```bash
# Generate Markdown files for static site generators
node extract-to-markdown.js https://example.com/blog-post --no-metadata > posts/blog-post.md
```

## Integration Examples

### With Static Site Generators

```bash
# Generate Hugo-compatible content
node extract-to-markdown.js https://example.com/article > content/posts/article.md

# Generate Jekyll-compatible content
node extract-to-markdown.js https://example.com/article > _posts/2025-08-21-article.md
```

### With Content Management Systems

```bash
# Generate clean content for CMS import
node extract-to-markdown.js https://example.com/article --no-metadata > cms-content.md
```

### With Documentation Tools

```bash
# Convert documentation to Markdown for GitBook
node extract-to-markdown.js https://docs.example.com/page > docs/page.md
```

## Performance

- **Processing Speed**: ~0.5-2 seconds per URL
- **Memory Usage**: Efficient for large documents
- **Output Quality**: High-quality Markdown with preserved structure
- **Error Handling**: Graceful handling of conversion failures

## Limitations

### Content Types
- Works best with article-style content
- May struggle with complex interactive elements
- JavaScript-heavy content may not convert properly

### Formatting
- Some complex CSS layouts may not convert perfectly
- Dynamic content loaded via JavaScript won't be captured
- Very complex tables might need manual adjustment

### Site Restrictions
- Some sites may block automated requests
- Paywalled content won't be accessible
- Rate limiting may affect batch processing

## Troubleshooting

### Common Issues

1. **Conversion Errors**: Check if the source HTML is valid
2. **Missing Content**: Verify the URL is accessible and contains readable content
3. **Formatting Issues**: Complex layouts may require manual adjustment
4. **Metadata Problems**: Ensure the source page has proper meta tags

### Debug Mode

Enable debug logging by modifying the Readability options:

```javascript
const reader = new Readability(doc, { debug: true });
```

### Custom Conversion Rules

You can add custom Turndown rules for specific content types:

```javascript
turndownService.addRule('customRule', {
  filter: 'div.custom-class',
  replacement: function (content, node) {
    return `\n\n${content}\n\n`;
  }
});
```

## Best Practices

### Content Quality
- Always review converted content for accuracy
- Check that important formatting is preserved
- Verify that links and images are properly converted

### Performance
- Use appropriate timeouts for large documents
- Consider rate limiting for batch processing
- Monitor memory usage for large-scale conversions

### Output Management
- Use descriptive filenames for better organization
- Consider version control for converted content
- Implement backup strategies for important conversions

## Future Enhancements

Potential improvements for the Markdown converter:

1. **Batch Processing**: Add support for processing multiple URLs
2. **Template System**: Allow custom output templates
3. **Plugin Architecture**: Support for custom conversion rules
4. **Quality Metrics**: Add content quality assessment
5. **Format Validation**: Validate output Markdown syntax

## Dependencies

- `@mozilla/readability`: Content extraction
- `turndown`: HTML to Markdown conversion
- `jsdom`: DOM manipulation
- `node-fetch`: HTTP requests

The Markdown converter provides a powerful tool for converting web content into clean, structured Markdown format suitable for various content management and documentation systems.