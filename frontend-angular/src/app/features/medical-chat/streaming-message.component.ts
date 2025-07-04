import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { marked } from 'marked';

@Component({
  selector: 'app-streaming-message',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="streaming-message" *ngIf="content || isLoading">
      <div class="message-avatar">
        <span class="ai-icon">🤖</span>
      </div>
      <div class="message-content">
        <div class="message-header">
          <span class="message-role">TecSalud AI</span>
          <div class="typing-indicator">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        </div>
        <div class="message-text" *ngIf="content; else loadingState">
          <div [innerHTML]="formatContent(content)"></div>
          <span class="cursor">|</span>
        </div>
        <ng-template #loadingState>
          <div class="loading-text">
            <span>{{ currentLoadingText }}</span>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .streaming-message {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
      max-width: 80%;
      margin-right: auto;
      opacity: 0;
      animation: fadeIn 0.3s ease-in forwards;
    }
    
    .message-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--medical-context-active);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      flex-shrink: 0;
      position: relative;
      
      .ai-icon {
        animation: pulse 2s infinite;
      }
    }
    
    .message-content {
      background: var(--medical-surface);
      border: 1px solid var(--medical-divider);
      border-radius: 1rem;
      padding: 0.75rem 1rem;
      min-width: 0;
      flex: 1;
      position: relative;
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
      color: var(--medical-blue);
    }
    
    .typing-indicator {
      display: flex;
      gap: 2px;
      
      .dot {
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: var(--medical-blue);
        animation: typing 1.4s infinite ease-in-out;
        
        &:nth-child(1) { animation-delay: 0s; }
        &:nth-child(2) { animation-delay: 0.2s; }
        &:nth-child(3) { animation-delay: 0.4s; }
      }
    }
    
    .message-text {
      line-height: 1.5;
      word-wrap: break-word;
      position: relative;
      
      .cursor {
        color: var(--medical-blue);
        animation: blink 1s infinite;
        font-weight: bold;
      }
    }
    
    .loading-text {
      color: var(--medical-text-secondary);
      font-style: italic;
      font-size: 0.875rem;
    }
    
    /* Animations */
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    
    @keyframes typing {
      0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.3;
      }
      30% {
        transform: translateY(-10px);
        opacity: 1;
      }
    }
    
    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0; }
    }
    
    /* Mobile responsive */
    @media (max-width: 768px) {
      .streaming-message {
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
export class StreamingMessageComponent implements OnInit, OnDestroy {
  @Input() content = '';
  @Input() isLoading = false;
  
  private loadingTexts = [
    'Analizando la consulta médica...',
    'Revisando el historial del paciente...',
    'Consultando conocimiento médico...',
    'Preparando recomendaciones...',
    'Generando respuesta personalizada...'
  ];
  
  private currentIndex = 0;
  private loadingInterval?: any;
  
  ngOnInit(): void {
    if (this.isLoading) {
      this.startLoadingTextRotation();
    }
  }
  
  ngOnDestroy(): void {
    if (this.loadingInterval) {
      clearInterval(this.loadingInterval);
    }
  }
  
  get currentLoadingText(): string {
    return this.loadingTexts[this.currentIndex];
  }
  
  private startLoadingTextRotation(): void {
    this.loadingInterval = setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % this.loadingTexts.length;
    }, 2000);
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
      
      // Configure marked for streaming content
      marked.setOptions({
        breaks: true, // Convert \n to <br>
        gfm: true // GitHub flavored markdown
      });
      
      // Parse markdown to HTML
      const html = marked.parse(cleanContent);
      return html as string;
    } catch (error) {
      console.error('Markdown parsing error in streaming:', error);
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