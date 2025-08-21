# Readability.js: A Comprehensive Overview

## What is Readability.js?

Readability.js is a JavaScript library that automatically extracts the main content from web pages, removing navigation, headers, footers, ads, and other non-essential elements. It's the same technology that powers Firefox's Reader View feature, providing a clean, distraction-free reading experience.

## Key Features

### 🎯 **Content Extraction**
- Automatically identifies and extracts the main article content
- Removes navigation, ads, comments, and other clutter
- Preserves images, videos, and formatting when appropriate
- Handles various content layouts and structures

### 📊 **Metadata Extraction**
- Extracts article title, author, and publication date
- Identifies site name and content language
- Supports JSON-LD structured data parsing
- Falls back to meta tags and content-based extraction

### ⚙️ **Configurable Processing**
- Customizable scoring algorithms
- Adjustable content thresholds
- Configurable element limits for performance
- Custom output serializers

### 🌐 **Cross-Platform Support**
- Works in browsers and Node.js environments
- Web worker compatible for background processing
- Lightweight DOM parser for server-side use

## How It Works

### 1. **Document Preparation**
The library starts by cleaning up the HTML document:
- Removes `<style>` tags to eliminate CSS interference
- Converts consecutive `<br>` elements into proper `<p>` paragraphs
- Normalizes deprecated HTML elements like `<font>` tags

### 2. **Content Scoring**
Each potential content element is scored based on multiple factors:
- **Text Length**: Longer content gets higher scores
- **Punctuation**: Commas and natural language indicators boost scores
- **Link Density**: High link density reduces scores (indicates navigation/ad content)
- **Class Names**: Semantic keywords in class names affect scoring
- **Element Types**: Block-level content is preferred over inline content

### 3. **Candidate Selection**
The algorithm:
- Scores all potential content elements
- Propagates scores up the DOM tree to parent containers
- Selects the top-scoring candidate as the main content area
- Looks for related content in sibling elements

### 4. **Content Refinement**
Final processing includes:
- Converting relative URLs to absolute URLs
- Simplifying nested HTML structures
- Removing unnecessary CSS classes (unless preserved)
- Extracting metadata from various sources

## When to Use Readability.js

### ✅ **Perfect For**
- **Content Aggregation**: Extracting articles from RSS feeds or news sites
- **Reading Apps**: Creating distraction-free reading experiences
- **Content Analysis**: Processing large volumes of web content
- **Browser Extensions**: Adding reader mode functionality
- **Data Mining**: Extracting structured content from web pages
- **Accessibility**: Providing clean content for screen readers

### ❌ **Not Suitable For**
- **E-commerce Pages**: Product listings and shopping carts
- **Social Media**: Dynamic, user-generated content feeds
- **Web Applications**: Interactive applications and dashboards
- **Image Galleries**: Pages primarily consisting of images
- **Video Platforms**: Video-focused content

## Performance Characteristics

### **Speed**
- **Quick Check**: `isProbablyReaderable()` for fast pre-screening
- **Full Parsing**: Typically 10-100ms for standard articles
- **Large Documents**: Configurable limits prevent infinite processing

### **Memory Usage**
- **Efficient**: Processes documents incrementally
- **Configurable**: Element limits prevent memory issues
- **Cleanup**: Removes processed nodes to free memory

### **Scalability**
- **Batch Processing**: Can handle multiple documents efficiently
- **Worker Support**: Safe for background processing
- **Caching**: Results can be cached for repeated access

## Output Format

The library returns a structured object containing:

```javascript
{
  title: "Article Title",
  content: "<div>Main article content...</div>",
  textContent: "Plain text version of the content",
  length: 2500, // Character count
  excerpt: "Brief description or excerpt",
  byline: "Author Name",
  dir: "ltr", // Text direction
  siteName: "Website Name",
  lang: "en", // Content language
  publishedTime: "2023-01-01T12:00:00Z"
}
```

## Integration Examples

### **Browser Extension**
```javascript
// Check if page is readable
if (isProbablyReaderable(document)) {
  const reader = new Readability(document);
  const article = reader.parse();
  // Display in reader mode
}
```

### **Content Aggregator**
```javascript
// Process RSS feed items
const articles = await Promise.all(
  feedItems.map(async (item) => {
    const html = await fetch(item.link).then(r => r.text());
    const doc = new JSDOM(html).window.document;
    const reader = new Readability(doc);
    return reader.parse();
  })
);
```

### **Server-Side Processing**
```javascript
// Node.js content extraction
const { Readability } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');

const doc = new JSDOM(htmlString, { url: 'https://example.com' });
const reader = new Readability(doc.window.document);
const article = reader.parse();
```

## Best Practices

### **Security**
- Always sanitize output with DOMPurify for untrusted content
- Use Content Security Policy (CSP) for additional protection
- Validate input HTML before processing

### **Performance**
- Use `isProbablyReaderable()` before full parsing
- Set appropriate element limits for large documents
- Cache results when processing the same content repeatedly
- Use web workers for background processing

### **Error Handling**
- Always check for `null` return values
- Handle parsing errors gracefully
- Provide fallbacks for failed extractions
- Log errors for debugging and monitoring

### **Content Quality**
- Adjust `charThreshold` based on your content type
- Use `linkDensityModifier` to fine-tune link detection
- Preserve important classes with `classesToPreserve`
- Customize video URL patterns with `allowedVideoRegex`

## Limitations and Considerations

### **Content Types**
- Works best with article-style content
- May struggle with complex layouts or dynamic content
- Requires sufficient text content for reliable extraction

### **Language Support**
- Primarily designed for English content
- May need adjustments for other languages
- RTL text direction is supported

### **Site-Specific Issues**
- Some sites may use anti-scraping techniques
- Dynamic content loaded via JavaScript may not be captured
- Very complex layouts might not extract perfectly

## Future Development

The library continues to evolve with:
- Improved content detection algorithms
- Better handling of modern web layouts
- Enhanced metadata extraction
- Performance optimizations
- Community-driven improvements

## Getting Started

1. **Install**: `npm install @mozilla/readability`
2. **Import**: `const { Readability } = require('@mozilla/readability')`
3. **Parse**: `const article = new Readability(document).parse()`
4. **Use**: Process the extracted content as needed

For detailed documentation, see the other files in this directory:
- [API Reference](./api-reference.md) - Complete API documentation
- [Internals](./internals.md) - Deep dive into the algorithms
- [Architecture](./architecture.md) - System design overview
- [Usage Examples](./usage-examples.md) - Practical code examples

Readability.js provides a robust, well-tested solution for content extraction that has been battle-tested in Firefox's Reader View and countless other applications.