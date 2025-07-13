import { Routes } from '@angular/router';

/**
 * Application routing configuration for TecSalud Medical Assistant
 * 
 * @description Defines all application routes with lazy loading for optimal performance.
 * Includes main medical workflows: dashboard, chat, patient management, and document handling.
 * 
 * @example
 * ```typescript
 * // Routes are used in app.config.ts
 * import { routes } from './app.routes';
 * 
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideRouter(routes)
 *   ]
 * };
 * ```
 * 
 * @routes
 * - `/` - Redirects to dashboard
 * - `/dashboard` - Main dashboard with system overview
 * - `/chat` - Medical AI chat interface
 * - `/patients` - Patient management system
 * - `/documents` - Document upload and processing
 * - `/admin-bulk-upload` - Administrative bulk operations
 * 
 * @since 1.0.0
 */
export const routes: Routes = [
  /** Root path redirect to dashboard */
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  
  /** Dashboard - Main overview interface */
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  
  /** Medical Chat - AI-powered medical consultation interface */
  {
    path: 'chat',
    loadComponent: () => import('./features/medical-chat/medical-chat.component').then(m => m.MedicalChatComponent)
  },
  
  /** Patient Management - CRUD operations for patient records */
  {
    path: 'patients',
    loadComponent: () => import('./features/patient-management/patient-management.component').then(m => m.PatientManagementComponent)
  },
  
  /** Document Upload - Medical document processing and vectorization */
  {
    path: 'documents',
    loadComponent: () => import('./features/document-viewer/document-upload.component').then(m => m.DocumentUploadComponent)
  },
  
  /** DISABLED: Document Management - View and manage processed documents */
  /*
  {
    path: 'documents/list',
    loadComponent: () => import('./features/document-viewer/document-list.component').then(m => m.DocumentListComponent)
  },
  */
  
  /** Administrative Bulk Upload - Batch processing for medical data */
  {
    path: 'admin-bulk-upload',
    loadComponent: () => import('./features/admin-bulk-upload/admin-bulk-upload.component').then(m => m.AdminBulkUploadComponent)
  },
  
  /** Wildcard route - Redirect any unmatched paths to dashboard */
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
