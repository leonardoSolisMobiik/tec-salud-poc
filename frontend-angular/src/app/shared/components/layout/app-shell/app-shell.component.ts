import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Subject, takeUntil, Observable } from 'rxjs';
import { UiStateService } from '@core/services';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { ToastContainerComponent } from '../../toast-container/toast-container.component';
import { GlobalLoaderComponent } from '../../global-loader/global-loader.component';

/**
 * Application Shell Component providing main layout structure
 *
 * @description Core layout component that provides the main application structure
 * including sidebar, header, router outlet, and global UI components. Features
 * responsive design with optimized layouts for mobile, tablet, and desktop.
 *
 * @example
 * ```typescript
 * // Used as root layout in app routing
 * <app-shell></app-shell>
 *
 * // Automatically provides:
 * // - Responsive sidebar layout
 * // - Header navigation
 * // - Router outlet for page content
 * // - Global loader overlay
 * // - Toast notifications container
 * ```
 *
 * @features
 * - Responsive layout with breakpoint-specific optimizations
 * - Sidebar with collapsible behavior
 * - Header navigation integration
 * - Router outlet for page routing
 * - Global loading states and notifications
 * - Touch device optimizations
 * - Safe area support for mobile devices
 * - Landscape orientation handling
 *
 * @responsive
 * - Mobile (< 768px): Full-width layout, hidden sidebar
 * - Tablet (768px - 1024px): Reduced sidebar width
 * - Desktop (> 1024px): Full sidebar layout
 *
 * @accessibility
 * - Touch scrolling optimizations
 * - Safe area padding for notched devices
 * - Overscroll behavior controls
 *
 * @since 1.0.0
 */
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
      min-height: calc(100vh - 80px); /* Increased from 64px to 80px for header space */
      margin-top: 0; /* Ensure no overlap */
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
        min-height: calc(100vh - 90px); /* Increased for mobile header */

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
        min-height: calc(100vh - 85px); /* Adjusted for tablet header */
      }
    }

    /* 📱 DESKTOP STYLES - TASK-UI-004 */
    @media (min-width: 1025px) {
      .main-content {
        margin-left: var(--sidebar-width-desktop, 320px) !important;
      }

      .page-content {
        padding: var(--bmb-spacing-xl, 2rem);
        min-height: calc(100vh - 88px); /* Adjusted for desktop header */
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
  /** Subject for component cleanup */
  private destroy$ = new Subject<void>();

  /** Observable for sidebar open/closed state */
  isSidebarOpen$!: Observable<boolean>;

  /** Observable for sidebar width in pixels */
  sidebarWidth$!: Observable<number>;

  /**
   * Creates an instance of AppShellComponent
   *
   * @param uiState - UI state service for layout state management
   *
   * @description Initializes the component with UI state observables
   * for responsive sidebar behavior and layout management.
   */
  constructor(private uiState: UiStateService) {
    this.isSidebarOpen$ = this.uiState.isSidebarOpen$;
    this.sidebarWidth$ = this.uiState.sidebarWidth$;
  }

  /**
   * Component initialization lifecycle hook
   *
   * @description Initializes app-wide settings and listeners.
   * Currently minimal as layout is primarily reactive to UI state service.
   */
  ngOnInit(): void {
    // Initialize any app-wide settings or listeners
  }

  /**
   * Component destruction lifecycle hook
   *
   * @description Cleans up subscriptions and prevents memory leaks
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
