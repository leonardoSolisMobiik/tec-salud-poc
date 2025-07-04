import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'markdown',
  standalone: true
})
export class MarkdownPipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    if (!value) return '';

    // Convert Markdown to HTML
    let html = value
      // Handle line breaks first
      .replace(/\\n\\n/g, '\n\n') // Convert escaped newlines
      .replace(/\\n/g, '\n')
      
      // Headers
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      
      // Lists - handle bullet points
      .replace(/^\s*[•·*-]\s+(.+)$/gm, '<li>$1</li>')
      
      // Convert consecutive <li> elements to proper <ul>
      .replace(/(<li>.*<\/li>)/gs, (match) => {
        return '<ul>' + match + '</ul>';
      })
      
      // Clean up nested ul tags
      .replace(/<\/ul>\s*<ul>/g, '')
      
      // Numbered lists
      .replace(/^\s*\d+\.\s+(.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gs, (match, p1) => {
        // Only convert if it doesn't already have ul tags
        if (!match.includes('<ul>')) {
          return '<ol>' + match + '</ol>';
        }
        return match;
      })
      
      // Clean up nested ol tags
      .replace(/<\/ol>\s*<ol>/g, '')
      
      // Horizontal rules
      .replace(/^---$/gm, '<hr>')
      
      // Code blocks (simple version)
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      
      // Line breaks
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      
      // Wrap in paragraphs
      .replace(/^(.+)$/gm, (match) => {
        // Don't wrap if already in tags
        if (match.match(/^<(h[1-6]|ul|ol|li|hr|pre)/)) {
          return match;
        }
        return match;
      });

    // Wrap content in paragraphs if not already wrapped
    if (!html.startsWith('<')) {
      html = '<p>' + html + '</p>';
    }

    // Clean up empty paragraphs and extra breaks
    html = html
      .replace(/<p><\/p>/g, '')
      .replace(/<p>(<[^>]+>)/g, '$1')
      .replace(/(<\/[^>]+>)<\/p>/g, '$1')
      .replace(/<br><\/p>/g, '</p>')
      .replace(/<p><br>/g, '<p>');

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
} 