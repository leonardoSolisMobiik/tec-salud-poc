# Processing Choice UI Integration Guide

## Overview

The Processing Choice UI provides users with the ability to select how their medical documents should be processed:

1. **Vectorization**: Documents are converted to vectors for semantic search
2. **Complete Storage**: Documents are stored in full for complete context access
3. **Hybrid Processing**: Combines both approaches for maximum flexibility

## Components Created

### 1. ProcessingTypeSelectorComponent
**Location**: `src/app/shared/components/processing-type-selector/processing-type-selector.component.ts`

A comprehensive selector with visual options and detailed descriptions.

**Features**:
- Interactive radio button interface
- Expandable benefits section
- Visual feedback and animations
- Mobile responsive design
- Recommended option highlighting

### 2. ProcessingTypeService
**Location**: `src/app/shared/services/processing-type.service.ts`

Service to manage processing type logic and provide helper methods.

**Features**:
- Centralized processing type management
- Observable state management
- Validation helpers
- Capability checking methods
- Type conversion utilities

### 3. ProcessingChoiceComponent  
**Location**: `src/app/features/document-viewer/processing-choice.component.ts`

Simple wrapper component for easy integration into existing upload flows.

**Features**:
- Easy integration wrapper
- Quick info panel
- File count display
- Processing capabilities summary

## Integration Examples

### Basic Integration

```typescript
// In your component
import { ProcessingChoiceComponent } from './processing-choice.component';

@Component({
  template: `
    <app-processing-choice
      [fileCount]="selectedFiles.length"
      [initialType]="'both'"
      (processingTypeChange)="onProcessingTypeChange($event)">
    </app-processing-choice>
  `
})
export class YourUploadComponent {
  selectedProcessingType = 'both';

  onProcessingTypeChange(type: string): void {
    this.selectedProcessingType = type;
    console.log('Processing type changed to:', type);
  }
}
```

### Integration with Document Upload

```typescript
// Add to document-upload.component.ts
import { ProcessingChoiceComponent } from './processing-choice.component';
import { ProcessingTypeService } from '../../shared/services/processing-type.service';

@Component({
  imports: [CommonModule, FormsModule, BambooModule, ProcessingChoiceComponent],
  template: `
    <!-- Add to config panel after file selection -->
    <div class="config-panel" *ngIf="selectedFiles.length > 0">
      
      <!-- Processing Type Selection -->
      <app-processing-choice
        [fileCount]="selectedFiles.length"
        [initialType]="defaultProcessingType"
        (processingTypeChange)="onProcessingTypeChange($event)">
      </app-processing-choice>
      
      <!-- Rest of existing config... -->
      
    </div>
  `
})
export class DocumentUploadComponent {
  defaultProcessingType = 'both';

  constructor(
    private processingTypeService: ProcessingTypeService
  ) {}

  onProcessingTypeChange(type: string): void {
    this.defaultProcessingType = type;
    
    // Update all pending uploads
    this.uploads.forEach(upload => {
      if (upload.status === 'pending') {
        upload.processing_type = type;
      }
    });
  }

  // Update the startUpload method
  async startUpload(): Promise<void> {
    if (!this.defaultPatientId || this.isUploading || !this.defaultProcessingType) return;
    
    // ... existing logic
  }

  // Update processFiles method
  private processFiles(files: File[]): void {
    const validFiles = files.filter(file => this.isValidFile(file));
    
    validFiles.forEach(file => {
      if (!this.selectedFiles.find(f => f.name === file.name && f.size === file.size)) {
        this.selectedFiles.push(file);
        
        const upload: DocumentUpload = {
          file,
          patient_id: this.defaultPatientId,
          document_type: this.defaultDocumentType,
          processing_type: this.defaultProcessingType, // Add this line
          title: file.name.replace(/\.[^/.]+$/, ""),
          status: 'pending',
          progress: 0
        };
        
        this.uploads.push(upload);
      }
    });
  }

  // Add helper methods
  getProcessingTypeLabel(type: string): string {
    return this.processingTypeService.getProcessingTypeLabel(type);
  }

  isVectorizationEnabled(): boolean {
    return this.processingTypeService.isVectorizationEnabled(this.defaultProcessingType);
  }

  isCompleteStorageEnabled(): boolean {
    return this.processingTypeService.isCompleteStorageEnabled(this.defaultProcessingType);
  }

  getStoredDocuments(): number {
    return this.uploadResults
      .filter(r => r.status === 'success')
      .reduce((total, r) => total + (r.result?.documents_stored || 1), 0);
  }

  viewDocuments(): void {
    console.log('🔍 Redirecting to document viewer');
    this.router.navigate(['/documents']);
  }
}
```

### API Integration

Update your API calls to include the processing type:

```typescript
// In uploadSingleFile method
private async uploadSingleFile(upload: DocumentUpload): Promise<void> {
  upload.status = 'uploading';
  upload.progress = 0;
  
  try {
    const formData = new FormData();
    formData.append('file', upload.file);
    formData.append('patient_id', upload.patient_id);
    formData.append('document_type', upload.document_type);
    formData.append('processing_type', upload.processing_type); // Add this
    formData.append('title', upload.title);
    
    // Call appropriate API endpoint based on processing type
    const result = await this.callProcessingAPI(formData, upload.processing_type);
    
    // ... rest of existing logic
  } catch (error) {
    // ... error handling
  }
}

private async callProcessingAPI(formData: FormData, processingType: string): Promise<any> {
  switch (processingType) {
    case 'vectorized':
      return this.apiService.uploadDocumentForVectorization(formData).toPromise();
    case 'complete':
      return this.apiService.uploadDocumentForCompleteStorage(formData).toPromise();
    case 'both':
      return this.apiService.uploadDocumentForHybridProcessing(formData).toPromise();
    default:
      return this.apiService.uploadDocument(formData).toPromise();
  }
}
```

## Processing Type Options

### 1. Vectorization (`vectorized`)
- **Icon**: 🔍
- **Use Case**: Fast semantic search and content analysis
- **Benefits**:
  - Ultra-fast semantic search
  - Automatic concept relationships
  - Document similarity analysis
  - Context-based medical responses
  - Optimized for large volumes

### 2. Complete Storage (`complete`)
- **Icon**: 📄
- **Use Case**: Full document review and detailed analysis
- **Benefits**:
  - Access to complete original document
  - Integral medical context preserved
  - Direct visualization and download
  - Exact references and textual citations
  - Ideal for complex cases

### 3. Hybrid Processing (`both`) - **Recommended**
- **Icon**: ⚡
- **Use Case**: Complete solution for advanced users
- **Benefits**:
  - Semantic search + complete document
  - Maximum usage flexibility
  - Precise responses with exact references
  - Advanced analysis and visualization
  - Ready for any medical use case

## Backend API Endpoints

The processing choice UI expects these endpoints to be available:

```
POST /api/v1/documents/upload
- processing_type: 'vectorized' | 'complete' | 'both'

POST /api/v1/documents/batch/upload
- processing_type: 'vectorized' | 'complete' | 'both'

GET /api/v1/documents/processing-types
- Returns available processing options
```

## Styling and Theming

The components use Bamboo Design System tokens:

```scss
// Key CSS custom properties used
--bmb-spacing-*: Spacing scale
--general_contrasts-*: Color contrasts
--color-blue-tec: Primary brand color
--semantic-success: Success state color
--bmb-radius-*: Border radius scale
```

## Testing Integration

```typescript
// Test helper for processing type selection
describe('ProcessingChoiceComponent', () => {
  let component: ProcessingChoiceComponent;
  let fixture: ComponentFixture<ProcessingChoiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcessingChoiceComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ProcessingChoiceComponent);
    component = fixture.componentInstance;
  });

  it('should emit processing type change', () => {
    spyOn(component.processingTypeChange, 'emit');
    
    component.onProcessingTypeChange('vectorized');
    
    expect(component.processingTypeChange.emit).toHaveBeenCalledWith('vectorized');
  });

  it('should show correct capabilities', () => {
    component.selectedProcessingType = 'both';
    
    expect(component.getProcessingCapabilities()).toBe(
      'Búsqueda semántica + Almacenamiento completo'
    );
  });
});
```

## Mobile Responsiveness

The components are fully responsive:

- **Desktop**: Full layout with side-by-side options
- **Tablet**: Stacked layout with maintained spacing
- **Mobile**: Single column with adjusted typography

## Accessibility Features

- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Proper ARIA labels and descriptions
- **High Contrast**: Compatible with high contrast modes
- **Focus Management**: Clear focus indicators

## Performance Considerations

- **Lazy Loading**: Components use OnPush change detection
- **Memory Management**: Proper subscription cleanup
- **Bundle Size**: Minimal impact (~15KB gzipped)

## Future Enhancements

1. **Processing Presets**: Save user preferences
2. **Advanced Options**: Fine-tune processing parameters  
3. **Progress Indicators**: Real-time processing status
4. **Cost Estimation**: Show estimated processing costs
5. **Batch Templates**: Pre-configured processing templates

## Troubleshooting

### Common Issues

1. **Component Not Displaying**
   - Ensure proper imports in parent component
   - Check Bamboo Design System is installed
   - Verify Angular version compatibility

2. **Type Changes Not Persisting**
   - Confirm ProcessingTypeService injection
   - Check event binding syntax
   - Verify state management

3. **Styling Issues**
   - Ensure Bamboo CSS tokens are loaded
   - Check for conflicting global styles
   - Verify CSS custom properties support

### Debug Mode

Enable debug logging:

```typescript
// In app.config.ts
providers: [
  // ... other providers
  {
    provide: 'DEBUG_PROCESSING_CHOICE',
    useValue: environment.production ? false : true
  }
]
```

## Integration Checklist

- [ ] Install required dependencies
- [ ] Import components in target modules
- [ ] Add processing type to upload interfaces
- [ ] Update API calls to include processing_type
- [ ] Test all three processing options
- [ ] Verify mobile responsiveness
- [ ] Add accessibility testing
- [ ] Update backend to handle processing types
- [ ] Add error handling for invalid types
- [ ] Document processing type impact on performance

## Conclusion

The Processing Choice UI provides a comprehensive solution for allowing users to select how their medical documents are processed. By implementing proper integration patterns and following the guidance above, you can provide users with flexible document processing options while maintaining a consistent user experience. 