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
      overflow-x: hidden;
    }
    
    .main-content {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      transition: margin-left 0.3s ease;
      width: 100%;
    }
    
    .page-content {
      flex: 1;
      padding: var(--bmb-spacing-l, 1.5rem);
      overflow-y: auto;
      overflow-x: hidden;
      position: relative;
      min-height: calc(100vh - 64px);
    }
    
    /* 📱 MOBILE STYLES - TASK-UI-004 */
    @media (max-width: 767px) {
      .main-content {
        margin-left: 0 !important;
        width: 100% !important;
        max-width: 100vw !important;
      }
      
      .page-content {
        padding: var(--bmb-spacing-m, 1rem);
        min-height: calc(100vh - 70px);
        
        /* Touch scroll optimization */
        -webkit-overflow-scrolling: touch;
        scroll-behavior: smooth;
      }
      
      .app-shell {
        overflow-x: hidden !important;
      }
    }
    
    /* 📱 TABLET STYLES - TASK-UI-004 OPTIMIZACIÓN */
    @media (min-width: 768px) and (max-width: 1024px) {
      .main-content {
        margin-left: var(--sidebar-width-tablet, 280px) !important;
        transition: margin-left 0.3s ease;
      }
      
      .page-content {
        padding: var(--bmb-spacing-l, 1.5rem);
        min-height: calc(100vh - 72px);
      }
    }
    
    /* 📱 DESKTOP STYLES - TASK-UI-004 */
    @media (min-width: 1025px) {
      .main-content {
        margin-left: var(--sidebar-width-desktop, 320px) !important;
      }
      
      .page-content {
        padding: var(--bmb-spacing-xl, 2rem);
        min-height: calc(100vh - 74px);
      }
    }
    
    /* 🖱️ TOUCH DEVICE OPTIMIZATIONS - TASK-UI-004 */
    @media (hover: none) and (pointer: coarse) {
      .page-content {
        /* Improve touch scrolling */
        -webkit-overflow-scrolling: touch;
        scroll-behavior: smooth;
        touch-action: pan-y;
      }
      
      .app-shell {
        /* Prevent overscroll bounce */
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
      }
    }
    
    /* 📱 LANDSCAPE ORIENTATION - TASK-UI-004 */
    @media (max-width: 1024px) and (orientation: landscape) {
      .page-content {
        padding: var(--bmb-spacing-s, 0.75rem) var(--bmb-spacing-m, 1rem);
      }
    }
    
    /* 📱 SAFE AREA SUPPORT - TASK-UI-004 */
    @supports (padding: max(0px)) {
      .page-content {
        padding-left: max(var(--bmb-spacing-m, 1rem), env(safe-area-inset-left));
        padding-right: max(var(--bmb-spacing-m, 1rem), env(safe-area-inset-right));
        padding-bottom: max(var(--bmb-spacing-m, 1rem), env(safe-area-inset-bottom));
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