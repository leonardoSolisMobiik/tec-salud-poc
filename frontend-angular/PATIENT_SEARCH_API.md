# Patient Search API Integration

## Overview
This document describes the integration of the patient search API endpoint with the TecSalud frontend application. The API now returns document-based search results which are converted to patient objects in the frontend.

## API Endpoint
- **URL**: `http://localhost:8000/api/v1/search/patients`
- **Method**: GET
- **Authentication**: Uses HTTP interceptor for automatic headers
- **Response**: Returns documents that are converted to patient objects

## ⚠️ Important Changes
- **Deprecated**: The old `/api/v1/patients/` endpoint is no longer available
- **New**: All patient queries must now use the `/api/v1/search/patients` endpoint
- **User ID Required**: All requests now require a `user_id` parameter
- **Document-Based**: API returns documents which are converted to patients in the frontend

## Required Parameters

### user_id (Required)
- **Type**: string
- **Description**: User ID for authentication and authorization
- **Example**: `pedro`

### search_term (Required)
- **Type**: string
- **Description**: Search query to find patients by name, ID, or medical record number
- **Example**: `maria`, `Juan Pérez`, `MR-123456`

## Optional Parameters

### limit
- **Type**: number
- **Default**: 20
- **Description**: Maximum number of results to return
- **Range**: 1-100

### skip
- **Type**: number
- **Default**: 0
- **Description**: Number of results to skip for pagination

### min_similarity
- **Type**: number
- **Default**: 0.3
- **Description**: Minimum similarity score for fuzzy matching
- **Range**: 0.0-1.0

### include_score
- **Type**: boolean
- **Default**: true
- **Description**: Whether to include similarity scores in response

## Complete API URL Example
```
http://localhost:8000/api/v1/search/patients?user_id=pedro&search_term=maria&limit=20&skip=0&min_similarity=0.3&include_score=true
```

## API Response Format

The API returns a `DocumentSearchResponse` with the following structure:

```typescript
interface DocumentSearchResponse {
  search_term: string;
  normalized_term: string;
  total_found: number;
  documents: PatientDocument[];
  limit: number;
  skip: number;
  returned_count: number;
  has_next: boolean;
  has_prev: boolean;
  current_page: number;
  total_pages: number;
  search_strategies_used: string[];
  min_similarity_threshold: number;
  search_timestamp: string;
}
```

### Document Structure
Each document contains:
- **Medical Information**: `expediente`, `nombre_paciente`, `numero_episodio`, `categoria`
- **File Information**: `filename`, `content_type`, `file_size`, `storage_info`
- **Extracted Content**: `extracted_text` with medical data
- **Search Metadata**: `similarity_score`, `match_type`
- **Processing Info**: `processing_status`, `batch_info`

## Frontend Implementation

### Document to Patient Conversion
The frontend automatically converts documents to patient objects by:

1. **Grouping**: Documents are grouped by `expediente` (medical record number)
2. **Extraction**: Patient information is extracted from the `extracted_text`:
   - **Name**: From `nombre_paciente` field
   - **Age**: Extracted from "Edad: XX" pattern
   - **Gender**: Extracted from "Sexo: Mujer/Hombre" pattern
   - **Birth Date**: Extracted from "Fecha de nacimiento: DD-MMM-YYYY" pattern
   - **Phone**: Extracted from "Teléfono: XXXXXXXXXX" pattern
3. **Aggregation**: Multiple documents per patient are stored in the `documents` array
4. **Scoring**: Highest similarity score among documents is used for the patient

### ApiService Methods

#### searchPatients()
```typescript
searchPatients(
  userId: string,
  query: string,
  limit: number = 20,
  skip: number = 0,
  minSimilarity: number = 0.3,
  includeScore: boolean = true
): Observable<Patient[]>
```

**Example Usage:**
```typescript
// Basic search
this.apiService.searchPatients('pedro', 'maria').subscribe(patients => {
  console.log(`Found ${patients.length} patients matching "maria"`);
  patients.forEach(patient => {
    console.log(`${patient.name} (${patient.age} años) - ${patient.documents?.length} documentos`);
  });
});

// Advanced search with parameters
this.apiService.searchPatients('pedro', 'Andrea', 10, 0, 0.5, true).subscribe(patients => {
  console.log('Search results with scores:', patients);
});
```

#### searchPatientsWithParams()
```typescript
searchPatientsWithParams(searchParams: PatientSearchParams): Observable<Patient[]>
```

**Example Usage:**
```typescript
const params: PatientSearchParams = {
  user_id: 'pedro',
  search_term: 'maria',
  limit: 10,
  skip: 0,
  min_similarity: 0.5,
  include_score: true
};

this.apiService.searchPatientsWithParams(params).subscribe(patients => {
  console.log('Search results:', patients);
});
```

### Patient Object Structure
After conversion, each patient object contains:

```typescript
interface Patient {
  id: string;                    // expediente
  name: string;                  // nombre_paciente
  age: number;                   // extracted from text
  gender: 'M' | 'F' | 'Otro';    // extracted from text
  birth_date: string;            // extracted and converted to ISO format
  phone?: string;                // extracted from text
  medical_record_number?: string; // expediente
  similarity_score?: number;      // highest score among documents
  match_type?: string;           // best match type
  documents?: PatientDocument[]; // all associated documents
  created_at?: string;
  updated_at?: string;
}
```

## Current Implementation Status

### User Authentication
Currently using a default user ID (`pedro`) as configured. This is handled in:
- `MedicalStateService.searchPatients()`
- `AppComponent.searchPatients()`

### Recent Patients Handling
Recent patients are now loaded from localStorage only, since the backend doesn't provide a dedicated "recent patients" endpoint. The system will:
1. Load recent patients from localStorage on app startup
2. Add patients to recent list when they are selected
3. Persist recent patients to localStorage automatically

### Error Handling
The API service includes comprehensive error handling:
- Timeout: 30 seconds
- Retry: 3 attempts
- Response format normalization
- Debug logging in development mode
- Document to patient conversion errors

### Integration Points
1. **MedicalStateService**: Handles search state management
2. **SidebarComponent**: Triggers search from UI
3. **AppComponent**: Direct API integration for search functionality

## Testing
Test the integration by:
1. Starting the backend server on `http://localhost:8000`
2. Running the Angular development server
3. Using the search functionality in the sidebar
4. Checking browser console for request/response logs
5. Verifying patient conversion from documents

## Example Search Results

When searching for "maria", the API returns documents and the frontend converts them to patients:

```typescript
// API Response (simplified)
{
  "search_term": "maria",
  "total_found": 3,
  "documents": [
    {
      "expediente": "3000017135",
      "nombre_paciente": "MARTINEZ SERRANO, MARIA CRISTINA",
      "extracted_text": "Edad: 70\nSexo: Mujer\nFecha de nacimiento: 23-Ene-1954\nTeléfono: 8113276706",
      "similarity_score": 1,
      "match_type": "substring"
    }
    // ... more documents
  ]
}

// Frontend Conversion Result
[
  {
    "id": "3000017135",
    "name": "MARTINEZ SERRANO, MARIA CRISTINA",
    "age": 70,
    "gender": "F",
    "birth_date": "1954-01-23",
    "phone": "8113276706",
    "medical_record_number": "3000017135",
    "similarity_score": 1,
    "match_type": "substring",
    "documents": [/* associated documents */]
  }
  // ... more patients
]
```

## Troubleshooting

### Common Issues
1. **404 Error on `/api/v1/patients/`**: This endpoint no longer exists. Update code to use `/api/v1/search/patients`
2. **USER_ID_REQUIRED Error**: All requests now require a `user_id` parameter
3. **Empty Recent Patients**: Recent patients are loaded from localStorage only
4. **Missing Patient Data**: Check if document extraction patterns match the actual text format

### Migration Guide
If you have existing code using the old `getPatients()` method:

```typescript
// OLD (will cause 404 error)
this.apiService.getPatients(1, 20).subscribe(result => {
  console.log('Patients:', result.patients);
});

// NEW (correct approach)
this.apiService.searchPatients('pedro', '', 20, 0).subscribe(patients => {
  console.log('Patients:', patients);
});
```

## Future Enhancements
- Replace default user ID with actual authentication
- Add user session management
- Implement proper authorization checks
- Add search result caching
- Implement search analytics
- Add dedicated recent patients endpoint
- Add patient list pagination support
- Improve text extraction patterns for better data quality
- Add document preview functionality
- Implement patient document management features 
