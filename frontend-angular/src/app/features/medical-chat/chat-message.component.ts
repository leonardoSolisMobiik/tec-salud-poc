import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatMessage } from '@core/models';
import { marked } from 'marked';

/**
 * Chat message display component for medical conversations
 * 
 * @description Renders individual chat messages with role-based styling, timestamps,
 * and markdown formatting. Distinguishes between user and AI assistant messages
 * with different visual styles and avatars.
 * 
 * @example
 * ```typescript
 * // In parent component template
 * <app-chat-message 
 *   *ngFor="let msg of messages" 
 *   [message]="msg">
 * </app-chat-message>
 * 
 * // Message object structure
 * const message: ChatMessage = {
 *   role: 'user', // or 'assistant'
 *   content: 'Patient has fever and headache',
 *   timestamp: new Date()
 * };
 * ```
 * 
 * @features
 * - Role-based visual styling (user vs assistant)
 * - Markdown content rendering for rich formatting
 * - Automatic timestamp formatting
 * - Responsive message bubbles
 * - Medical-themed avatars and colors
 * - HTML sanitization for security
 * 
 * @inputs
 * - message: ChatMessage - The message object to display
 * 
 * @since 1.0.0
 */
@Component({
  selector: 'app-chat-message',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="message" [class.user]="message.role === 'user'" [class.assistant]="message.role === 'assistant'">
      <div class="message-avatar">
        <span *ngIf="message.role === 'user'">👤</span>
        <span *ngIf="message.role === 'assistant'">🤖</span>
      </div>
      <div class="message-content">
        <div class="message-header">
          <span class="message-role">{{ message.role === 'user' ? 'Tú' : 'TecSalud AI' }}</span>
                     <span class="message-time">{{ getFormattedTime() }}</span>
        </div>
        <div class="message-text" [innerHTML]="formatContent(message.content)"></div>
      </div>
    </div>
  `,
  styles: [`
    .message {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
      max-width: 80%;
      
      &.user {
        margin-left: auto;
        flex-direction: row-reverse;
        
        .message-content {
          background: var(--medical-blue);
          color: white;
        }
        
        .message-avatar {
          background: var(--medical-blue);
          color: white;
        }
      }
      
      &.assistant {
        margin-right: auto;
        
        .message-content {
          background: var(--medical-surface);
          border: 1px solid var(--medical-divider);
        }
        
        .message-avatar {
          background: var(--medical-context-active);
        }
      }
    }
    
    .message-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      flex-shrink: 0;
    }
    
    .message-content {
      border-radius: 1rem;
      padding: 0.75rem 1rem;
      min-width: 0;
      flex: 1;
    }
    
    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
      font-size: 0.75rem;
      opacity: 0.8;
    }
    
    .message-role {
      font-weight: 600;
    }
    
    .message-time {
      font-size: 0.7rem;
    }
    
    .message-text {
      line-height: 1.5;
      word-wrap: break-word;
      
      /* Markdown styling */
      :deep(p) {
        margin: 0.5rem 0;
        
        &:first-child {
          margin-top: 0;
        }
        
        &:last-child {
          margin-bottom: 0;
        }
      }
      
      :deep(code) {
        background: rgba(0, 0, 0, 0.1);
        padding: 0.125rem 0.25rem;
        border-radius: 0.25rem;
        font-family: 'Monaco', 'Menlo', monospace;
        font-size: 0.875em;
      }
      
      :deep(pre) {
        background: rgba(0, 0, 0, 0.05);
        padding: 0.75rem;
        border-radius: 0.5rem;
        overflow-x: auto;
        margin: 0.5rem 0;
        font-family: 'Monaco', 'Menlo', monospace;
        font-size: 0.875em;
      }
      
      :deep(ul), :deep(ol) {
        margin: 0.5rem 0;
        padding-left: 1.5rem;
      }
      
      :deep(li) {
        margin: 0.25rem 0;
      }
      
      :deep(strong) {
        font-weight: 600;
      }
      
      :deep(em) {
        font-style: italic;
      }
    }
    
    /* Mobile responsive */
    @media (max-width: 768px) {
      .message {
        max-width: 90%;
      }
      
      .message-avatar {
        width: 32px;
        height: 32px;
        font-size: 1rem;
      }
      
      .message-content {
        padding: 0.5rem 0.75rem;
      }
    }
  `]
})
export class ChatMessageComponent {
  /** The chat message to display */
  @Input() message!: ChatMessage;

  /**
   * Gets formatted time for the current message
   * 
   * @returns Formatted time string (HH:MM format)
   * 
   * @description Returns the current time if message timestamp is not available,
   * otherwise formats the message timestamp to HH:MM format.
   */
  getFormattedTime(): string {
    return this.formatTime(this.message.timestamp || new Date());
  }
  
  /**
   * Formats a timestamp to HH:MM format
   * 
   * @param timestamp - Date object to format
   * @returns Formatted time string in Mexican Spanish locale (HH:MM)
   * 
   * @description Converts a Date object to a localized time string
   * using Mexican Spanish locale formatting for consistency with the application.
   */
  formatTime(timestamp: Date): string {
    return new Intl.DateTimeFormat('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  }
  
  /**
   * Formats message content with markdown rendering
   * 
   * @param content - Raw message content that may contain markdown
   * @returns HTML string with rendered markdown
   * 
   * @description Processes markdown syntax in message content and converts
   * it to HTML for rich text display. Handles escaped characters, line breaks,
   * and GitHub-flavored markdown. Includes error handling with manual fallback.
   * 
   * @example
   * ```typescript
   * const content = '## Diagnosis\\n**Hypertension**\\n- High blood pressure';
   * const html = this.formatContent(content);
   * // Returns: '<h2>Diagnosis</h2><p><strong>Hypertension</strong></p><ul><li>High blood pressure</li></ul>'
   * ```
   */
  formatContent(content: string): string {
    try {
      // First, clean up any escaped characters
      let cleanContent = content
        // Handle escaped newlines
        .replace(/\\n/g, '\n')
        // Handle escaped quotes
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        // Handle other common escapes
        .replace(/\\t/g, '\t')
        .replace(/\\\\/g, '\\');
      
      // Configure marked for medical content
      marked.setOptions({
        breaks: true, // Convert \n to <br>
        gfm: true // GitHub flavored markdown
      });
      
      // Parse markdown to HTML
      const html = marked.parse(cleanContent);
      return html as string;
    } catch (error) {
      console.error('Markdown parsing error:', error);
      // Fallback: clean and format manually
      return content
        .replace(/\\n/g, '<br>')
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
    }
  }
} 