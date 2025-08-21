# Internals: How Readability Processes HTML

## Overview

Readability.js uses a sophisticated algorithm to identify and extract the main content from web pages. The process involves multiple stages of DOM manipulation, scoring, and content selection.

## Core Processing Pipeline

### 1. Document Preparation (`_prepDocument`)

The first stage prepares the document for analysis:

```javascript
_prepDocument() {
  // Remove all style tags in head
  this._removeNodes(this._getAllNodesWithTag(doc, ["style"]));
  
  // Replace <br> chains with <p> elements
  this._replaceBrs(doc.body);
  
  // Convert <font> tags to <span> tags
  this._replaceNodeTags(this._getAllNodesWithTag(doc, ["font"]), "SPAN");
}
```

**Key Operations:**
- Removes `<style>` tags to eliminate CSS interference
- Converts consecutive `<br>` elements into proper `<p>` paragraphs
- Normalizes `<font>` tags to `<span>` for consistency

### 2. Content Extraction (`_grabArticle`)

This is the core algorithm that identifies the main content area.

#### 2.1 Node Filtering and Scoring

The algorithm iterates through all DOM nodes and applies multiple filters:

```javascript
while (node) {
  // Remove hidden nodes
  if (!this._isProbablyVisible(node)) {
    node = this._removeAndGetNext(node);
    continue;
  }
  
  // Remove unlikely candidates based on class/id patterns
  if (this.REGEXPS.unlikelyCandidates.test(matchString) &&
      !this.REGEXPS.okMaybeItsACandidate.test(matchString)) {
    node = this._removeAndGetNext(node);
    continue;
  }
  
  // Remove elements with navigation roles
  if (this.UNLIKELY_ROLES.includes(node.getAttribute("role"))) {
    node = this._removeAndGetNext(node);
    continue;
  }
}
```

**Filtering Criteria:**
- **Visibility**: Removes nodes with `display: none`, `visibility: hidden`, or `hidden` attribute
- **Unlikely Candidates**: Uses regex patterns to identify navigation, ads, comments, etc.
- **ARIA Roles**: Removes elements with roles like `menu`, `navigation`, `complementary`

#### 2.2 Content Scoring Algorithm

Each candidate element receives a score based on multiple factors:

```javascript
var contentScore = 0;

// Base score for the paragraph itself
contentScore += 1;

// Add points for commas (indicates natural text)
contentScore += innerText.split(this.REGEXPS.commas).length;

// Add points for text length (up to 3 points for 300+ chars)
contentScore += Math.min(Math.floor(innerText.length / 100), 3);
```

**Scoring Factors:**
- **Text Length**: Longer text gets higher scores
- **Punctuation**: Commas indicate natural language content
- **Link Density**: High link density reduces scores
- **Class Names**: Positive/negative keywords in class names affect scoring

#### 2.3 Ancestor Scoring

Scores are propagated up the DOM tree to parent elements:

```javascript
this._forEachNode(ancestors, function (ancestor, level) {
  if (typeof ancestor.readability === "undefined") {
    this._initializeNode(ancestor);
    candidates.push(ancestor);
  }
  
  // Score divider based on ancestor level
  var scoreDivider = level === 0 ? 1 : level === 1 ? 2 : level * 3;
  ancestor.readability.contentScore += contentScore / scoreDivider;
});
```

**Scoring Hierarchy:**
- Parent elements: No division (full score)
- Grandparent elements: Score divided by 2
- Great-grandparent+: Score divided by (level × 3)

### 3. Candidate Selection

The algorithm selects the best candidate from the top-scoring elements:

```javascript
// Find top candidates
var topCandidates = [];
for (var c = 0; c < candidates.length; c++) {
  var candidate = candidates[c];
  var candidateScore = candidate.readability.contentScore * 
                      (1 - this._getLinkDensity(candidate));
  
  // Insert into sorted top candidates array
  for (var t = 0; t < this._nbTopCandidates; t++) {
    if (!aTopCandidate || candidateScore > aTopCandidate.readability.contentScore) {
      topCandidates.splice(t, 0, candidate);
      break;
    }
  }
}
```

### 4. Content Refinement

After selecting the top candidate, the algorithm refines the content:

#### 4.1 Sibling Analysis

Looks for related content in sibling elements:

```javascript
var siblingScoreThreshold = Math.max(10, topCandidate.readability.contentScore * 0.2);

for (var s = 0; s < siblings.length; s++) {
  var sibling = siblings[s];
  
  if (sibling.readability && 
      sibling.readability.contentScore >= siblingScoreThreshold) {
    // Include this sibling in the article
    articleContent.appendChild(sibling.cloneNode(true));
  }
}
```

#### 4.2 Content Cleaning

Removes unwanted elements from the final content:

```javascript
_postProcessContent(articleContent) {
  // Convert relative URLs to absolute URLs
  this._fixRelativeUris(articleContent);
  
  // Simplify nested elements
  this._simplifyNestedElements(articleContent);
  
  // Remove classes unless keepClasses is true
  if (!this._keepClasses) {
    this._cleanClasses(articleContent);
  }
}
```

## Key Algorithms and Heuristics

### Link Density Calculation

```javascript
_getLinkDensity(element) {
  var textLength = this._getInnerText(element).length;
  if (textLength === 0) return 0;
  
  var linkLength = 0;
  var links = element.getElementsByTagName("a");
  
  for (var i = 0; i < links.length; i++) {
    linkLength += this._getInnerText(links[i]).length;
  }
  
  return linkLength / textLength;
}
```

**Purpose**: High link density often indicates navigation or ad content rather than main article content.

### Visibility Detection

```javascript
_isProbablyVisible(node) {
  return (
    (!node.style || node.style.display != "none") &&
    (!node.style || node.style.visibility != "hidden") &&
    !node.hasAttribute("hidden") &&
    (!node.hasAttribute("aria-hidden") || 
     node.getAttribute("aria-hidden") != "true")
  );
}
```

**Purpose**: Ensures only visible content is considered for extraction.

### Content Scoring Patterns

The library uses several regex patterns to identify content types:

```javascript
REGEXPS: {
  // Elements likely to be non-content
  unlikelyCandidates: /-ad-|banner|comment|footer|header|menu|sidebar|social|sponsor/i,
  
  // Elements that might be content despite suspicious names
  okMaybeItsACandidate: /and|article|body|content|main|page|post|text/i,
  
  // Positive indicators for content
  positive: /article|body|content|entry|main|page|post|text|blog|story/i,
  
  // Negative indicators
  negative: /-ad-|hidden|banner|comment|footer|meta|outbrain|promo|related|share|sidebar|sponsor/i
}
```

## Metadata Extraction

### JSON-LD Processing

Readability extracts structured data from JSON-LD scripts:

```javascript
_getJSONLD(doc) {
  var scripts = doc.getElementsByTagName("script");
  var jsonLd = {};
  
  for (var i = 0; i < scripts.length; i++) {
    var script = scripts[i];
    if (script.getAttribute("type") === "application/ld+json") {
      try {
        var data = JSON.parse(script.textContent);
        // Extract article metadata from structured data
        this._extractFromJSONLD(data, jsonLd);
      } catch (e) {
        // Invalid JSON, skip
      }
    }
  }
  
  return jsonLd;
}
```

### Metadata Sources Priority

1. **JSON-LD structured data** (highest priority)
2. **Open Graph meta tags**
3. **Twitter Card meta tags**
4. **Standard meta tags**
5. **Content-based extraction** (lowest priority)

## Performance Optimizations

### Element Limit Checking

```javascript
if (this._maxElemsToParse > 0) {
  var numTags = this._doc.getElementsByTagName("*").length;
  if (numTags > this._maxElemsToParse) {
    throw new Error("Aborting parsing document; " + numTags + " elements found");
  }
}
```

### Early Termination

The algorithm can terminate early if:
- No suitable content is found
- Document is too large (configurable limit)
- Content doesn't meet minimum character threshold

## Error Handling

The library handles various edge cases:

- **Empty documents**: Returns `null`
- **No body element**: Returns `null`
- **Invalid HTML**: Uses JSDOMParser for robust parsing
- **Large documents**: Configurable element limits
- **Missing content**: Falls back to body element as last resort

## Debugging

When debug mode is enabled, the library provides detailed logging:

```javascript
if (this._debug) {
  this.log = function() {
    if (typeof console !== "undefined") {
      console.log("Reader: (Readability)", ...arguments);
    }
  };
} else {
  this.log = function() {}; // No-op
}
```

This helps developers understand the decision-making process during content extraction.