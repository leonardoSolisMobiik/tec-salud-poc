import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Subject, takeUntil, Observable } from 'rxjs';
import { UiStateService } from '@core/services';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { ToastContainerComponent } from '../../toast-container/toast-container.component';
import { GlobalLoaderComponent } from '../../global-loader/global-loader.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SidebarComponent,
    HeaderComponent,
    ToastContainerComponent,
    GlobalLoaderComponent
  ],
  template: `
    <div class="app-shell" [class.sidebar-open]="isSidebarOpen$ | async">
      <!-- Global Components -->
      <app-toast-container></app-toast-container>
      <app-global-loader></app-global-loader>
      
      <!-- Sidebar -->
      <app-sidebar></app-sidebar>
      
      <!-- Main Content Area -->
      <div class="main-content" [style.marginLeft.px]="sidebarWidth$ | async">
        <!-- Header -->
        <app-header></app-header>
        
        <!-- Page Content -->
        <div class="page-content">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .app-shell {
      min-height: 100vh;
      background-color: var(--medical-background);
      position: relative;
    }
    
    .main-content {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      transition: margin-left 0.3s ease;
    }
    
    .page-content {
      flex: 1;
      padding: 1.5rem;
      overflow-y: auto;
    }
    
    /* Mobile Styles */
    @media (max-width: 768px) {
      .main-content {
        margin-left: 0 !important;
      }
      
      .page-content {
        padding: 1rem;
      }
    }
    
    /* Tablet Styles */
    @media (min-width: 768px) and (max-width: 1024px) {
      .page-content {
        padding: 1.25rem;
      }
    }
  `]
})
export class AppShellComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  isSidebarOpen$!: Observable<boolean>;
  sidebarWidth$!: Observable<number>;
  
  constructor(private uiState: UiStateService) {
    this.isSidebarOpen$ = this.uiState.isSidebarOpen$;
    this.sidebarWidth$ = this.uiState.sidebarWidth$;
  }
  
  ngOnInit(): void {
    // Initialize any app-wide settings or listeners
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}