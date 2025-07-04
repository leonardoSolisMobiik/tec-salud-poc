import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'chat',
    loadComponent: () => import('./features/medical-chat/medical-chat.component').then(m => m.MedicalChatComponent)
  },
  {
    path: 'patients',
    loadComponent: () => import('./features/patient-management/patient-management.component').then(m => m.PatientManagementComponent)
  },
  {
    path: 'test-bamboo',
    loadComponent: () => import('./shared/components/test-bamboo/test-bamboo.component').then(m => m.TestBambooComponent)
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
