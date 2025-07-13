import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

import { BambooModule } from '../../shared/bamboo.module';
import { ApiService } from '../../core/services/api.service';
import { MedicalStateService } from '../../core/services/medical-state.service';
import { Patient } from '../../core/models/patient.model';

interface DocumentItem {
  document_id: string;
  title: string;
  document_type: string;
  patient_id: string;
  date: string;
  file_size: number;
  preview: string;
  chunks?: number;
  patient_name?: string;
}

interface SearchResult {
  document_id: string;
  title: string;
  content_preview: string;
  relevance_score: number;
  document_type: string;
  patient_id: string;
  date: string;
  metadata: any;
}

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule, FormsModule, BambooModule],
  template: `
    <div class="document-list-container">
      
      <!-- Header -->
      <div class="list-header">
        <div class="header-top">
          <button 
            class="back-button"
            (click)="goBack()"
            title="Volver">
            ← Volver
          </button>
          <div class="title-container">
            <h1 class="list-title">📚 Expedientes Vectorizados</h1>
            <div class="list-subtitle">
              Documentos indexados para búsqueda inteligente
            </div>
          </div>
        </div>
      </div>

      <!-- Action Bar -->
      <div class="action-bar">
        
        <!-- Search Section -->
        <div class="search-section">
          <div class="search-input-group">
            <input 
              type="text"
              placeholder="Buscar en expedientes..."
              class="bamboo-search-input"
              [(ngModel)]="searchQuery"
              (input)="onSearchChange()"
              [disabled]="isSearching">
            <button 
              class="search-button"
              (click)="performSearch()"
              [disabled]="isSearching || !searchQuery.trim()">
              <span *ngIf="!isSearching">🔍</span>
              <span *ngIf="isSearching">⏳</span>
            </button>
          </div>
        </div>

        <!-- Filters -->
        <div class="filter-section">
          <select 
            class="bamboo-select"
            [(ngModel)]="selectedPatient"
            (change)="onFilterChange()">
            <option value="">Todos los pacientes</option>
            <option 
              *ngFor="let patient of recentPatients" 
              [value]="patient.id">
              {{ patient.name }}
            </option>
          </select>

          <select 
            class="bamboo-select"
            [(ngModel)]="selectedDocumentType"
            (change)="onFilterChange()">
            <option value="">Todos los tipos</option>
            <option value="expediente_medico">📄 Expediente Médico</option>
            <option value="laboratorio">🧪 Laboratorios</option>
            <option value="radiologia">🩻 Radiología</option>
            <option value="consulta">👩‍⚕️ Consulta</option>
            <option value="cirugia">🏥 Cirugía</option>
            <option value="farmacia">💊 Farmacia</option>
            <option value="enfermeria">👩‍⚕️ Enfermería</option>
            <option value="especialidad">🔬 Especialidad</option>
          </select>
        </div>

        <!-- Upload Button -->
        <button 
          class="upload-new-button"
          (click)="goToUpload()">
          📤 Subir Nuevos
        </button>

      </div>

      <!-- Stats Summary -->
      <div class="stats-section" *ngIf="!isSearchMode">
        <div class="stat-item">
          <span class="stat-number">{{ totalDocuments }}</span>
          <span class="stat-label">Documentos</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ uniquePatients }}</span>
          <span class="stat-label">Pacientes</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ totalChunks }}</span>
          <span class="stat-label">Chunks</span>
        </div>
      </div>

      <!-- Search Results -->
      <div class="results-section" *ngIf="isSearchMode && searchResults.length > 0">
        <h3 class="results-title">
          🔍 Resultados de Búsqueda ({{ searchResults.length }})
        </h3>
        
        <div class="search-results-list">
          <div 
            *ngFor="let result of searchResults; trackBy: trackBySearchResult"
            class="search-result-item">
            
            <div class="result-header">
              <div class="result-title">{{ result.title }}</div>
              <div class="result-score">
                {{ (result.relevance_score * 100).toFixed(0) }}% relevante
              </div>
            </div>
            
            <div class="result-meta">
              <span class="result-type">{{ getDocumentTypeLabel(result.document_type) }}</span>
              <span class="result-patient">{{ getPatientName(result.patient_id) }}</span>
              <span class="result-date">{{ result.date }}</span>
            </div>
            
            <div class="result-preview">
              {{ result.content_preview }}
            </div>
            
            <div class="result-actions">
              <button 
                class="action-button"
                (click)="viewDocument(result.document_id)">
                👁️ Ver
              </button>
              <button 
                class="action-button"
                (click)="chatWithDocument(result)">
                💬 Chatear
              </button>
            </div>

          </div>
        </div>
      </div>

      <!-- Document List -->
      <div class="documents-section" *ngIf="!isSearchMode">
        <h3 class="documents-title">
          📋 Documentos ({{ filteredDocuments.length }})
        </h3>
        
        <!-- Loading State -->
        <div *ngIf="isLoading" class="loading-state">
          <div class="loading-icon">⏳</div>
          <p>Cargando documentos...</p>
        </div>

        <!-- Empty State -->
        <div *ngIf="!isLoading && filteredDocuments.length === 0" class="empty-state">
          <div class="empty-icon">📄</div>
          <h4>No hay documentos</h4>
          <p>Sube algunos expedientes para comenzar</p>
          <button 
            class="upload-button"
            (click)="goToUpload()">
            📤 Subir Primer Documento
          </button>
        </div>

        <!-- Documents Grid -->
        <div *ngIf="!isLoading && filteredDocuments.length > 0" class="documents-grid">
          <div 
            *ngFor="let doc of filteredDocuments; trackBy: trackByDocument"
            class="document-card">
            
            <div class="doc-header">
              <div class="doc-icon">{{ getDocumentIcon(doc.document_type) }}</div>
              <div class="doc-type">{{ getDocumentTypeLabel(doc.document_type) }}</div>
            </div>
            
            <div class="doc-body">
              <h4 class="doc-title">{{ doc.title }}</h4>
              <div class="doc-meta">
                <div class="doc-patient">
                  👤 {{ doc.patient_name || doc.patient_id }}
                </div>
                <div class="doc-date">
                  📅 {{ doc.date }}
                </div>
                <div class="doc-size">
                  📊 {{ getFileSize(doc.file_size) }}
                </div>
              </div>
              <div class="doc-preview">
                {{ doc.preview }}
              </div>
            </div>
            
            <div class="doc-actions">
              <button 
                class="action-button primary"
                (click)="viewDocument(doc.document_id)"
                title="Ver documento completo">
                👁️ Ver
              </button>
              <button 
                class="action-button"
                (click)="chatWithDocument(doc)"
                title="Conversar sobre este documento">
                💬 Chat
              </button>
              <button 
                class="action-button danger"
                (click)="deleteDocument(doc)"
                title="Eliminar documento">
                🗑️
              </button>
            </div>

          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .document-list-container {
      min-height: 100vh;
      max-height: 100vh;
      background: linear-gradient(135deg, 
        var(--general_contrasts-15) 0%, 
        var(--general_contrasts-5) 100%
      );
      padding: var(--bmb-spacing-l);
      padding-bottom: var(--bmb-spacing-xxl);
      overflow-x: hidden;
      overflow-y: auto;
      box-sizing: border-box;
      -webkit-overflow-scrolling: touch;
      scroll-behavior: smooth;
    }

    .list-header {
      margin-bottom: var(--bmb-spacing-xl);
      
      .header-top {
        display: flex;
        align-items: center;
        gap: var(--bmb-spacing-l);
        margin-bottom: var(--bmb-spacing-m);
        
        .back-button {
          background: var(--general_contrasts-15);
          border: 1px solid var(--general_contrasts-container-outline);
          border-radius: var(--bmb-radius-s);
          padding: var(--bmb-spacing-s) var(--bmb-spacing-m);
          color: var(--general_contrasts-100);
          cursor: pointer;
          transition: all 0.3s ease;
          flex-shrink: 0;
          
          &:hover {
            background: var(--general_contrasts-25);
            transform: translateX(-4px);
          }
        }
        
        .title-container {
          flex: 1;
          text-align: center;
          
          .list-title {
            font-size: 2.2rem;
            font-weight: 700;
            color: var(--general_contrasts-100);
            margin: 0 0 var(--bmb-spacing-s) 0;
            font-family: var(--font-display, 'Poppins', sans-serif);
            background: linear-gradient(135deg, 
              rgb(var(--color-blue-tec)) 0%, 
              rgb(var(--color-mariner-100)) 100%
            );
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            line-height: 1.2;
          }
          
          .list-subtitle {
            color: var(--general_contrasts-75);
            font-size: 1.1rem;
            margin: 0;
            line-height: 1.4;
            max-width: 600px;
            margin: 0 auto;
          }
        }
      }
    }

    .action-bar {
      max-width: 1200px;
      margin: 0 auto var(--bmb-spacing-l) auto;
      display: flex;
      gap: var(--bmb-spacing-m);
      flex-wrap: wrap;
      align-items: center;
      background: var(--general_contrasts-15);
      padding: var(--bmb-spacing-m);
      border-radius: var(--bmb-radius-m);
      border: 1px solid var(--general_contrasts-container-outline);
      overflow: hidden;
      box-sizing: border-box;
      
      .search-section {
        flex: 1;
        min-width: 280px;
        max-width: 500px;
        
        .search-input-group {
          display: flex;
          gap: var(--bmb-spacing-s);
          width: 100%;
          box-sizing: border-box;
          
          .bamboo-search-input {
            flex: 1;
            padding: var(--bmb-spacing-s) var(--bmb-spacing-m);
            border: 1px solid var(--general_contrasts-container-outline);
            border-radius: var(--bmb-radius-s);
            background: var(--general_contrasts-input-background);
            color: var(--general_contrasts-100);
            font-size: 1rem;
            min-width: 0;
            box-sizing: border-box;
            
            &:focus {
              outline: none;
              border-color: rgb(var(--color-blue-tec));
              box-shadow: 0 0 0 2px rgba(var(--color-blue-tec), 0.2);
            }
          }
          
          .search-button {
            background: var(--buttons-primary-normal);
            color: white;
            border: none;
            border-radius: var(--bmb-radius-s);
            padding: var(--bmb-spacing-s) var(--bmb-spacing-m);
            cursor: pointer;
            transition: all 0.3s ease;
            flex-shrink: 0;
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            
            &:hover:not(:disabled) {
              background: var(--buttons-primary-hover);
            }
            
            &:disabled {
              opacity: 0.6;
              cursor: not-allowed;
            }
          }
        }
      }
      
      .filter-section {
        display: flex;
        gap: var(--bmb-spacing-s);
        flex-shrink: 0;
        
        .bamboo-select {
          padding: var(--bmb-spacing-s) var(--bmb-spacing-m);
          border: 1px solid var(--general_contrasts-container-outline);
          border-radius: var(--bmb-radius-s);
          background: var(--general_contrasts-input-background);
          color: var(--general_contrasts-100);
          font-size: 0.875rem;
          min-width: 140px;
          max-width: 180px;
          width: 160px;
          box-sizing: border-box;
          
          &:focus {
            outline: none;
            border-color: rgb(var(--color-blue-tec));
            box-shadow: 0 0 0 2px rgba(var(--color-blue-tec), 0.2);
          }
        }
      }
      
      .upload-new-button {
        background: linear-gradient(135deg, 
          var(--semantic-success) 0%, 
          #45a049 100%
        );
        color: white;
        border: none;
        border-radius: var(--bmb-radius-s);
        padding: var(--bmb-spacing-s) var(--bmb-spacing-m);
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        white-space: nowrap;
        flex-shrink: 0;
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
        }
      }
    }

    .stats-section {
      max-width: 1200px;
      margin: 0 auto var(--bmb-spacing-l) auto;
      display: flex;
      justify-content: center;
      gap: var(--bmb-spacing-xl);
      
      .stat-item {
        text-align: center;
        
        .stat-number {
          display: block;
          font-size: 2rem;
          font-weight: 700;
          color: rgb(var(--color-blue-tec));
          margin-bottom: var(--bmb-spacing-xs);
        }
        
        .stat-label {
          font-size: 0.875rem;
          color: var(--general_contrasts-75);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      }
    }

    .results-section, .documents-section {
      max-width: 1200px;
      margin: 0 auto;
      
      .results-title, .documents-title {
        color: var(--general_contrasts-100);
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: var(--bmb-spacing-l);
        text-align: center;
      }
    }

    .loading-state, .empty-state {
      text-align: center;
      padding: var(--bmb-spacing-xxl);
      
      .loading-icon, .empty-icon {
        font-size: 4rem;
        margin-bottom: var(--bmb-spacing-m);
        opacity: 0.6;
      }
      
      h4 {
        color: var(--general_contrasts-100);
        margin-bottom: var(--bmb-spacing-s);
      }
      
      p {
        color: var(--general_contrasts-75);
        margin-bottom: var(--bmb-spacing-m);
      }
      
      .upload-button {
        background: var(--buttons-primary-normal);
        color: white;
        border: none;
        border-radius: var(--bmb-radius-s);
        padding: var(--bmb-spacing-m) var(--bmb-spacing-l);
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        
        &:hover {
          background: var(--buttons-primary-hover);
          transform: translateY(-2px);
        }
      }
    }

    .search-results-list {
      display: flex;
      flex-direction: column;
      gap: var(--bmb-spacing-m);
    }

    .search-result-item {
      background: var(--general_contrasts-15);
      border: 1px solid var(--general_contrasts-container-outline);
      border-radius: var(--bmb-radius-m);
      padding: var(--bmb-spacing-m);
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(var(--color-blue-tec), 0.1);
      }
      
      .result-header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        margin-bottom: var(--bmb-spacing-s);
        
        .result-title {
          font-weight: 600;
          color: var(--general_contrasts-100);
          font-size: 1.1rem;
        }
        
        .result-score {
          background: rgb(var(--color-blue-tec));
          color: white;
          padding: var(--bmb-spacing-xs) var(--bmb-spacing-s);
          border-radius: var(--bmb-radius-s);
          font-size: 0.75rem;
          font-weight: 600;
        }
      }
      
      .result-meta {
        display: flex;
        gap: var(--bmb-spacing-m);
        margin-bottom: var(--bmb-spacing-s);
        font-size: 0.875rem;
        color: var(--general_contrasts-75);
        
        .result-type {
          background: var(--general_contrasts-25);
          padding: var(--bmb-spacing-xs) var(--bmb-spacing-s);
          border-radius: var(--bmb-radius-s);
        }
      }
      
      .result-preview {
        color: var(--general_contrasts-100);
        line-height: 1.5;
        margin-bottom: var(--bmb-spacing-m);
      }
      
      .result-actions {
        display: flex;
        gap: var(--bmb-spacing-s);
      }
    }

    .documents-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: var(--bmb-spacing-m);
    }

    .document-card {
      background: var(--general_contrasts-15);
      border: 1px solid var(--general_contrasts-container-outline);
      border-radius: var(--bmb-radius-m);
      padding: var(--bmb-spacing-m);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, 
          rgb(var(--color-blue-tec)) 0%, 
          var(--buttons-primary-hover) 100%
        );
        transform: scaleX(0);
        transition: transform 0.3s ease;
      }
      
      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 20px rgba(var(--color-blue-tec), 0.15);
        
        &::before {
          transform: scaleX(1);
        }
      }
      
      .doc-header {
        display: flex;
        align-items: center;
        gap: var(--bmb-spacing-s);
        margin-bottom: var(--bmb-spacing-m);
        
        .doc-icon {
          font-size: 1.5rem;
        }
        
        .doc-type {
          background: var(--general_contrasts-25);
          padding: var(--bmb-spacing-xs) var(--bmb-spacing-s);
          border-radius: var(--bmb-radius-s);
          font-size: 0.75rem;
          font-weight: 600;
          color: rgb(var(--color-blue-tec));
          text-transform: uppercase;
        }
      }
      
      .doc-body {
        margin-bottom: var(--bmb-spacing-m);
        
        .doc-title {
          color: var(--general_contrasts-100);
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 var(--bmb-spacing-s) 0;
          line-height: 1.3;
        }
        
        .doc-meta {
          display: flex;
          flex-direction: column;
          gap: var(--bmb-spacing-xs);
          margin-bottom: var(--bmb-spacing-s);
          font-size: 0.875rem;
          color: var(--general_contrasts-75);
        }
        
        .doc-preview {
          color: var(--general_contrasts-100);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      }
      
      .doc-actions {
        display: flex;
        gap: var(--bmb-spacing-s);
        flex-wrap: wrap;
      }
    }

    .action-button {
      background: var(--general_contrasts-25);
      color: var(--general_contrasts-100);
      border: 1px solid var(--general_contrasts-container-outline);
      border-radius: var(--bmb-radius-s);
      padding: var(--bmb-spacing-xs) var(--bmb-spacing-s);
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover {
        background: var(--general_contrasts-35);
        transform: translateY(-1px);
      }
      
      &.primary {
        background: var(--buttons-primary-normal);
        color: white;
        border-color: var(--buttons-primary-normal);
        
        &:hover {
          background: var(--buttons-primary-hover);
        }
      }
      
      &.danger {
        background: rgba(244, 67, 54, 0.1);
        color: var(--semantic-error);
        border-color: var(--semantic-error);
        
        &:hover {
          background: rgba(244, 67, 54, 0.2);
        }
      }
    }

    @media (max-width: 768px) {
      .document-list-container {
        padding: var(--bmb-spacing-m);
        padding-bottom: calc(var(--bmb-spacing-xxl) + var(--bmb-spacing-l));
        max-height: 100vh;
        overflow-y: auto;
      }
      
      .list-header {
        margin-bottom: var(--bmb-spacing-l);
        
        .header-top {
          .title-container {
            .list-title {
              font-size: 1.5rem;
            }
            
            .list-subtitle {
              font-size: 1rem;
            }
          }
        }
      }
      
      .action-bar {
        flex-direction: column;
        align-items: stretch;
        gap: var(--bmb-spacing-m);
        
        .search-section {
          width: 100%;
          min-width: auto;
          max-width: none;
        }
        
        .filter-section {
          width: 100%;
          flex-direction: column;
          gap: var(--bmb-spacing-s);
          
          .bamboo-select {
            width: 100%;
            min-width: auto;
            max-width: none;
          }
        }
        
        .upload-new-button {
          width: 100%;
        }
      }
      
      .stats-section {
        flex-direction: column;
        gap: var(--bmb-spacing-m);
        margin-bottom: var(--bmb-spacing-l);
      }
      
      .documents-grid {
        grid-template-columns: 1fr;
        gap: var(--bmb-spacing-m);
      }
      
      .document-card {
        margin-bottom: var(--bmb-spacing-m);
      }
      
      .results-section, .documents-section {
        margin-bottom: var(--bmb-spacing-xl);
      }
    }
  `]
})
export class DocumentListComponent implements OnInit {
  private apiService = inject(ApiService);
  private medicalStateService = inject(MedicalStateService);
  private router = inject(Router);
  private location = inject(Location);

  // Data properties
  documents: DocumentItem[] = [];
  filteredDocuments: DocumentItem[] = [];
  searchResults: SearchResult[] = [];
  recentPatients: Patient[] = [];
  
  // UI state
  isLoading = false;
  isSearching = false;
  isSearchMode = false;
  
  // Filter state
  searchQuery = '';
  selectedPatient = '';
  selectedDocumentType = '';
  
  // Stats
  totalDocuments = 0;
  uniquePatients = 0;
  totalChunks = 0;

  ngOnInit(): void {
    this.loadPatients();
    this.loadDocuments();
  }

  private loadPatients(): void {
    this.medicalStateService.recentPatients$.subscribe(patients => {
      this.recentPatients = patients;
    });
  }

  private async loadDocuments(): Promise<void> {
    this.isLoading = true;
    try {
      const response = await this.apiService.getDocuments().toPromise();
      this.documents = response.documents || [];
      this.updateStats();
      this.applyFilters();
      console.log(`📚 Loaded ${this.documents.length} documents`);
    } catch (error) {
      console.error('❌ Error loading documents:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private updateStats(): void {
    this.totalDocuments = this.documents.length;
    this.uniquePatients = new Set(this.documents.map(d => d.patient_id)).size;
    this.totalChunks = this.documents.reduce((sum, d) => sum + (d.chunks || 1), 0);
  }

  onSearchChange(): void {
    if (!this.searchQuery.trim()) {
      this.isSearchMode = false;
      this.searchResults = [];
      this.applyFilters();
    }
  }

  async performSearch(): Promise<void> {
    if (!this.searchQuery.trim()) return;
    
    this.isSearching = true;
    this.isSearchMode = true;
    
    try {
      const response = await this.apiService.searchDocuments(
        this.searchQuery,
        this.selectedPatient || undefined,
        this.selectedDocumentType || undefined
      ).toPromise();
      
      this.searchResults = response.results || [];
      console.log(`🔍 Search found ${this.searchResults.length} results`);
      
    } catch (error) {
      console.error('❌ Search error:', error);
      this.searchResults = [];
    } finally {
      this.isSearching = false;
    }
  }

  onFilterChange(): void {
    if (this.isSearchMode && this.searchQuery.trim()) {
      this.performSearch();
    } else {
      this.applyFilters();
    }
  }

  private applyFilters(): void {
    this.filteredDocuments = this.documents.filter(doc => {
      const matchesPatient = !this.selectedPatient || doc.patient_id === this.selectedPatient;
      const matchesType = !this.selectedDocumentType || doc.document_type === this.selectedDocumentType;
      return matchesPatient && matchesType;
    });
  }

  async viewDocument(documentId: string): Promise<void> {
    try {
      const response = await this.apiService.getDocumentById(documentId).toPromise();
      
      // Show document in modal or navigate to detail view
      console.log('📄 Document content:', response);
      alert(`Documento: ${response.metadata?.title}\n\nContenido: ${response.content.substring(0, 500)}...`);
      
    } catch (error) {
      console.error('❌ Error viewing document:', error);
      alert('Error al cargar el documento');
    }
  }

  chatWithDocument(doc: any): void {
    // Set document context and navigate to chat
    console.log('💬 Starting chat with document:', doc.title);
    
    const patient = this.recentPatients.find(p => p.id === doc.patient_id);
    if (patient) {
      this.medicalStateService.setActivePatient(patient);
    }
    
    this.router.navigate(['/chat'], {
      queryParams: { 
        document: doc.document_id,
        context: doc.title 
      }
    });
  }

  async deleteDocument(doc: DocumentItem): Promise<void> {
    const confirmed = confirm(`¿Eliminar el documento "${doc.title}"?\nEsta acción no se puede deshacer.`);
    if (!confirmed) return;
    
    try {
      await this.apiService.deleteDocument(doc.document_id).toPromise();
      console.log(`🗑️ Deleted document: ${doc.title}`);
      
      // Remove from local list
      this.documents = this.documents.filter(d => d.document_id !== doc.document_id);
      this.updateStats();
      this.applyFilters();
      
    } catch (error) {
      console.error('❌ Error deleting document:', error);
      alert('Error al eliminar el documento');
    }
  }

  getDocumentIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'expediente_medico': '📄',
      'laboratorio': '🧪',
      'radiologia': '🩻',
      'consulta': '👩‍⚕️',
      'cirugia': '🏥',
      'farmacia': '💊',
      'enfermeria': '👩‍⚕️',
      'especialidad': '🔬'
    };
    return icons[type] || '📄';
  }

  getDocumentTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'expediente_medico': 'Expediente Médico',
      'laboratorio': 'Laboratorios',
      'radiologia': 'Radiología',
      'consulta': 'Consulta',
      'cirugia': 'Cirugía',
      'farmacia': 'Farmacia',
      'enfermeria': 'Enfermería',
      'especialidad': 'Especialidad'
    };
    return labels[type] || type;
  }

  getPatientName(patientId: string): string {
    const patient = this.recentPatients.find(p => p.id === patientId);
    return patient ? patient.name : patientId;
  }

  getFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  goToUpload(): void {
    this.router.navigate(['/documents']);
  }

  goBack(): void {
    this.location.back();
  }

  trackByDocument(index: number, doc: DocumentItem): string {
    return doc.document_id;
  }

  trackBySearchResult(index: number, result: SearchResult): string {
    return result.document_id;
  }
} 