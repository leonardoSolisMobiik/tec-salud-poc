# 🔗 API Endpoints Mapping & Extension Points

**Date:** 2025-01-07  
**Task:** TASK-DOC-001 - Analyze Current Document System  
**Purpose:** Map existing API endpoints and identify extension points for Enhanced Document Management

---

## 📊 **Current API Structure**

### **Base URL:** `http://localhost:8000/api/v1`

### **Existing Document Endpoints**

| Method | Endpoint | Function | Status | Enhancement Plan |
|--------|----------|----------|--------|------------------|
| POST | `/documents/upload` | Upload single document | ✅ EXTEND | Add `processing_type` parameter |
| GET | `/documents/` | List documents with filters | ✅ EXTEND | Add `storage_type` filter |
| GET | `/documents/{document_id}` | Get document details | ✅ REUSE | No changes needed |
| POST | `/documents/search` | Semantic search | ✅ REUSE | Perfect for vectorization |
| DELETE | `/documents/{document_id}` | Delete document | ✅ REUSE | Handle both storage types |

---

## 🔄 **Enhanced API Design**

### **1. Extended Upload Endpoint**

#### **Current Implementation**
```python
@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    patient_id: str = Form(...),
    document_type: str = Form("general"),
    title: Optional[str] = Form(None)
) -> Dict[str, Any]:
```

#### **Enhanced Implementation**
```python
@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    patient_id: str = Form(...),
    document_type: str = Form("general"),
    processing_type: str = Form("vectorized"),    # 🆕 NEW PARAMETER
    title: Optional[str] = Form(None),
    original_filename: Optional[str] = Form(None) # 🆕 NEW PARAMETER
) -> Dict[str, Any]:
```

#### **Processing Type Options**
- `"vectorized"` - Store in ChromaDB with chunking (existing flow)
- `"complete"` - Store full content in database (new flow)
- `"both"` - Both vectorization and complete storage

#### **Response Enhancement**
```json
{
    "document_id": "doc_123",
    "processing_type": "vectorized",
    "status": "success",
    "chunks_created": 5,           // Only for vectorized
    "content_stored": true,        // Only for complete
    "vectorization_time": "1.2s",
    "patient_matched": true,       // For filename-based uploads
    "patient_id": "patient_456"
}
```

### **2. Enhanced List Endpoint**

#### **Current Filters**
- `patient_id` - Filter by patient
- `document_type` - Filter by document type
- `limit` & `offset` - Pagination

#### **Enhanced Filters**
```python
@router.get("/")
async def list_documents(
    patient_id: Optional[str] = None,
    document_type: Optional[str] = None,
    processing_type: Optional[str] = None,  # 🆕 NEW FILTER
    storage_type: Optional[str] = None,     # 🆕 NEW FILTER ("vectorized", "complete", "both")
    created_after: Optional[datetime] = None, # 🆕 NEW FILTER
    limit: int = 20,
    offset: int = 0
) -> Dict[str, Any]:
```

#### **Enhanced Response**
```json
{
    "documents": [
        {
            "document_id": "doc_123",
            "title": "Consulta Cardiología",
            "document_type": "consulta",
            "processing_type": "both",
            "patient_id": "patient_456",
            "date": "2025-01-07T10:30:00Z",
            "file_size": 1024576,
            "has_vector_data": true,      // 🆕 NEW FIELD
            "has_complete_content": true, // 🆕 NEW FIELD
            "chunks_count": 5,            // 🆕 NEW FIELD
            "original_filename": "3000003799_GARZA TIJERINA, MARIA ESTHER_6001467010_CONS.pdf" // 🆕 NEW FIELD
        }
    ],
    "total": 15,
    "filters_applied": {
        "processing_type": "both",
        "storage_type": "vectorized"
    }
}
```

---

## 🆕 **New Admin Endpoints**

### **Bulk Upload Workflow**

#### **1. Initiate Bulk Upload**
```http
POST /documents/bulk/initiate
Content-Type: multipart/form-data

{
    "processing_type": "vectorized|complete|both",
    "auto_create_patients": true,
    "review_uncertain_matches": true
}
```

**Response:**
```json
{
    "batch_id": "batch_789",
    "status": "initiated",
    "max_files": 100,
    "allowed_types": [".pdf", ".docx", ".txt"]
}
```

#### **2. Upload Files to Batch**
```http
POST /documents/bulk/{batch_id}/files
Content-Type: multipart/form-data

files: [file1.pdf, file2.pdf, ...]
```

**Response:**
```json
{
    "batch_id": "batch_789",
    "files_received": 25,
    "files_parsed": 23,
    "parsing_errors": 2,
    "patients_matched": 20,
    "patients_to_create": 3,
    "uncertain_matches": 2,
    "ready_for_processing": false
}
```

#### **3. Review Uncertain Matches**
```http
GET /documents/bulk/{batch_id}/review
```

**Response:**
```json
{
    "batch_id": "batch_789",
    "uncertain_matches": [
        {
            "filename": "4000175978_CARDENAS GARZA, PEDRO JAVIER_2003091700_EMER.pdf",
            "parsed_patient": {
                "name": "CARDENAS GARZA, PEDRO JAVIER",
                "age": null
            },
            "possible_matches": [
                {
                    "patient_id": "patient_123",
                    "name": "Pedro Javier Cardenas Garza",
                    "confidence": 0.85
                },
                {
                    "patient_id": "patient_456", 
                    "name": "Pedro Cardenas",
                    "confidence": 0.65
                }
            ]
        }
    ]
}
```

#### **4. Submit Review Decisions**
```http
POST /documents/bulk/{batch_id}/review
Content-Type: application/json

{
    "decisions": [
        {
            "filename": "4000175978_CARDENAS GARZA, PEDRO JAVIER_2003091700_EMER.pdf",
            "action": "match",
            "patient_id": "patient_123"
        },
        {
            "filename": "other_file.pdf",
            "action": "create_new",
            "patient_data": {
                "name": "New Patient Name",
                "age": 45,
                "gender": "M"
            }
        }
    ]
}
```

#### **5. Start Batch Processing**
```http
POST /documents/bulk/{batch_id}/process
```

**Response:**
```json
{
    "batch_id": "batch_789",
    "status": "processing",
    "total_files": 25,
    "estimated_completion": "2025-01-07T11:15:00Z"
}
```

#### **6. Track Processing Status**
```http
GET /documents/bulk/{batch_id}/status
```

**Response:**
```json
{
    "batch_id": "batch_789",
    "status": "processing",
    "progress": {
        "total_files": 25,
        "processed_files": 18,
        "failed_files": 1,
        "remaining_files": 6,
        "completion_percentage": 72
    },
    "processing_stats": {
        "patients_created": 3,
        "documents_vectorized": 15,
        "documents_stored_complete": 18,
        "total_chunks_created": 89,
        "processing_time": "00:08:32"
    },
    "errors": [
        {
            "filename": "corrupted_file.pdf",
            "error": "File corrupted or unreadable",
            "timestamp": "2025-01-07T10:45:00Z"
        }
    ]
}
```

### **Patient Management Endpoints**

#### **Search/Match Patients**
```http
POST /patients/search-match
Content-Type: application/json

{
    "name": "GARZA TIJERINA, MARIA ESTHER",
    "age": 45,
    "gender": "F",
    "fuzzy_threshold": 0.8
}
```

**Response:**
```json
{
    "exact_matches": [],
    "fuzzy_matches": [
        {
            "patient_id": "patient_789",
            "name": "Maria Esther Garza Tijerina", 
            "confidence": 0.92,
            "age": 44,
            "gender": "F"
        }
    ],
    "create_new_recommended": false
}
```

---

## 🔍 **Enhanced Search Capabilities**

### **Advanced Document Search**
```http
POST /documents/search/advanced
Content-Type: application/json

{
    "query": "diabetes medication dosage",
    "filters": {
        "patient_id": "patient_123",
        "processing_type": "vectorized",
        "document_types": ["consulta", "receta_medica"],
        "date_range": {
            "start": "2024-01-01",
            "end": "2025-01-07"
        }
    },
    "search_options": {
        "include_vector_search": true,
        "include_full_text": true,
        "max_results": 10,
        "min_relevance": 0.7
    }
}
```

### **Patient Context Retrieval**
```http
GET /documents/patient/{patient_id}/context
?include_vectorized=true
&include_complete=true
&max_documents=10
&relevance_threshold=0.8
```

---

## 🔒 **Authentication & Authorization**

### **Admin Endpoints Security**
All bulk upload endpoints require admin role:
```http
Authorization: Bearer <admin_jwt_token>
X-Admin-Role: bulk_uploader
```

### **User Endpoints Security**
Standard user endpoints require patient access:
```http
Authorization: Bearer <user_jwt_token>
X-Patient-Access: patient_123
```

---

## 📊 **Monitoring & Analytics Endpoints**

### **System Health**
```http
GET /documents/health
```

**Response:**
```json
{
    "vector_database": {
        "status": "healthy",
        "document_count": 1523,
        "collection_size": "2.3GB"
    },
    "document_storage": {
        "status": "healthy", 
        "documents_complete": 1200,
        "documents_vectorized": 1523,
        "documents_both": 1100
    },
    "processing_queue": {
        "active_batches": 2,
        "pending_files": 15,
        "processing_rate": "3.2 files/minute"
    }
}
```

### **Usage Analytics**
```http
GET /documents/analytics
?date_range=last_30_days
&breakdown=processing_type
```

---

## 🔄 **Migration Strategy**

### **Backward Compatibility**
1. **All existing endpoints** continue to work unchanged
2. **Default parameters** maintain current behavior
3. **Response formats** are extended, not replaced
4. **Database migrations** are additive only

### **Deployment Strategy**
1. **Phase 1:** Deploy extended endpoints with default values
2. **Phase 2:** Add new bulk upload endpoints
3. **Phase 3:** Enable new parameters in existing endpoints
4. **Phase 4:** Add analytics and monitoring endpoints

---

## 🎯 **Testing Strategy**

### **Endpoint Testing**
- ✅ Regression tests for all existing endpoints
- 🆕 New tests for enhanced parameters
- 🆕 Integration tests for bulk upload workflow
- 🆕 Performance tests for large batch processing

### **Load Testing**
- 📊 Bulk upload of 100 files simultaneously
- 📊 Concurrent search operations
- 📊 Database performance under dual storage load

---

## 📝 **Implementation Priority**

### **Week 1**
1. Extend upload endpoint with `processing_type`
2. Extend list endpoint with new filters
3. Add patient search/match endpoint

### **Week 2**
4. Implement bulk upload workflow endpoints
5. Add batch processing status tracking
6. Create admin review interface endpoints

This API design maintains full backward compatibility while adding powerful new capabilities for dual processing and admin bulk workflows. 