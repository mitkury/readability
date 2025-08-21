# Readability.js Documentation

This directory contains comprehensive documentation for the Firefox Readability library, a standalone version of the readability library used for Firefox Reader View.

## Documentation Structure

- **[API Reference](./api-reference.md)** - Complete API documentation with examples
- **[Internals](./internals.md)** - Deep dive into how Readability processes HTML
- **[Architecture](./architecture.md)** - High-level overview of the library's design
- **[Usage Examples](./usage-examples.md)** - Practical examples for different use cases

## Quick Start

Readability.js is a JavaScript library that extracts the main content from web pages, removing navigation, headers, footers, and other non-essential elements. It's designed to provide a clean reading experience similar to Firefox's Reader View.

### Basic Usage

```javascript
// Browser usage
var article = new Readability(document).parse();

// Node.js usage with jsdom
var { Readability } = require('@mozilla/readability');
var { JSDOM } = require('jsdom');
var doc = new JSDOM(htmlString, { url: 'https://example.com' });
var reader = new Readability(doc.window.document);
var article = reader.parse();
```

### Key Features

- **Content Extraction**: Automatically identifies and extracts the main article content
- **Metadata Extraction**: Extracts title, author, publication date, and other metadata
- **Clean Output**: Removes ads, navigation, and other non-essential elements
- **Configurable**: Extensive options for customizing the extraction process
- **Cross-platform**: Works in browsers and Node.js environments

## Installation

```bash
npm install @mozilla/readability
```

## License

Apache License 2.0 - see the [LICENSE](../LICENSE.md) file for details.