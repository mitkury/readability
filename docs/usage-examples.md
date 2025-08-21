# Usage Examples

## Basic Examples

### Simple Browser Usage

```javascript
// Basic content extraction
var article = new Readability(document).parse();

if (article) {
  console.log('Title:', article.title);
  console.log('Content:', article.content);
  console.log('Author:', article.byline);
  console.log('Length:', article.length);
}
```

### Node.js with JSDOM

```javascript
var { Readability } = require('@mozilla/readability');
var { JSDOM } = require('jsdom');

// Parse HTML string
var doc = new JSDOM(htmlString, {
  url: 'https://example.com/article'
});
var reader = new Readability(doc.window.document);
var article = reader.parse();

console.log(article);
```

## Advanced Configuration

### Custom Options

```javascript
var reader = new Readability(document, {
  // Enable debug logging
  debug: true,
  
  // Performance tuning
  maxElemsToParse: 10000,
  nbTopCandidates: 10,
  
  // Content filtering
  charThreshold: 1000,
  linkDensityModifier: -0.1,
  
  // Output control
  keepClasses: true,
  classesToPreserve: ['highlight', 'important'],
  
  // Custom serializer
  serializer: function(el) {
    return {
      html: el.innerHTML,
      text: el.textContent,
      wordCount: el.textContent.split(/\s+/).length
    };
  }
});

var article = reader.parse();
```

### Preserving Original Document

```javascript
// Clone document to avoid modifying original
var documentClone = document.cloneNode(true);
var reader = new Readability(documentClone);
var article = reader.parse();

// Original document remains unchanged
console.log('Original body children:', document.body.children.length);
console.log('Clone body children:', documentClone.body.children.length);
```

## Real-World Scenarios

### Content Aggregation Service

```javascript
async function extractArticleContent(url) {
  try {
    // Fetch HTML content
    const response = await fetch(url);
    const html = await response.text();
    
    // Parse with JSDOM
    const { JSDOM } = require('jsdom');
    const doc = new JSDOM(html, { url });
    
    // Extract content
    const reader = new Readability(doc.window.document);
    const article = reader.parse();
    
    if (!article) {
      throw new Error('No readable content found');
    }
    
    return {
      url,
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
      author: article.byline,
      publishedTime: article.publishedTime,
      wordCount: article.textContent.split(/\s+/).length,
      readingTime: Math.ceil(article.textContent.split(/\s+/).length / 200) // ~200 WPM
    };
  } catch (error) {
    console.error('Failed to extract content from:', url, error);
    return null;
  }
}

// Usage
const articles = await Promise.all([
  extractArticleContent('https://example.com/article1'),
  extractArticleContent('https://example.com/article2'),
  extractArticleContent('https://example.com/article3')
]);
```

### Browser Extension

```javascript
// Content script for browser extension
(function() {
  'use strict';
  
  // Check if page is readable
  if (!isProbablyReaderable(document)) {
    return;
  }
  
  // Extract content
  const reader = new Readability(document, {
    debug: false,
    charThreshold: 500
  });
  
  const article = reader.parse();
  
  if (article) {
    // Send to background script
    chrome.runtime.sendMessage({
      type: 'ARTICLE_EXTRACTED',
      data: {
        title: article.title,
        content: article.content,
        url: window.location.href,
        timestamp: Date.now()
      }
    });
  }
})();
```

### RSS Feed Processor

```javascript
const { Readability } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');
const Parser = require('rss-parser');

async function processRSSFeed(feedUrl) {
  const parser = new Parser();
  const feed = await parser.parseURL(feedUrl);
  
  const processedItems = [];
  
  for (const item of feed.items) {
    try {
      // Fetch full article content
      const response = await fetch(item.link);
      const html = await response.text();
      
      // Parse with Readability
      const doc = new JSDOM(html, { url: item.link });
      const reader = new Readability(doc.window.document);
      const article = reader.parse();
      
      if (article) {
        processedItems.push({
          title: article.title || item.title,
          content: article.content,
          excerpt: article.excerpt || item.contentSnippet,
          author: article.byline || item.creator,
          publishedTime: article.publishedTime || item.pubDate,
          url: item.link,
          originalRSS: item
        });
      }
    } catch (error) {
      console.error('Failed to process item:', item.link, error);
    }
  }
  
  return processedItems;
}
```

### Web Worker Implementation

```javascript
// main.js
const worker = new Worker('readability-worker.js');

worker.postMessage({
  type: 'PARSE_HTML',
  html: htmlString,
  url: 'https://example.com/article'
});

worker.onmessage = function(event) {
  if (event.data.type === 'PARSING_COMPLETE') {
    console.log('Article extracted:', event.data.article);
  }
};

// readability-worker.js
importScripts('JSDOMParser.js', 'Readability.js');

self.onmessage = function(event) {
  if (event.data.type === 'PARSE_HTML') {
    try {
      const doc = new JSDOMParser().parse(event.data.html);
      const reader = new Readability(doc);
      const article = reader.parse();
      
      self.postMessage({
        type: 'PARSING_COMPLETE',
        article: article
      });
    } catch (error) {
      self.postMessage({
        type: 'PARSING_ERROR',
        error: error.message
      });
    }
  }
};
```

## Content Processing Examples

### Text Analysis

```javascript
function analyzeArticle(article) {
  const text = article.textContent;
  
  return {
    // Basic metrics
    characterCount: text.length,
    wordCount: text.split(/\s+/).length,
    sentenceCount: text.split(/[.!?]+/).length,
    
    // Reading metrics
    readingTime: Math.ceil(text.split(/\s+/).length / 200), // 200 WPM
    speakingTime: Math.ceil(text.split(/\s+/).length / 150), // 150 WPM
    
    // Content analysis
    averageWordsPerSentence: text.split(/\s+/).length / text.split(/[.!?]+/).length,
    uniqueWords: new Set(text.toLowerCase().split(/\s+/)).size,
    
    // Metadata
    title: article.title,
    author: article.byline,
    language: article.lang,
    direction: article.dir
  };
}

const analysis = analyzeArticle(article);
console.log('Article Analysis:', analysis);
```

### Content Formatting

```javascript
function formatArticle(article, options = {}) {
  const {
    includeImages = true,
    includeLinks = true,
    maxWidth = 800,
    fontSize = 16
  } = options;
  
  let content = article.content;
  
  // Remove images if not wanted
  if (!includeImages) {
    content = content.replace(/<img[^>]*>/gi, '');
  }
  
  // Remove links if not wanted
  if (!includeLinks) {
    content = content.replace(/<a[^>]*>(.*?)<\/a>/gi, '$1');
  }
  
  // Wrap in styled container
  const formatted = `
    <div style="max-width: ${maxWidth}px; margin: 0 auto; font-size: ${fontSize}px; line-height: 1.6;">
      <h1>${article.title}</h1>
      ${article.byline ? `<p class="byline">By ${article.byline}</p>` : ''}
      ${article.excerpt ? `<p class="excerpt">${article.excerpt}</p>` : ''}
      <div class="content">${content}</div>
    </div>
  `;
  
  return formatted;
}

const formattedArticle = formatArticle(article, {
  includeImages: false,
  maxWidth: 600,
  fontSize: 18
});
```

### Batch Processing

```javascript
async function batchProcessArticles(urls, options = {}) {
  const {
    concurrency = 5,
    timeout = 30000,
    retries = 3
  } = options;
  
  const results = [];
  const errors = [];
  
  // Process in batches
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    
    const batchPromises = batch.map(async (url) => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);
          
          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);
          
          const html = await response.text();
          const { JSDOM } = require('jsdom');
          const doc = new JSDOM(html, { url });
          
          const reader = new Readability(doc.window.document);
          const article = reader.parse();
          
          if (article) {
            return { url, success: true, article };
          } else {
            return { url, success: false, error: 'No readable content' };
          }
        } catch (error) {
          if (attempt === retries) {
            return { url, success: false, error: error.message };
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.filter(r => r.success));
    errors.push(...batchResults.filter(r => !r.success));
  }
  
  return { results, errors };
}

// Usage
const urls = [
  'https://example.com/article1',
  'https://example.com/article2',
  // ... more URLs
];

const { results, errors } = await batchProcessArticles(urls, {
  concurrency: 3,
  timeout: 15000
});

console.log(`Processed ${results.length} articles successfully`);
console.log(`Failed to process ${errors.length} articles`);
```

## Error Handling Examples

### Robust Error Handling

```javascript
function safeExtractContent(html, url) {
  try {
    // Validate input
    if (!html || typeof html !== 'string') {
      throw new Error('Invalid HTML input');
    }
    
    // Parse with JSDOM
    const { JSDOM } = require('jsdom');
    const doc = new JSDOM(html, { url });
    
    // Check if readable
    if (!isProbablyReaderable(doc.window.document)) {
      return { success: false, error: 'Document not readable' };
    }
    
    // Extract content
    const reader = new Readability(doc.window.document, {
      maxElemsToParse: 50000, // Prevent infinite processing
      charThreshold: 100 // Lower threshold for testing
    });
    
    const article = reader.parse();
    
    if (!article) {
      return { success: false, error: 'No content extracted' };
    }
    
    // Validate output
    if (!article.content || article.content.length < 100) {
      return { success: false, error: 'Insufficient content' };
    }
    
    return { success: true, article };
    
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      stack: error.stack 
    };
  }
}

// Usage with error handling
const result = safeExtractContent(htmlString, 'https://example.com');

if (result.success) {
  console.log('Content extracted successfully:', result.article.title);
} else {
  console.error('Extraction failed:', result.error);
}
```

## Performance Optimization Examples

### Caching Results

```javascript
class ReadabilityCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }
  
  getKey(url, options = {}) {
    return `${url}:${JSON.stringify(options)}`;
  }
  
  get(url, options) {
    const key = this.getKey(url, options);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hour
      return cached.article;
    }
    
    return null;
  }
  
  set(url, options, article) {
    const key = this.getKey(url, options);
    
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      article,
      timestamp: Date.now()
    });
  }
}

// Usage
const cache = new ReadabilityCache(50);

async function getArticleWithCache(url, options = {}) {
  // Check cache first
  const cached = cache.get(url, options);
  if (cached) {
    return cached;
  }
  
  // Extract content
  const result = await extractArticleContent(url, options);
  
  if (result.success) {
    cache.set(url, options, result.article);
  }
  
  return result;
}
```

These examples demonstrate various practical uses of the Readability library, from simple content extraction to complex batch processing and performance optimization.