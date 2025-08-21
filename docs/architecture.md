# Architecture Overview

## System Design

Readability.js is designed as a standalone content extraction library that can work in both browser and Node.js environments. The architecture follows a modular approach with clear separation of concerns.

## Core Components

### 1. Readability Class (`Readability.js`)

The main class that orchestrates the content extraction process.

**Responsibilities:**
- Document parsing and analysis
- Content scoring and selection
- Metadata extraction
- Output formatting

**Key Methods:**
- `parse()` - Main entry point for content extraction
- `_prepDocument()` - Document preparation and cleanup
- `_grabArticle()` - Core content extraction algorithm
- `_postProcessContent()` - Final content refinement

### 2. JSDOMParser (`JSDOMParser.js`)

A lightweight DOM parser for use in web workers and Node.js environments.

**Features:**
- Safe for web worker environments
- Minimal DOM implementation
- Handles HTML/XML parsing
- No live NodeList support (uses arrays instead)

**Use Cases:**
- Server-side HTML processing
- Web worker content extraction
- Cross-platform compatibility

### 3. Readerable Detection (`Readability-readerable.js`)

A lightweight utility for quick readability assessment.

**Purpose:**
- Fast pre-screening of documents
- Performance optimization
- Avoid unnecessary full parsing

## Data Flow

```
Input HTML → JSDOMParser → Readability → Output Article
     ↓              ↓            ↓           ↓
  Raw HTML    DOM Document   Processed    Clean Article
                                    Content
```

### 1. Input Processing

```javascript
// Browser environment
var doc = document; // Native DOM

// Node.js environment  
var { JSDOM } = require('jsdom');
var doc = new JSDOM(htmlString).window.document;
```

### 2. Document Analysis

```javascript
var reader = new Readability(doc, options);
var article = reader.parse();
```

### 3. Output Generation

```javascript
{
  title: "Article Title",
  content: "<div>...</div>",
  textContent: "Plain text...",
  byline: "Author Name",
  // ... other metadata
}
```

## Configuration System

### Options Object Structure

```javascript
{
  // Performance options
  maxElemsToParse: 0,
  nbTopCandidates: 5,
  
  // Content filtering
  charThreshold: 500,
  linkDensityModifier: 0,
  
  // Output control
  keepClasses: false,
  classesToPreserve: [],
  serializer: function(el) { return el.innerHTML; },
  
  // Feature flags
  debug: false,
  disableJSONLD: false
}
```

### Default Values

The library provides sensible defaults that work well for most web pages:

- **charThreshold**: 500 characters minimum
- **nbTopCandidates**: 5 top scoring elements
- **maxElemsToParse**: No limit (0)
- **keepClasses**: false (clean output)

## Scoring System Architecture

### Multi-Level Scoring

The scoring system operates at multiple levels:

1. **Element Level**: Individual paragraphs and text blocks
2. **Ancestor Level**: Parent containers and wrappers
3. **Sibling Level**: Related content sections

### Score Propagation

```
Paragraph Score → Parent Score → Grandparent Score
     ↓                ↓               ↓
   Base Score    Score/2        Score/(level*3)
```

### Scoring Factors

- **Text Length**: Longer content gets higher scores
- **Punctuation**: Natural language indicators
- **Link Density**: Navigation/ad content penalty
- **Class Names**: Semantic content indicators
- **Element Types**: Block vs inline content

## Error Handling Strategy

### Graceful Degradation

The library handles various failure scenarios:

```javascript
// Document too large
if (numTags > this._maxElemsToParse) {
  throw new Error("Aborting parsing document");
}

// No content found
if (!articleContent) {
  return null;
}

// Fallback to body
if (topCandidate === null) {
  topCandidate = doc.createElement("DIV");
  // Move all body children to candidate
}
```

### Error Types

1. **Configuration Errors**: Invalid options
2. **Document Errors**: Malformed HTML, missing body
3. **Size Errors**: Documents too large to process
4. **Content Errors**: No readable content found

## Performance Considerations

### Memory Management

- **Element Limits**: Configurable maximum elements
- **Node Cleanup**: Removes processed nodes
- **Garbage Collection**: Minimizes memory footprint

### Processing Optimization

- **Early Termination**: Stop when content is found
- **Selective Parsing**: Focus on likely content areas
- **Caching**: Avoid repeated calculations

### Scalability

- **Worker Support**: Can run in web workers
- **Streaming**: Processes documents incrementally
- **Batch Processing**: Handles multiple documents

## Security Architecture

### Input Validation

- **HTML Sanitization**: Not performed by Readability
- **External Libraries**: Recommends DOMPurify
- **CSP Support**: Compatible with Content Security Policy

### Output Safety

```javascript
// Recommended security practices
var article = reader.parse();
var cleanContent = DOMPurify.sanitize(article.content);
```

## Extensibility Points

### Custom Serializers

```javascript
var reader = new Readability(doc, {
  serializer: function(el) {
    // Custom output format
    return {
      html: el.innerHTML,
      text: el.textContent,
      elements: el.children.length
    };
  }
});
```

### Custom Scoring

The scoring algorithm can be extended by:

1. **Modifying regex patterns** for content detection
2. **Adjusting scoring weights** for different factors
3. **Adding custom filters** for specific content types

### Plugin Architecture

While not explicitly supported, the modular design allows for:

- **Custom preprocessors** for specific content types
- **Post-processing hooks** for content refinement
- **Alternative parsers** for different HTML formats

## Cross-Platform Compatibility

### Browser Environment

- **Native DOM**: Uses browser's built-in DOM API
- **Event Handling**: Compatible with browser events
- **Style Processing**: Handles CSS and computed styles

### Node.js Environment

- **JSDOM**: Provides DOM implementation
- **File System**: Can process local HTML files
- **Streaming**: Supports large document processing

### Web Workers

- **JSDOMParser**: Safe for worker environments
- **No DOM Access**: Self-contained parsing
- **Message Passing**: Returns serializable results

## Testing Architecture

### Test Structure

```
test/
├── test-readability.js      # Main functionality tests
├── test-isProbablyReaderable.js  # Readerable detection tests
├── test-jsdomparser.js      # DOM parser tests
├── test-pages/              # Sample HTML documents
└── utils.js                 # Test utilities
```

### Test Coverage

- **Unit Tests**: Individual method testing
- **Integration Tests**: End-to-end parsing
- **Regression Tests**: Known problematic pages
- **Performance Tests**: Large document handling

## Future Architecture Considerations

### Potential Improvements

1. **Machine Learning**: AI-powered content detection
2. **Language Support**: Multi-language content extraction
3. **Real-time Processing**: Streaming content extraction
4. **Plugin System**: Extensible architecture for custom rules

### Backward Compatibility

- **API Stability**: Maintains existing interfaces
- **Option Deprecation**: Gradual migration path
- **Performance**: Continual optimization without breaking changes