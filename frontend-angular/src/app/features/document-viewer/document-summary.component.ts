import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { BambooModule } from '../../shared/bamboo.module';

@Component({
  selector: 'app-document-summary',
  standalone: true,
  imports: [CommonModule, RouterLink, BambooModule],
  template: `
    <div class="summary-container">
      
      <!-- Header -->
      <div class="summary-header">
        <h1 class="summary-title">📤 Sistema de Vectorización de Expedientes</h1>
        <div class="summary-subtitle">
          Inteligencia Artificial para búsqueda médica avanzada
        </div>
      </div>

      <!-- Features Grid -->
      <div class="features-grid">
        
        <!-- Upload Feature -->
        <div class="feature-card upload-card">
          <div class="feature-icon">📤</div>
          <h3 class="feature-title">Subir Expedientes</h3>
          <p class="feature-description">
            Arrastra y suelta documentos médicos (PDF, DOCX, TXT) 
            para vectorización automática con IA
          </p>
          <div class="feature-benefits">
            <div class="benefit">✅ Drag & Drop intuitivo</div>
            <div class="benefit">✅ Múltiples formatos</div>
            <div class="benefit">✅ Asignación por paciente</div>
            <div class="benefit">✅ Progreso en tiempo real</div>
          </div>
          <button 
            class="feature-button primary"
            (click)="goToUpload()">
            📤 Subir Documentos
          </button>
        </div>

        <!-- View Feature -->
        <div class="feature-card view-card">
          <div class="feature-icon">📚</div>
          <h3 class="feature-title">Ver Documentos</h3>
          <p class="feature-description">
            Explora documentos vectorizados con búsqueda semántica 
            y filtros avanzados por paciente y tipo
          </p>
          <div class="feature-benefits">
            <div class="benefit">✅ Búsqueda inteligente</div>
            <div class="benefit">✅ Filtros por paciente</div>
            <div class="benefit">✅ Previsualización</div>
            <div class="benefit">✅ Estadísticas detalladas</div>
          </div>
          <button 
            class="feature-button secondary"
            (click)="goToList()">
            📚 Ver Documentos
          </button>
        </div>

        <!-- Chat Feature -->
        <div class="feature-card chat-card">
          <div class="feature-icon">💬</div>
          <h3 class="feature-title">Chat Inteligente</h3>
          <p class="feature-description">
            Conversa con los documentos usando IA. Haz preguntas 
            específicas y obtén respuestas contextualizadas
          </p>
          <div class="feature-benefits">
            <div class="benefit">✅ Preguntas naturales</div>
            <div class="benefit">✅ Contexto automático</div>
            <div class="benefit">✅ Respuestas precisas</div>
            <div class="benefit">✅ Fuentes citadas</div>
          </div>
          <button 
            class="feature-button tertiary"
            (click)="goToChat()">
            💬 Ir al Chat
          </button>
        </div>

      </div>

      <!-- How It Works -->
      <div class="how-it-works">
        <h2 class="section-title">🔧 Cómo Funciona la Vectorización</h2>
        
        <div class="steps-container">
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h4>📄 Extracción de Texto</h4>
              <p>El sistema extrae texto de PDFs, DOCX y otros formatos automáticamente</p>
            </div>
          </div>
          
          <div class="step-arrow">→</div>
          
          <div class="step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h4>✂️ Chunking Inteligente</h4>
              <p>Divide el contenido en fragmentos lógicos manteniendo el contexto médico</p>
            </div>
          </div>
          
          <div class="step-arrow">→</div>
          
          <div class="step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h4>🧠 Embeddings con IA</h4>
              <p>Crea vectores semánticos usando Azure OpenAI para búsqueda inteligente</p>
            </div>
          </div>
          
          <div class="step-arrow">→</div>
          
          <div class="step">
            <div class="step-number">4</div>
            <div class="step-content">
              <h4>🔍 Búsqueda Vectorial</h4>
              <p>Permite búsquedas por significado, no solo palabras exactas</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Technical Details -->
      <div class="tech-details">
        <h2 class="section-title">⚙️ Detalles Técnicos</h2>
        
        <div class="tech-grid">
          <div class="tech-item">
            <div class="tech-icon">🤖</div>
            <h4>IA & Modelos</h4>
            <ul>
              <li>Azure OpenAI GPT-4o</li>
              <li>Text-embedding-3-large</li>
              <li>Coordinador multi-agente</li>
            </ul>
          </div>
          
          <div class="tech-item">
            <div class="tech-icon">🗄️</div>
            <h4>Base de Datos</h4>
            <ul>
              <li>ChromaDB vectorial</li>
              <li>SQLite relacional</li>
              <li>Metadatos estructurados</li>
            </ul>
          </div>
          
          <div class="tech-item">
            <div class="tech-icon">📊</div>
            <h4>Formatos Soportados</h4>
            <ul>
              <li>PDF (texto e imágenes)</li>
              <li>DOCX/DOC</li>
              <li>TXT plano</li>
            </ul>
          </div>
          
          <div class="tech-item">
            <div class="tech-icon">🔒</div>
            <h4>Seguridad</h4>
            <ul>
              <li>Datos locales</li>
              <li>Sin telemetría</li>
              <li>Acceso controlado</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <h2 class="section-title">🚀 Acciones Rápidas</h2>
        
        <div class="actions-grid">
          <button class="quick-action" (click)="goToUpload()">
            <span class="action-icon">📤</span>
            <span class="action-text">Subir Expedientes</span>
          </button>
          
          <button class="quick-action" (click)="goToList()">
            <span class="action-icon">📚</span>
            <span class="action-text">Ver Documentos</span>
          </button>
          
          <button class="quick-action" (click)="goToChat()">
            <span class="action-icon">💬</span>
            <span class="action-text">Chat Médico</span>
          </button>
          
          <button class="quick-action" (click)="goToDashboard()">
            <span class="action-icon">🏠</span>
            <span class="action-text">Dashboard</span>
          </button>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .summary-container {
      min-height: 100vh;
      background: linear-gradient(135deg, 
        var(--general_contrasts-15) 0%, 
        var(--general_contrasts-5) 100%
      );
      padding: var(--bmb-spacing-l);
    }

    .summary-header {
      text-align: center;
      margin-bottom: var(--bmb-spacing-xxl);
      
      .summary-title {
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--general_contrasts-100);
        margin: 0 0 var(--bmb-spacing-m) 0;
        font-family: var(--font-display);
        background: linear-gradient(135deg, 
          rgb(var(--color-blue-tec)) 0%, 
          var(--buttons-primary-hover) 100%
        );
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .summary-subtitle {
        color: var(--general_contrasts-75);
        font-size: 1.25rem;
        margin: 0;
        font-weight: 500;
      }
    }

    .features-grid {
      max-width: 1200px;
      margin: 0 auto var(--bmb-spacing-xxl) auto;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: var(--bmb-spacing-l);
    }

    .feature-card {
      background: var(--general_contrasts-15);
      border: 1px solid var(--general_contrasts-container-outline);
      border-radius: var(--bmb-radius-m);
      padding: var(--bmb-spacing-l);
      text-align: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, 
          rgb(var(--color-blue-tec)) 0%, 
          var(--buttons-primary-hover) 100%
        );
        transform: scaleX(0);
        transition: transform 0.3s ease;
      }
      
      &:hover {
        transform: translateY(-8px);
        box-shadow: 0 12px 24px rgba(var(--color-blue-tec), 0.15);
        
        &::before {
          transform: scaleX(1);
        }
      }
      
      .feature-icon {
        font-size: 4rem;
        margin-bottom: var(--bmb-spacing-m);
        filter: grayscale(0.3);
        transition: filter 0.3s ease;
      }
      
      &:hover .feature-icon {
        filter: grayscale(0);
      }
      
      .feature-title {
        color: var(--general_contrasts-100);
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0 0 var(--bmb-spacing-m) 0;
      }
      
      .feature-description {
        color: var(--general_contrasts-75);
        line-height: 1.6;
        margin-bottom: var(--bmb-spacing-m);
      }
      
      .feature-benefits {
        margin-bottom: var(--bmb-spacing-l);
        
        .benefit {
          color: var(--general_contrasts-100);
          margin-bottom: var(--bmb-spacing-xs);
          font-size: 0.9rem;
          text-align: left;
        }
      }
      
      .feature-button {
        width: 100%;
        border: none;
        border-radius: var(--bmb-radius-s);
        padding: var(--bmb-spacing-m) var(--bmb-spacing-l);
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        
        &.primary {
          background: linear-gradient(135deg, 
            var(--buttons-primary-normal) 0%, 
            var(--buttons-primary-hover) 100%
          );
          color: white;
        }
        
        &.secondary {
          background: linear-gradient(135deg, 
            var(--semantic-success) 0%, 
            #45a049 100%
          );
          color: white;
        }
        
        &.tertiary {
          background: linear-gradient(135deg, 
            #9c27b0 0%, 
            #673ab7 100%
          );
          color: white;
        }
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        }
      }
    }

    .how-it-works {
      max-width: 1200px;
      margin: 0 auto var(--bmb-spacing-xxl) auto;
      
      .section-title {
        text-align: center;
        color: var(--general_contrasts-100);
        font-size: 2rem;
        font-weight: 600;
        margin-bottom: var(--bmb-spacing-xl);
      }
    }

    .steps-container {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      gap: var(--bmb-spacing-m);
      
      .step {
        background: var(--general_contrasts-15);
        border: 1px solid var(--general_contrasts-container-outline);
        border-radius: var(--bmb-radius-m);
        padding: var(--bmb-spacing-l);
        text-align: center;
        max-width: 200px;
        
        .step-number {
          width: 40px;
          height: 40px;
          background: rgb(var(--color-blue-tec));
          color: white;
          border-radius: var(--bmb-radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 1.25rem;
          margin: 0 auto var(--bmb-spacing-m) auto;
        }
        
        .step-content {
          h4 {
            color: var(--general_contrasts-100);
            margin: 0 0 var(--bmb-spacing-s) 0;
            font-size: 1.1rem;
          }
          
          p {
            color: var(--general_contrasts-75);
            font-size: 0.9rem;
            line-height: 1.4;
            margin: 0;
          }
        }
      }
      
      .step-arrow {
        font-size: 2rem;
        color: rgb(var(--color-blue-tec));
        font-weight: bold;
      }
    }

    .tech-details {
      max-width: 1200px;
      margin: 0 auto var(--bmb-spacing-xxl) auto;
      
      .section-title {
        text-align: center;
        color: var(--general_contrasts-100);
        font-size: 2rem;
        font-weight: 600;
        margin-bottom: var(--bmb-spacing-xl);
      }
    }

    .tech-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--bmb-spacing-l);
      
      .tech-item {
        background: var(--general_contrasts-15);
        border: 1px solid var(--general_contrasts-container-outline);
        border-radius: var(--bmb-radius-m);
        padding: var(--bmb-spacing-l);
        text-align: center;
        
        .tech-icon {
          font-size: 3rem;
          margin-bottom: var(--bmb-spacing-m);
        }
        
        h4 {
          color: var(--general_contrasts-100);
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0 0 var(--bmb-spacing-m) 0;
        }
        
        ul {
          list-style: none;
          padding: 0;
          margin: 0;
          
          li {
            color: var(--general_contrasts-75);
            margin-bottom: var(--bmb-spacing-xs);
            padding-left: var(--bmb-spacing-s);
            position: relative;
            
            &::before {
              content: '▸';
              position: absolute;
              left: 0;
              color: rgb(var(--color-blue-tec));
            }
          }
        }
      }
    }

    .quick-actions {
      max-width: 800px;
      margin: 0 auto;
      
      .section-title {
        text-align: center;
        color: var(--general_contrasts-100);
        font-size: 2rem;
        font-weight: 600;
        margin-bottom: var(--bmb-spacing-xl);
      }
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: var(--bmb-spacing-m);
      
      .quick-action {
        background: var(--general_contrasts-15);
        border: 1px solid var(--general_contrasts-container-outline);
        border-radius: var(--bmb-radius-m);
        padding: var(--bmb-spacing-l);
        cursor: pointer;
        transition: all 0.3s ease;
        text-align: center;
        
        .action-icon {
          display: block;
          font-size: 2.5rem;
          margin-bottom: var(--bmb-spacing-s);
          filter: grayscale(0.5);
          transition: filter 0.3s ease;
        }
        
        .action-text {
          color: var(--general_contrasts-100);
          font-weight: 600;
          font-size: 1rem;
        }
        
        &:hover {
          background: linear-gradient(135deg, 
            var(--general_contrasts-15) 0%, 
            rgb(var(--color-mariner-50)) 100%
          );
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(var(--color-blue-tec), 0.1);
          
          .action-icon {
            filter: grayscale(0);
          }
        }
      }
    }

    @media (max-width: 768px) {
      .summary-container {
        padding: var(--bmb-spacing-m);
      }
      
      .summary-header .summary-title {
        font-size: 2rem;
      }
      
      .features-grid {
        grid-template-columns: 1fr;
      }
      
      .steps-container {
        flex-direction: column;
        
        .step-arrow {
          transform: rotate(90deg);
        }
      }
      
      .tech-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DocumentSummaryComponent {
  
  constructor(private router: Router) {}

  goToUpload(): void {
    this.router.navigate(['/documents']);
  }

  goToList(): void {
    this.router.navigate(['/documents/list']);
  }

  goToChat(): void {
    this.router.navigate(['/chat']);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
} 