import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { marked } from 'marked';

/**
 * Streaming message component for real-time AI response display
 * 
 * @description Displays AI assistant messages with real-time streaming capability,
 * typing indicators, loading states, and markdown formatting. Provides visual
 * feedback during AI response generation with animated typing effects.
 * 
 * @example
 * ```typescript
 * // In parent component template
 * <app-streaming-message
 *   [content]="streamingContent"
 *   [isLoading]="isAiResponding">
 * </app-streaming-message>
 * 
 * // In parent component
 * onStreamingUpdate(chunk: string) {
 *   this.streamingContent += chunk;
 * }
 * 
 * onStreamingStart() {
 *   this.isAiResponding = true;
 *   this.streamingContent = '';
 * }
 * ```
 * 
 * @features
 * - Real-time content streaming display
 * - Animated typing indicators with rotating text
 * - Markdown content rendering
 * - Professional AI avatar with medical styling
 * - Smooth fade-in animations
 * - Cursor blinking effect during streaming
 * - Loading state management
 * 
 * @inputs
 * - content: string - Current streamed content to display
 * - isLoading: boolean - Whether AI is currently generating response
 * 
 * @since 1.0.0
 */
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
    /* Streaming Message Container */
    .streaming-message {
      display: flex;
      gap: var(--bmb-spacing-s);
      margin-bottom: var(--bmb-spacing-l);
      max-width: 85%;
      margin-right: auto;
      opacity: 0;
      animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      position: relative;
    }
    
    /* Message Avatar */
    .message-avatar {
      width: 44px;
      height: 44px;
      border-radius: var(--bmb-radius-full);
      background: linear-gradient(135deg, 
        rgba(156, 39, 176, 0.2) 0%, 
        rgba(156, 39, 176, 0.1) 100%
      );
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
      flex-shrink: 0;
      position: relative;
      box-shadow: 0 4px 12px rgba(156, 39, 176, 0.2);
      border: 2px solid rgba(156, 39, 176, 0.1);
      backdrop-filter: blur(5px);
      
      /* Efecto glow */
      &::before {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        border-radius: var(--bmb-radius-full);
        background: linear-gradient(135deg, 
          rgba(156, 39, 176, 0.3) 0%, 
          rgba(156, 39, 176, 0.1) 100%
        );
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: -1;
      }
      
      &:hover::before {
        opacity: 1;
        animation: pulse-glow 2s infinite;
      }
      
      .ai-icon {
        animation: pulse 2s infinite;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
      }
    }
    
    @keyframes pulse-glow {
      0%, 100% { 
        opacity: 0.3; 
        transform: scale(1);
      }
      50% { 
        opacity: 0.6; 
        transform: scale(1.1);
      }
    }
    
    /* 🎯 MESSAGE CONTENT PREMIUM */
    .message-content {
      background: linear-gradient(135deg, 
        rgba(255, 255, 255, 0.95) 0%, 
        rgba(255, 255, 255, 0.9) 100%
      );
      border: 1px solid rgba(var(--general_contrasts-container-outline), 0.2);
      border-radius: var(--bmb-radius-m);
      padding: var(--bmb-spacing-s) var(--bmb-spacing-m);
      min-width: 0;
      flex: 1;
      position: relative;
      backdrop-filter: blur(10px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      
      /* Efecto glass top */
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, 
          transparent 0%, 
          rgba(156, 39, 176, 0.3) 50%, 
          transparent 100%
        );
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      &:hover::before {
        opacity: 1;
      }
    }
    
    /* 🎨 MESSAGE HEADER PREMIUM */
    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--bmb-spacing-s);
      font-size: 0.75rem;
      opacity: 0.9;
      font-weight: 500;
    }
    
    .message-role {
      font-weight: 700;
      color: rgb(var(--color-blue-tec));
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-size: 0.7rem;
    }
    
    /* 🎯 TYPING INDICATOR PREMIUM */
    .typing-indicator {
      display: flex;
      gap: var(--bmb-spacing-xs);
      
      .dot {
        width: 5px;
        height: 5px;
        border-radius: var(--bmb-radius-full);
        background: rgb(var(--color-blue-tec));
        animation: typing 1.4s infinite ease-in-out;
        box-shadow: 0 0 6px rgba(var(--color-blue-tec), 0.4);
        
        &:nth-child(1) { animation-delay: 0s; }
        &:nth-child(2) { animation-delay: 0.2s; }
        &:nth-child(3) { animation-delay: 0.4s; }
      }
    }
    
    @keyframes typing {
      0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.3;
        box-shadow: 0 0 6px rgba(var(--color-blue-tec), 0.2);
      }
      30% {
        transform: translateY(-8px);
        opacity: 1;
        box-shadow: 0 0 12px rgba(var(--color-blue-tec), 0.6);
      }
    }
    
    /* 🎨 MESSAGE TEXT PREMIUM */
    .message-text {
      line-height: 1.6;
      word-wrap: break-word;
      position: relative;
      color: rgb(var(--general_contrasts-text-primary));
      font-weight: 500;
      
      .cursor {
        color: rgb(var(--color-blue-tec));
        animation: blink 1s infinite;
        font-weight: bold;
        text-shadow: 0 0 4px rgba(var(--color-blue-tec), 0.4);
      }
    }
    
    @keyframes blink {
      0%, 50% { 
        opacity: 1; 
        text-shadow: 0 0 8px rgba(var(--color-blue-tec), 0.6);
      }
      51%, 100% { 
        opacity: 0; 
        text-shadow: none;
      }
    }
    
    /* 🎯 LOADING TEXT PREMIUM */
    .loading-text {
      color: rgb(var(--general_contrasts-text-secondary));
      font-style: italic;
      font-size: 0.875rem;
      font-weight: 500;
      position: relative;
      
      span {
        display: inline-block;
        animation: loadingPulse 2s infinite;
      }
    }
    
    @keyframes loadingPulse {
      0%, 100% { 
        opacity: 0.6; 
        transform: scale(1);
      }
      50% { 
        opacity: 1; 
        transform: scale(1.02);
      }
    }
    
    /* 🎨 ENTRANCE ANIMATION PREMIUM */
    @keyframes fadeIn {
      from { 
        opacity: 0; 
        transform: translateY(20px) scale(0.95);
      }
      to { 
        opacity: 1; 
        transform: translateY(0) scale(1);
      }
    }
    
    @keyframes pulse {
      0%, 100% { 
        transform: scale(1);
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
      }
      50% { 
        transform: scale(1.1);
        filter: drop-shadow(0 4px 8px rgba(156, 39, 176, 0.2));
      }
    }
    
    /* 🎨 MOBILE RESPONSIVE PREMIUM */
    @media (max-width: 768px) {
      .streaming-message {
        max-width: 95%;
        gap: var(--bmb-spacing-xs);
      }
      
      .message-avatar {
        width: 36px;
        height: 36px;
        font-size: 1.1rem;
      }
      
      .message-content {
        padding: var(--bmb-spacing-xs) var(--bmb-spacing-s);
      }
      
      .message-header {
        margin-bottom: var(--bmb-spacing-xs);
      }
      
      .message-text {
        font-size: 0.875rem;
      }
      
      .loading-text {
        font-size: 0.8rem;
      }
    }
    
    /* 🎯 ENHANCED VISUAL EFFECTS */
    .streaming-message:hover {
      transform: translateY(-2px);
      
      .message-content {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      }
      
      .message-avatar {
        transform: scale(1.05);
        box-shadow: 0 6px 20px rgba(156, 39, 176, 0.3);
      }
    }
  `]
})
export class StreamingMessageComponent implements OnInit, OnDestroy {
  /** Current streaming content to display */
  @Input() content = '';
  
  /** Whether AI is currently loading/generating response */
  @Input() isLoading = false;
  
  /** Array of loading text messages to rotate through */
  private loadingTexts = [
    'Analizando la consulta médica...',
    'Revisando el historial del paciente...',
    'Consultando conocimiento médico...',
    'Preparando recomendaciones...',
    'Generando respuesta personalizada...'
  ];
  
  /** Current index for loading text rotation */
  private currentIndex = 0;
  
  /** Interval reference for loading text rotation */
  private loadingInterval?: any;
  
  /**
   * Component initialization lifecycle method
   * 
   * @description Starts loading text rotation if component is in loading state
   */
  ngOnInit(): void {
    if (this.isLoading) {
      this.startLoadingTextRotation();
    }
  }
  
  /**
   * Component cleanup lifecycle method
   * 
   * @description Cleans up loading text rotation interval to prevent memory leaks
   */
  ngOnDestroy(): void {
    if (this.loadingInterval) {
      clearInterval(this.loadingInterval);
    }
  }
  
  /**
   * Gets the current loading text for display
   * 
   * @returns Current loading text string from rotation array
   * 
   * @description Provides the currently active loading message for
   * display in the loading state template.
   */
  get currentLoadingText(): string {
    return this.loadingTexts[this.currentIndex];
  }
  
  /**
   * Starts automatic rotation of loading text messages
   * 
   * @private
   * @description Initiates an interval that cycles through loading messages
   * every 2 seconds to provide dynamic feedback during AI processing.
   */
  private startLoadingTextRotation(): void {
    this.loadingInterval = setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % this.loadingTexts.length;
    }, 2000);
  }
  
  /**
   * Formats streaming content with markdown rendering
   * 
   * @param content - Raw streaming content that may contain markdown
   * @returns HTML string with rendered markdown
   * 
   * @description Processes markdown syntax in streaming content and converts
   * it to HTML for rich text display during real-time streaming.
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