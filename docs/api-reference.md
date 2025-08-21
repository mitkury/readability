# API Reference

## Overview

Readability.js provides a simple API for extracting readable content from web pages. The library consists of two main components:

1. **Readability** - The main class for parsing documents
2. **isProbablyReaderable** - A utility function for quick readability detection

## Readability Class

### Constructor

```javascript
new Readability(document, options)
```

Creates a new Readability instance for parsing a document.

#### Parameters

- **document** (Document) - The DOM document to parse
- **options** (Object, optional) - Configuration options

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `debug` | boolean | `false` | Enable debug logging |
| `maxElemsToParse` | number | `0` (no limit) | Maximum number of elements to parse |
| `nbTopCandidates` | number | `5` | Number of top candidates to consider |
| `charThreshold` | number | `500` | Minimum characters required for a result |
| `classesToPreserve` | string[] | `[]` | CSS classes to preserve |
| `keepClasses` | boolean | `false` | Preserve all classes on HTML elements |
| `disableJSONLD` | boolean | `false` | Skip JSON-LD metadata parsing |
| `serializer` | function | `el => el.innerHTML` | Custom serializer function |
| `allowedVideoRegex` | RegExp | Default video regex | Regex for allowed video URLs |
| `linkDensityModifier` | number | `0` | Modifier for link density scoring |

### Methods

#### parse()

Extracts the main content from the document.

```javascript
var article = reader.parse();
```

**Returns:** An object with the following properties, or `null` if no content is found:

| Property | Type | Description |
|----------|------|-------------|
| `title` | string | Article title |
| `content` | string | HTML string of processed article content |
| `textContent` | string | Plain text content with HTML tags removed |
| `length` | number | Character count of the article |
| `excerpt` | string | Article description or excerpt |
| `byline` | string | Author information |
| `dir` | string | Content direction (ltr/rtl) |
| `siteName` | string | Name of the website |
| `lang` | string | Content language |
| `publishedTime` | string | Publication timestamp |

**Example:**

```javascript
var reader = new Readability(document);
var article = reader.parse();

if (article) {
  console.log('Title:', article.title);
  console.log('Content:', article.content);
  console.log('Author:', article.byline);
  console.log('Length:', article.length);
}
```

## isProbablyReaderable Function

### Signature

```javascript
isProbablyReaderable(document, options)
```

Quickly determines if a document is likely to be readable without full parsing.

#### Parameters

- **document** (Document) - The DOM document to check
- **options** (Object, optional) - Configuration options

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `minContentLength` | number | `140` | Minimum content length for a node |
| `minScore` | number | `20` | Minimum cumulative score required |
| `visibilityChecker` | function | `isNodeVisible` | Custom visibility checker |

#### Returns

- **boolean** - `true` if the document appears to be readable, `false` otherwise

**Example:**

```javascript
if (isProbablyReaderable(document)) {
  var reader = new Readability(document);
  var article = reader.parse();
  // Process the article...
}
```

## Usage Examples

### Browser Usage

```javascript
// Basic usage
var article = new Readability(document).parse();

// With options
var reader = new Readability(document, {
  debug: true,
  charThreshold: 1000,
  keepClasses: true
});
var article = reader.parse();

// Clone document to avoid modifying original
var documentClone = document.cloneNode(true);
var article = new Readability(documentClone).parse();
```

### Node.js Usage

```javascript
var { Readability } = require('@mozilla/readability');
var { JSDOM } = require('jsdom');

// Parse HTML string
var doc = new JSDOM(htmlString, {
  url: 'https://example.com/article'
});
var reader = new Readability(doc.window.document);
var article = reader.parse();

// With custom serializer
var reader = new Readability(doc.window.document, {
  serializer: function(el) {
    return el.outerHTML; // Return full HTML including the element itself
  }
});
var article = reader.parse();
```

### Advanced Configuration

```javascript
var reader = new Readability(document, {
  // Enable debug logging
  debug: true,
  
  // Limit parsing for performance
  maxElemsToParse: 10000,
  
  // Preserve specific classes
  classesToPreserve: ['highlight', 'important'],
  
  // Custom video URL validation
  allowedVideoRegex: /youtube\.com|vimeo\.com/,
  
  // Adjust link density scoring
  linkDensityModifier: -0.1, // Penalize high link density
  
  // Custom serializer for further processing
  serializer: function(el) {
    // Return DOM element for further manipulation
    return el;
  }
});
```

## Error Handling

The library may throw errors in certain conditions:

```javascript
try {
  var reader = new Readability(document);
  var article = reader.parse();
} catch (error) {
  if (error.message.includes('Aborting parsing document')) {
    console.log('Document too large to parse');
  } else {
    console.error('Parsing error:', error);
  }
}
```

## Performance Considerations

- Use `isProbablyReaderable()` before full parsing for better performance
- Set `maxElemsToParse` for very large documents
- Clone the document if you need to preserve the original
- Consider using a custom serializer for specific output formats

## Security Notes

- Always sanitize output with libraries like DOMPurify when dealing with untrusted content
- Use Content Security Policy (CSP) for additional protection
- The library does not sanitize input - use appropriate sanitizers for your use case