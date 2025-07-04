import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatMessage } from '@core/models';
import { marked } from 'marked';

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
  @Input() message!: ChatMessage;
  
  getFormattedTime(): string {
    return this.formatTime(this.message.timestamp || new Date());
  }
  
  formatTime(timestamp: Date): string {
    return new Intl.DateTimeFormat('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  }
  
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