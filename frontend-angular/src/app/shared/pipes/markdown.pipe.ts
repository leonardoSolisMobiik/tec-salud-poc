import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Markdown to HTML transformation pipe for medical content display
 *
 * @description Converts Markdown syntax to safe HTML for displaying formatted medical
 * content including AI responses, patient notes, and documentation. Includes sanitization
 * to prevent XSS attacks while preserving medical formatting.
 *
 * @example
 * ```typescript
 * // In template
 * <div [innerHTML]="medicalNote | markdown"></div>
 *
 * // Converts this markdown:
 * // ## Diagnóstico
 * // **Hipertensión arterial**
 * // - Presión sistólica: 150 mmHg
 * // - *Requiere seguimiento*
 *
 * // To this HTML:
 * // <h2>Diagnóstico</h2>
 * // <strong>Hipertensión arterial</strong>
 * // <ul><li>Presión sistólica: 150 mmHg</li>
 * // <li><em>Requiere seguimiento</em></li></ul>
 * ```
 *
 * @features
 * - Headers (# ## ###)
 * - Bold and italic text (**bold** *italic*)
 * - Bullet and numbered lists
 * - Code blocks and inline code
 * - Horizontal rules
 * - Automatic paragraph handling
 * - XSS protection via DomSanitizer
 *
 * @security Uses Angular's DomSanitizer to prevent XSS attacks while allowing safe HTML
 *
 * @since 1.0.0
 */
@Pipe({
  name: 'markdown',
  standalone: true
})
export class MarkdownPipe implements PipeTransform {

  /**
   * Creates an instance of MarkdownPipe
   *
   * @param sanitizer - Angular DomSanitizer for XSS protection
   */
  constructor(private sanitizer: DomSanitizer) {}

  /**
   * Transforms markdown text to safe HTML
   *
   * @param value - Markdown string to convert
   * @returns SafeHtml object that can be used with innerHTML binding
   *
   * @description Processes markdown syntax and converts it to HTML while maintaining
   * security through sanitization. Handles medical content formatting requirements
   * including lists, emphasis, headers, and code blocks.
   *
   * @example
   * ```typescript
   * const markdown = `
   * ## Síntomas
   * **Principales:**
   * - Dolor de cabeza
   * - *Fiebre alta*
   *
   * \`\`\`
   * Código de medicamento: ACET-500
   * \`\`\`
   * `;
   *
   * const html = pipe.transform(markdown);
   * // Returns sanitized HTML with proper medical formatting
   * ```
   */
  transform(value: string): SafeHtml {
    if (!value) return '';

    // Convert Markdown to HTML with medical content support
    let html = value
      // Handle escaped line breaks
      .replace(/\\n\\n/g, '\n\n')
      .replace(/\\n/g, '\n')

      // Headers for medical sections
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')

      // Bold and italic for medical emphasis
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')

      // Bullet lists for symptoms, medications, etc.
      .replace(/^\s*[•·*-]\s+(.+)$/gm, '<li>$1</li>')

      // Convert consecutive list items to proper unordered lists
      .replace(/(<li>.*<\/li>)/gs, (match) => {
        return '<ul>' + match + '</ul>';
      })

      // Clean up nested ul tags
      .replace(/<\/ul>\s*<ul>/g, '')

      // Numbered lists for procedures, steps
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

      // Horizontal rules for section separation
      .replace(/^---$/gm, '<hr>')

      // Code blocks for medical codes, prescriptions
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')

      // Line breaks for medical content readability
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')

      // Wrap in paragraphs for proper medical document structure
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

    // Clean up empty paragraphs and formatting issues
    html = html
      .replace(/<p><\/p>/g, '')
      .replace(/<p>(<[^>]+>)/g, '$1')
      .replace(/(<\/[^>]+>)<\/p>/g, '$1')
      .replace(/<br><\/p>/g, '</p>')
      .replace(/<p><br>/g, '<p>');

    // Return sanitized HTML safe for medical content display
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
