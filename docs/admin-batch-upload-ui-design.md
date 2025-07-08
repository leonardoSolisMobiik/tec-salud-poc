# 🎨 Admin Batch Upload UI Design

**Date:** 2025-01-07  
**Task:** TASK-DOC-003 - Create Admin Batch Upload UI  
**Objective:** Create administrator interface for bulk document uploads  
**Dependencies:** TASK-DOC-002 (completed - architecture designed)

---

## 🎯 **Executive Summary**

Design comprehensive admin interface for TecSalud bulk document processing using **Bamboo Design System** components and **80% existing Angular infrastructure**.

**Key Features:**
- 📤 **Bulk Upload Interface** - Drag & drop for multiple files
- 🔍 **Patient Matching Review** - Admin review of uncertain matches
- 📊 **Processing Dashboard** - Real-time batch processing status
- 📈 **Analytics & Reports** - Batch processing statistics

---

## 🗂️ **Component Architecture**

### **1. Admin Dashboard Layout**

```typescript
// ✅ EXISTING: Extend current Angular app-shell
@Component({
  selector: 'app-admin-dashboard',
  template: `
    <div class="admin-dashboard">
      <bmb-top-bar title="Admin Dashboard" />
      
      <div class="dashboard-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `
})
export class AdminDashboardComponent {
  // ✅ EXISTING: Use current routing system
}
```

### **2. Bulk Upload Interface**

```typescript
@Component({
  selector: 'app-bulk-upload',
  template: `
    <div class="bulk-upload-container">
      <!-- Step 1: Upload Configuration -->
      <bmb-card class="upload-config">
        <h3>Upload Configuration</h3>
        
        <bmb-form-field>
          <bmb-label>Processing Type</bmb-label>
          <bmb-select [(value)]="processingType">
            <bmb-option value="vectorized">Vectorized Only</bmb-option>
            <bmb-option value="complete">Complete Storage</bmb-option>
            <bmb-option value="both">Both (Recommended)</bmb-option>
          </bmb-select>
        </bmb-form-field>
        
        <bmb-checkbox [(checked)]="autoCreatePatients">
          Auto-create patients from filenames
        </bmb-checkbox>
      </bmb-card>
      
      <!-- Step 2: File Upload Zone -->
      <bmb-card class="file-upload-zone">
        <div class="drag-drop-area" 
             [class.drag-over]="isDragOver"
             (dragover)="onDragOver($event)"
             (drop)="onFilesDrop($event)">
          
          <bmb-icon name="cloud-upload" size="large"></bmb-icon>
          <h3>Drag & Drop PDF Files Here</h3>
          <p>Or click to select files</p>
          
          <bmb-button (click)="selectFiles()" variant="primary">
            Select Files
          </bmb-button>
        </div>
        
        <input #fileInput type="file" multiple accept=".pdf" 
               (change)="onFilesSelected($event)" hidden>
      </bmb-card>
      
      <!-- Step 3: File Preview -->
      <bmb-card class="file-preview" *ngIf="selectedFiles.length > 0">
        <h3>Selected Files ({{ selectedFiles.length }})</h3>
        
        <div class="file-list">
          <div *ngFor="let file of selectedFiles" class="file-item">
            <bmb-icon name="file-pdf"></bmb-icon>
            <div class="file-info">
              <strong>{{ file.parsedData?.patientName || 'Unknown Patient' }}</strong>
              <span>{{ file.name }}</span>
              <span class="file-size">{{ file.size | fileSize }}</span>
            </div>
            <bmb-badge [variant]="getParsingStatus(file)">
              {{ file.parsingStatus }}
            </bmb-badge>
          </div>
        </div>
        
        <bmb-button (click)="startProcessing()" 
                    [disabled]="!canStartProcessing()"
                    variant="primary">
          Start Processing
        </bmb-button>
      </bmb-card>
    </div>
  `
})
export class BulkUploadComponent {
  // ✅ EXISTING: Use current services
  constructor(
    private apiService: ApiService,
    private uiStateService: UIStateService
  ) {}
  
  // 🆕 NEW: Bulk upload specific logic
  processingType: ProcessingType = 'both';
  autoCreatePatients = true;
  selectedFiles: ParsedFile[] = [];
  
  onFilesDrop(event: DragEvent) {
    // Handle file drop with TecSalud parsing
  }
  
  async startProcessing() {
    // ✅ EXISTING: Use current API service
    const batchId = await this.apiService.initiateBulkUpload({
      processingType: this.processingType,
      autoCreatePatients: this.autoCreatePatients
    });
    
    // Navigate to review interface
    this.router.navigate(['/admin/batch', batchId, 'review']);
  }
}
```

### **3. Patient Matching Review Interface**

```typescript
@Component({
  selector: 'app-patient-matching-review',
  template: `
    <div class="patient-review-container">
      <bmb-card class="review-header">
        <h2>Patient Matching Review</h2>
        <bmb-progress-bar [value]="reviewProgress"></bmb-progress-bar>
        <span>{{ reviewedCount }} of {{ totalCount }} reviewed</span>
      </bmb-card>
      
      <div class="review-items">
        <bmb-card *ngFor="let item of reviewItems" class="review-item">
          <div class="file-info">
            <bmb-icon name="file-pdf"></bmb-icon>
            <div>
              <strong>{{ item.filename }}</strong>
              <span>Parsed: {{ item.parsedPatientName }}</span>
            </div>
          </div>
          
          <div class="matching-options">
            <h4>Possible Matches</h4>
            
            <div *ngFor="let match of item.possibleMatches" class="match-option">
              <bmb-radio-button 
                [name]="'match-' + item.id"
                [value]="match.patientId"
                (change)="selectMatch(item, match)">
                {{ match.patientName }}
                <bmb-badge [variant]="getConfidenceColor(match.confidence)">
                  {{ (match.confidence * 100).toFixed(0) }}% match
                </bmb-badge>
              </bmb-radio-button>
            </div>
            
            <bmb-radio-button 
              [name]="'match-' + item.id"
              value="create-new"
              (change)="selectCreateNew(item)">
              Create New Patient
            </bmb-radio-button>
          </div>
        </bmb-card>
      </div>
      
      <div class="review-actions">
        <bmb-button (click)="submitReview()" 
                    [disabled]="!allItemsReviewed()"
                    variant="primary">
          Submit Review & Process
        </bmb-button>
      </div>
    </div>
  `
})
export class PatientMatchingReviewComponent {
  // ✅ EXISTING: Use current medical state service
  constructor(
    private medicalStateService: MedicalStateService,
    private apiService: ApiService
  ) {}
  
  reviewItems: ReviewItem[] = [];
  reviewedCount = 0;
  
  selectMatch(item: ReviewItem, match: PatientMatch) {
    // Handle match selection
  }
  
  async submitReview() {
    // ✅ EXISTING: Use API service
    await this.apiService.submitMatchDecisions(this.batchId, this.reviewDecisions);
    this.router.navigate(['/admin/batch', this.batchId, 'processing']);
  }
}
```

### **4. Processing Dashboard**

```typescript
@Component({
  selector: 'app-processing-dashboard',
  template: `
    <div class="processing-dashboard">
      <div class="dashboard-header">
        <h2>Batch Processing Status</h2>
        <bmb-badge [variant]="getStatusColor(batchStatus)">
          {{ batchStatus }}
        </bmb-badge>
      </div>
      
      <div class="progress-overview">
        <bmb-card class="progress-card">
          <h3>Overall Progress</h3>
          <bmb-progress-bar [value]="overallProgress"></bmb-progress-bar>
          <span>{{ processedFiles }} of {{ totalFiles }} files</span>
        </bmb-card>
        
        <bmb-card class="stats-card">
          <div class="stat-item">
            <bmb-icon name="check-circle" color="success"></bmb-icon>
            <span>{{ successCount }} Successful</span>
          </div>
          <div class="stat-item">
            <bmb-icon name="x-circle" color="error"></bmb-icon>
            <span>{{ errorCount }} Failed</span>
          </div>
          <div class="stat-item">
            <bmb-icon name="clock" color="warning"></bmb-icon>
            <span>{{ pendingCount }} Pending</span>
          </div>
        </bmb-card>
      </div>
      
      <bmb-card class="processing-log">
        <h3>Processing Log</h3>
        <div class="log-entries">
          <div *ngFor="let entry of processingLog" class="log-entry">
            <bmb-icon [name]="getStatusIcon(entry.status)"></bmb-icon>
            <div class="log-content">
              <strong>{{ entry.filename }}</strong>
              <span>{{ entry.message }}</span>
              <small>{{ entry.timestamp | date:'medium' }}</small>
            </div>
          </div>
        </div>
      </bmb-card>
      
      <div class="dashboard-actions" *ngIf="batchStatus === 'completed'">
        <bmb-button (click)="downloadReport()" variant="outline">
          Download Report
        </bmb-button>
        <bmb-button (click)="viewProcessedDocuments()" variant="primary">
          View Processed Documents
        </bmb-button>
      </div>
    </div>
  `
})
export class ProcessingDashboardComponent implements OnInit, OnDestroy {
  // ✅ EXISTING: Use streaming service for real-time updates
  constructor(
    private streamingService: StreamingService,
    private apiService: ApiService
  ) {}
  
  batchStatus: BatchStatus = 'processing';
  processingLog: LogEntry[] = [];
  
  ngOnInit() {
    // ✅ EXISTING: Use current streaming service
    this.streamingService.connectToBatch(this.batchId).subscribe(
      update => this.handleProcessingUpdate(update)
    );
  }
  
  handleProcessingUpdate(update: ProcessingUpdate) {
    // Handle real-time processing updates
  }
}
```

---

## 📱 **Mobile Responsive Design**

### **Responsive Breakpoints**
```scss
.admin-dashboard {
  // ✅ EXISTING: Use current responsive system
  @include respond-to-tablet {
    .dashboard-content {
      padding: 1rem;
    }
  }
  
  @include respond-to-mobile {
    .file-upload-zone {
      .drag-drop-area {
        height: 200px;
      }
    }
    
    .file-list {
      .file-item {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  }
}
```

---

## 🎨 **Bamboo Design System Integration**

### **Component Mapping**
| UI Element | Bamboo Component | Customization |
|------------|------------------|---------------|
| File Upload | `bmb-card` + custom drag-drop | Medical file icons |
| Progress Tracking | `bmb-progress-bar` | Real-time updates |
| Patient Matching | `bmb-radio-button` | Confidence badges |
| Status Dashboard | `bmb-badge` + `bmb-icon` | Status colors |
| Forms | `bmb-form-field` | TecSalud validation |

### **Custom Styling**
```scss
// Medical-specific extensions to Bamboo
.medical-admin-theme {
  --bmb-primary-color: #2196F3;
  --bmb-success-color: #4CAF50;
  --bmb-warning-color: #FF9800;
  --bmb-error-color: #F44336;
  
  .confidence-badge {
    &.high { background-color: var(--bmb-success-color); }
    &.medium { background-color: var(--bmb-warning-color); }
    &.low { background-color: var(--bmb-error-color); }
  }
}
```

---

## 🔄 **Integration with Existing Angular App**

### **Routing Integration**
```typescript
// ✅ EXISTING: Extend current routing
const adminRoutes: Routes = [
  {
    path: 'admin',
    component: AdminDashboardComponent,
    children: [
      { path: 'bulk-upload', component: BulkUploadComponent },
      { path: 'batch/:batchId/review', component: PatientMatchingReviewComponent },
      { path: 'batch/:batchId/processing', component: ProcessingDashboardComponent },
      { path: '', redirectTo: 'bulk-upload', pathMatch: 'full' }
    ]
  }
];
```

### **Service Integration**
```typescript
// ✅ EXISTING: Extend current API service
@Injectable()
export class ApiService {
  // ✅ EXISTING: Current methods unchanged
  
  // 🆕 NEW: Bulk upload methods
  async initiateBulkUpload(config: BulkUploadConfig): Promise<string> {
    return this.http.post<{batchId: string}>('/api/v1/documents/bulk/initiate', config)
      .toPromise().then(response => response.batchId);
  }
  
  async uploadFilesToBatch(batchId: string, files: File[]): Promise<void> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    
    return this.http.post(`/api/v1/documents/bulk/${batchId}/files`, formData)
      .toPromise();
  }
}
```

---

## 🎯 **Success Metrics**

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Upload Efficiency** | 15x faster than individual | Batch upload time vs individual |
| **Admin Productivity** | 90% reduction in manual work | Time spent on document processing |
| **Accuracy** | 95% correct patient matching | Match accuracy with fuzzy algorithm |
| **User Experience** | < 3 clicks to complete | UI interaction count |

---

## 🚀 **Implementation Timeline**

**Phase 1 (2 hours):** Basic upload interface  
**Phase 2 (3 hours):** Patient matching review  
**Phase 3 (2 hours):** Processing dashboard  
**Phase 4 (1 hour):** Mobile responsive design  

**Total with AI:** 8 hours (vs 16 hours manual)

---

## 📝 **Next Steps**

1. **TASK-DOC-004:** Implement TecSalud filename parsing service
2. **TASK-DOC-005:** Create patient matching backend logic
3. **TASK-DOC-006:** Build batch processing service

This UI design leverages **80% of existing Angular infrastructure** while providing powerful bulk upload capabilities for TecSalud administrators. 