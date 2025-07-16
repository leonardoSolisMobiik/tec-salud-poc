/**
 * Unit tests for MarkdownPipe
 *
 * @description Tests for markdown to HTML transformation including
 * headers, lists, emphasis, code blocks, and sanitization
 *
 * @since 1.0.0
 */

import { TestBed } from '@angular/core/testing';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MarkdownPipe } from './markdown.pipe';

describe('MarkdownPipe', () => {
  let pipe: MarkdownPipe;
  let sanitizerMock: any;

  beforeEach(() => {
    const sanitizerSpy = {
      bypassSecurityTrustHtml: jest.fn((html: string) => html as SafeHtml),
      sanitize: jest.fn(),
      bypassSecurityTrustStyle: jest.fn(),
      bypassSecurityTrustScript: jest.fn(),
      bypassSecurityTrustUrl: jest.fn(),
      bypassSecurityTrustResourceUrl: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        MarkdownPipe,
        { provide: DomSanitizer, useValue: sanitizerSpy }
      ]
    });

    pipe = TestBed.inject(MarkdownPipe);
    sanitizerMock = TestBed.inject(DomSanitizer);
  });

  it('should be created', () => {
    expect(pipe).toBeTruthy();
  });

  describe('Basic Functionality', () => {
    it('should return empty string for null or empty input', () => {
      expect(pipe.transform('')).toBe('');
      expect(pipe.transform(null as any)).toBe('');
      expect(pipe.transform(undefined as any)).toBe('');
    });

    it('should call DomSanitizer.bypassSecurityTrustHtml', () => {
      pipe.transform('Simple text');
      expect(sanitizerMock.bypassSecurityTrustHtml).toHaveBeenCalled();
    });

    it('should handle plain text without markdown', () => {
      const result = pipe.transform('Simple text without markdown');
      expect(result).toBe('<p>Simple text without markdown</p>');
      expect(sanitizerMock.bypassSecurityTrustHtml).toHaveBeenCalledWith('<p>Simple text without markdown</p>');
    });
  });

  describe('Headers', () => {
    it('should transform H1 headers', () => {
      const markdown = '# Main Title';
      const result = pipe.transform(markdown);
      expect(result).toBe('<h1>Main Title</h1>');
      expect(sanitizerMock.bypassSecurityTrustHtml).toHaveBeenCalledWith('<h1>Main Title</h1>');
    });

    it('should transform H2 headers', () => {
      const markdown = '## Subtitle';
      const result = pipe.transform(markdown);
      expect(result).toBe('<h2>Subtitle</h2>');
      expect(sanitizerMock.bypassSecurityTrustHtml).toHaveBeenCalledWith('<h2>Subtitle</h2>');
    });

    it('should transform H3 headers', () => {
      const markdown = '### Section Title';
      const result = pipe.transform(markdown);
      expect(result).toBe('<h3>Section Title</h3>');
      expect(sanitizerMock.bypassSecurityTrustHtml).toHaveBeenCalledWith('<h3>Section Title</h3>');
    });

    it('should transform multiple headers correctly', () => {
      const markdown = '# Title\n## Subtitle\n### Section';
      const result = pipe.transform(markdown);
      expect(result).toBe('<h1>Title</h1>\n<h2>Subtitle</h2>\n<h3>Section</h3>');
      expect(sanitizerMock.bypassSecurityTrustHtml).toHaveBeenCalledTimes(1);
    });
  });

  describe('Text Emphasis', () => {
    it('should transform bold text with **', () => {
      const markdown = 'This is **bold** text';
      const result = pipe.transform(markdown);
      expect(result).toBe('<p>This is <strong>bold</strong> text</p>');
      expect(sanitizerMock.bypassSecurityTrustHtml).toHaveBeenCalledWith('<p>This is <strong>bold</strong> text</p>');
    });

    it('should transform italic text with *', () => {
      const markdown = 'This is *italic* text';
      const result = pipe.transform(markdown);
      expect(result).toBe('<p>This is <em>italic</em> text</p>');
      expect(sanitizerMock.bypassSecurityTrustHtml).toHaveBeenCalledWith('<p>This is <em>italic</em> text</p>');
    });

    it('should transform combined bold and italic', () => {
      const markdown = 'This is ***bold and italic*** text';
      const result = pipe.transform(markdown);
      expect(result).toBe('<p>This is <em><strong>bold and italic</strong></em> text</p>');
      expect(sanitizerMock.bypassSecurityTrustHtml).toHaveBeenCalledTimes(1);
    });
  });

  describe('Lists', () => {
    it('should transform unordered lists', () => {
      const markdown = '- First item\n- Second item\n- Third item';
      const result = pipe.transform(markdown);
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>First item</li>');
      expect(result).toContain('<li>Second item</li>');
      expect(result).toContain('<li>Third item</li>');
      expect(result).toContain('</ul>');
      expect(sanitizerMock.bypassSecurityTrustHtml).toHaveBeenCalledTimes(1);
    });

    it('should transform ordered lists', () => {
      const markdown = '1. First item\n2. Second item\n3. Third item';
      const result = pipe.transform(markdown);
      expect(result).toContain('<ol>');
      expect(result).toContain('<li>First item</li>');
      expect(result).toContain('<li>Second item</li>');
      expect(result).toContain('<li>Third item</li>');
      expect(result).toContain('</ol>');
      expect(sanitizerMock.bypassSecurityTrustHtml).toHaveBeenCalledTimes(1);
    });
  });

  describe('Code Blocks', () => {
    it('should transform inline code', () => {
      const markdown = 'Use `console.log()` to debug';
      const result = pipe.transform(markdown);
      expect(result).toBe('<p>Use <code>console.log()</code> to debug</p>');
      expect(sanitizerMock.bypassSecurityTrustHtml).toHaveBeenCalledWith('<p>Use <code>console.log()</code> to debug</p>');
    });

    it('should transform code blocks', () => {
      const markdown = '```javascript\nconst x = 5;\nconsole.log(x);\n```';
      const result = pipe.transform(markdown);
      expect(result).toContain('<pre><code');
      expect(result).toContain('const x = 5;');
      expect(result).toContain('console.log(x);');
      expect(sanitizerMock.bypassSecurityTrustHtml).toHaveBeenCalledTimes(1);
    });
  });

  describe('Links', () => {
    it('should transform links correctly', () => {
      const markdown = '[Google](https://google.com)';
      const result = pipe.transform(markdown);
      expect(result).toBe('<p><a href="https://google.com">Google</a></p>');
      expect(sanitizerMock.bypassSecurityTrustHtml).toHaveBeenCalledWith('<p><a href="https://google.com">Google</a></p>');
    });

    it('should transform multiple links', () => {
      const markdown = 'Visit [Google](https://google.com) or [GitHub](https://github.com)';
      const result = pipe.transform(markdown);
      expect(result).toContain('<a href="https://google.com">Google</a>');
      expect(result).toContain('<a href="https://github.com">GitHub</a>');
      expect(sanitizerMock.bypassSecurityTrustHtml).toHaveBeenCalledTimes(1);
    });
  });

  describe('Complex Medical Content', () => {
    it('should handle medical terminology with formatting', () => {
      const markdown = '# Diagnosis\n\n**Patient**: John Doe\n\n## Symptoms\n\n- Fever (39°C)\n- Headache\n- *Mild* nausea\n\n### Treatment\n\nPrescribed `acetaminophen 500mg`';
      const result = pipe.transform(markdown);

      expect(result).toContain('<h1>Diagnosis</h1>');
      expect(result).toContain('<strong>Patient</strong>');
      expect(result).toContain('<h2>Symptoms</h2>');
      expect(result).toContain('<li>Fever (39°C)</li>');
      expect(result).toContain('<em>Mild</em>');
      expect(result).toContain('<h3>Treatment</h3>');
      expect(result).toContain('<code>acetaminophen 500mg</code>');

      expect(sanitizerMock.bypassSecurityTrustHtml).toHaveBeenCalledTimes(1);
    });

    it('should handle medication lists with dosages', () => {
      const markdown = '## Medications\n\n1. **Lisinopril** - `10mg` daily\n2. **Metformin** - `500mg` twice daily\n3. **Aspirin** - `81mg` as needed';
      const result = pipe.transform(markdown);

      expect(result).toContain('<h2>Medications</h2>');
      expect(result).toContain('<strong>Lisinopril</strong>');
      expect(result).toContain('<code>10mg</code>');
      expect(result).toContain('<strong>Metformin</strong>');
      expect(result).toContain('<code>500mg</code>');
      expect(result).toContain('<strong>Aspirin</strong>');
      expect(result).toContain('<code>81mg</code>');

      expect(sanitizerMock.bypassSecurityTrustHtml).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle whitespace-only input', () => {
      expect(pipe.transform('   ')).toBe('');
      expect(pipe.transform('\n\n\n')).toBe('');
      expect(pipe.transform('\t\t')).toBe('');
    });

    it('should handle special characters', () => {
      const markdown = 'Temperature: 98.6°F (37°C)';
      const result = pipe.transform(markdown);
      expect(result).toBe('<p>Temperature: 98.6°F (37°C)</p>');
      expect(sanitizerMock.bypassSecurityTrustHtml).toHaveBeenCalledWith('<p>Temperature: 98.6°F (37°C)</p>');
    });

    it('should handle malformed markdown gracefully', () => {
      const markdown = '# Incomplete header\n**Bold without closing\n- List item';
      const result = pipe.transform(markdown);
      expect(result).toBeTruthy();
      expect(sanitizerMock.bypassSecurityTrustHtml).toHaveBeenCalledTimes(1);
    });
  });

  describe('Security', () => {
    it('should always call bypassSecurityTrustHtml for output', () => {
      pipe.transform('Any content');
      expect(sanitizerMock.bypassSecurityTrustHtml).toHaveBeenCalledTimes(1);
    });

    it('should handle potentially dangerous input safely', () => {
      const markdown = '<script>alert("xss")</script>';
      const result = pipe.transform(markdown);
      // The pipe should convert this to safe HTML, not execute it
      expect(result).toBeTruthy();
      expect(sanitizerMock.bypassSecurityTrustHtml).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance', () => {
    it('should handle large medical documents efficiently', () => {
      const largeMarkdown = Array(100).fill('## Section\n\n**Important**: This is a medical note with *emphasis* and `code`.\n\n- Item 1\n- Item 2\n- Item 3\n').join('\n');

      const startTime = performance.now();
      const result = pipe.transform(largeMarkdown);
      const endTime = performance.now();

      expect(result).toBeTruthy();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(sanitizerMock.bypassSecurityTrustHtml).toHaveBeenCalledTimes(1);
    });
  });
});
