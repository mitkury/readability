#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Analyze text content for various metrics
 */
function analyzeText(text) {
  // Basic text statistics
  const characters = text.length;
  const words = text.split(/\s+/).filter(word => word.length > 0).length;
  const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0).length;
  const paragraphs = text.split(/\n\s*\n/).filter(para => para.trim().length > 0).length;
  
  // Reading metrics (average reading speeds)
  const readingTimeMinutes = Math.ceil(words / 200); // 200 WPM average
  const speakingTimeMinutes = Math.ceil(words / 150); // 150 WPM speaking
  const skimmingTimeMinutes = Math.ceil(words / 400); // 400 WPM skimming
  
  // Text complexity metrics
  const averageWordsPerSentence = sentences > 0 ? (words / sentences).toFixed(1) : 0;
  const averageCharactersPerWord = words > 0 ? (characters / words).toFixed(1) : 0;
  const averageWordsPerParagraph = paragraphs > 0 ? (words / paragraphs).toFixed(1) : 0;
  
  // Unique word analysis
  const uniqueWords = new Set(
    text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 0)
  ).size;
  
  const vocabularyDiversity = words > 0 ? (uniqueWords / words * 100).toFixed(1) : 0;
  
  // Readability scores
  const fleschKincaidGrade = calculateFleschKincaid(text);
  const gunningFogIndex = calculateGunningFog(text);
  
  // Content type detection
  const contentType = detectContentType(text);
  
  return {
    basic: {
      characters,
      words,
      sentences,
      paragraphs,
      uniqueWords
    },
    reading: {
      readingTimeMinutes,
      speakingTimeMinutes,
      skimmingTimeMinutes,
      averageWordsPerSentence,
      averageCharactersPerWord,
      averageWordsPerParagraph
    },
    complexity: {
      vocabularyDiversity: `${vocabularyDiversity}%`,
      fleschKincaidGrade,
      gunningFogIndex,
      readabilityLevel: getReadabilityLevel(fleschKincaidGrade)
    },
    content: {
      type: contentType,
      estimatedAudience: getEstimatedAudience(fleschKincaidGrade, contentType)
    }
  };
}

/**
 * Calculate Flesch-Kincaid Grade Level
 */
function calculateFleschKincaid(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const words = text.split(/\s+/).filter(w => w.length > 0).length;
  const syllables = countSyllables(text);
  
  if (sentences === 0 || words === 0) return 0;
  
  const score = 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
  return Math.max(0, Math.round(score * 10) / 10);
}

/**
 * Calculate Gunning Fog Index
 */
function calculateGunningFog(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const words = text.split(/\s+/).filter(w => w.length > 0).length;
  const complexWords = countComplexWords(text);
  
  if (sentences === 0 || words === 0) return 0;
  
  const score = 0.4 * ((words / sentences) + 100 * (complexWords / words));
  return Math.max(0, Math.round(score * 10) / 10);
}

/**
 * Count syllables in text (simplified algorithm)
 */
function countSyllables(text) {
  const words = text.toLowerCase().split(/\s+/);
  let totalSyllables = 0;
  
  for (const word of words) {
    if (word.length === 0) continue;
    
    // Remove common suffixes that don't add syllables
    const cleanWord = word.replace(/[^a-z]/g, '');
    if (cleanWord.length === 0) continue;
    
    // Count vowel groups (simplified syllable counting)
    const vowelGroups = cleanWord.match(/[aeiouy]+/g) || [];
    let syllables = vowelGroups.length;
    
    // Adjust for common patterns
    if (cleanWord.endsWith('e') && syllables > 1) {
      syllables--; // Silent 'e' at the end
    }
    
    // Ensure at least one syllable per word
    totalSyllables += Math.max(1, syllables);
  }
  
  return totalSyllables;
}

/**
 * Count complex words (3+ syllables)
 */
function countComplexWords(text) {
  const words = text.toLowerCase().split(/\s+/);
  let complexCount = 0;
  
  for (const word of words) {
    const syllables = countSyllables(word);
    if (syllables >= 3) {
      complexCount++;
    }
  }
  
  return complexCount;
}

/**
 * Detect content type based on text characteristics
 */
function detectContentType(text) {
  const lowerText = text.toLowerCase();
  
  // Technical indicators
  const technicalTerms = ['function', 'variable', 'class', 'method', 'api', 'database', 'algorithm', 'protocol'];
  const technicalCount = technicalTerms.filter(term => lowerText.includes(term)).length;
  
  // News indicators
  const newsTerms = ['reported', 'announced', 'according', 'officials', 'government', 'minister', 'president'];
  const newsCount = newsTerms.filter(term => lowerText.includes(term)).length;
  
  // Academic indicators
  const academicTerms = ['research', 'study', 'analysis', 'conclusion', 'methodology', 'hypothesis', 'theoretical'];
  const academicCount = academicTerms.filter(term => lowerText.includes(term)).length;
  
  // Educational indicators
  const educationalTerms = ['learn', 'understand', 'example', 'tutorial', 'guide', 'lesson', 'explain'];
  const educationalCount = educationalTerms.filter(term => lowerText.includes(term)).length;
  
  const scores = [
    { type: 'Technical', score: technicalCount },
    { type: 'News', score: newsCount },
    { type: 'Academic', score: academicCount },
    { type: 'Educational', score: educationalCount }
  ];
  
  scores.sort((a, b) => b.score - a.score);
  
  if (scores[0].score === 0) return 'General';
  return scores[0].type;
}

/**
 * Get readability level description
 */
function getReadabilityLevel(grade) {
  if (grade <= 5) return 'Elementary';
  if (grade <= 8) return 'Middle School';
  if (grade <= 12) return 'High School';
  if (grade <= 16) return 'College';
  return 'Graduate';
}

/**
 * Get estimated audience
 */
function getEstimatedAudience(grade, contentType) {
  if (grade <= 5) return 'Children (5-10 years)';
  if (grade <= 8) return 'Teenagers (11-14 years)';
  if (grade <= 12) return 'Young Adults (15-18 years)';
  if (grade <= 16) return 'Adults (18+ years)';
  return 'Specialists/Experts';
}

/**
 * Analyze a single file
 */
async function analyzeFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    
    // Extract the main content (after the metadata header)
    const contentStart = content.indexOf('================================================================================');
    const mainContent = contentStart > 0 ? content.substring(contentStart + 80).trim() : content;
    
    const analysis = analyzeText(mainContent);
    
    return {
      success: true,
      filename: path.basename(filePath),
      filePath,
      analysis,
      metadata: extractMetadata(content)
    };
    
  } catch (error) {
    return {
      success: false,
      filename: path.basename(filePath),
      error: error.message
    };
  }
}

/**
 * Extract metadata from file header
 */
function extractMetadata(content) {
  const lines = content.split('\n');
  const metadata = {};
  
  for (const line of lines) {
    if (line.startsWith('Title: ')) {
      metadata.title = line.substring(7);
    } else if (line.startsWith('Author: ')) {
      metadata.author = line.substring(8);
    } else if (line.startsWith('URL: ')) {
      metadata.url = line.substring(5);
    } else if (line.startsWith('Length: ')) {
      metadata.length = parseInt(line.substring(8));
    } else if (line.startsWith('Extracted: ')) {
      metadata.extracted = line.substring(11);
    }
  }
  
  return metadata;
}

/**
 * Generate analysis report
 */
async function generateReport(analyses, outputDir) {
  const successful = analyses.filter(a => a.success);
  const failed = analyses.filter(a => !a.success);
  
  // Overall statistics
  const totalWords = successful.reduce((sum, a) => sum + a.analysis.basic.words, 0);
  const totalCharacters = successful.reduce((sum, a) => sum + a.analysis.basic.characters, 0);
  const averageGrade = successful.reduce((sum, a) => sum + parseFloat(a.analysis.complexity.fleschKincaidGrade), 0) / successful.length;
  
  const report = {
    summary: {
      totalFiles: analyses.length,
      successful: successful.length,
      failed: failed.length,
      totalWords,
      totalCharacters,
      averageGrade: Math.round(averageGrade * 10) / 10
    },
    files: successful.map(a => ({
      filename: a.filename,
      title: a.metadata.title,
      analysis: a.analysis
    })),
    failed: failed.map(a => ({
      filename: a.filename,
      error: a.error
    }))
  };
  
  // Save JSON report
  const jsonPath = path.join(outputDir, 'content-analysis.json');
  await fs.writeFile(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  
  // Generate human-readable report
  const reportText = [
    'CONTENT ANALYSIS REPORT',
    '======================',
    '',
    `Total Files: ${report.summary.totalFiles}`,
    `Successfully Analyzed: ${report.summary.successful}`,
    `Failed: ${report.summary.failed}`,
    `Total Words: ${report.summary.totalWords.toLocaleString()}`,
    `Total Characters: ${report.summary.totalCharacters.toLocaleString()}`,
    `Average Grade Level: ${report.summary.averageGrade}`,
    '',
    'DETAILED ANALYSIS',
    '=================',
    '',
    ...successful.map(a => [
      `📄 ${a.metadata.title || a.filename}`,
      `   Words: ${a.analysis.basic.words.toLocaleString()}`,
      `   Reading Time: ${a.analysis.reading.readingTimeMinutes} minutes`,
      `   Grade Level: ${a.analysis.complexity.fleschKincaidGrade} (${a.analysis.complexity.readabilityLevel})`,
      `   Content Type: ${a.analysis.content.type}`,
      `   Audience: ${a.analysis.content.estimatedAudience}`,
      `   Vocabulary Diversity: ${a.analysis.complexity.vocabularyDiversity}`,
      ''
    ].join('\n')),
    'FAILED FILES',
    '============',
    '',
    ...failed.map(f => `❌ ${f.filename}: ${f.error}`)
  ].join('\n');
  
  const textPath = path.join(outputDir, 'content-analysis.txt');
  await fs.writeFile(textPath, reportText, 'utf8');
  
  console.log('\n📊 Generated analysis reports:');
  console.log(`  📄 JSON Report: ${jsonPath}`);
  console.log(`  📝 Text Report: ${textPath}`);
  
  return report;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node content-analyzer.js <input-file-or-directory>');
    console.log('');
    console.log('Examples:');
    console.log('  node content-analyzer.js output/');
    console.log('  node content-analyzer.js output/article.txt');
    console.log('');
    console.log('The analyzer will:');
    console.log('1. Read text files from the input path');
    console.log('2. Analyze content for readability metrics');
    console.log('3. Generate detailed reports with statistics');
    console.log('4. Save results to JSON and text formats');
    process.exit(1);
  }
  
  const inputPath = args[0];
  const outputDir = path.join(__dirname, 'output');
  
  console.log('Readability.js Content Analyzer');
  console.log('===============================');
  console.log('');
  
  try {
    const stats = await fs.stat(inputPath);
    let files = [];
    
    if (stats.isDirectory()) {
      // Analyze all .txt files in directory
      const dirFiles = await fs.readdir(inputPath);
      files = dirFiles
        .filter(file => file.endsWith('.txt'))
        .map(file => path.join(inputPath, file));
      
      console.log(`Found ${files.length} text files in directory`);
    } else if (stats.isFile()) {
      // Analyze single file
      files = [inputPath];
      console.log('Analyzing single file');
    } else {
      throw new Error('Input path is neither a file nor directory');
    }
    
    if (files.length === 0) {
      console.log('No text files found to analyze');
      process.exit(0);
    }
    
    console.log('');
    console.log('Analyzing content...');
    
    const analyses = [];
    for (const file of files) {
      console.log(`  Analyzing: ${path.basename(file)}`);
      const analysis = await analyzeFile(file);
      analyses.push(analysis);
    }
    
    console.log('');
    console.log('Generating reports...');
    
    const report = await generateReport(analyses, outputDir);
    
    console.log('');
    console.log('🎉 Content analysis completed!');
    console.log('');
    console.log('SUMMARY:');
    console.log(`  Files Analyzed: ${report.summary.successful}/${report.summary.totalFiles}`);
    console.log(`  Total Words: ${report.summary.totalWords.toLocaleString()}`);
    console.log(`  Average Grade Level: ${report.summary.averageGrade}`);
    
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