import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent } from 'rxjs';
import { map, distinctUntilChanged, throttleTime } from 'rxjs/operators';

/**
 * Interface for toast notification objects
 * 
 * @interface Toast
 * @description Defines the structure for toast notifications in the application
 */
export interface Toast {
  /** Unique identifier for the toast */
  id: string;
  /** Message content to display */
  message: string;
  /** Type of toast that determines styling */
  type: 'success' | 'error' | 'warning' | 'info';
  /** Duration in milliseconds before auto-removal (0 = no auto-removal) */
  duration?: number;
}

/**
 * Interface for the complete UI state
 * 
 * @interface UIState
 * @description Centralized UI state management for responsive design, modals, loading states, etc.
 */
interface UIState {
  /** Responsive states */
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  
  /** Sidebar states */
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  
  /** Modal/Dialog states */
  activeModal: string | null;
  modalData: any;
  
  /** Loading states */
  globalLoading: boolean;
  loadingTasks: Set<string>;
  
  /** Toast notifications */
  toasts: Toast[];
  
  /** View states */
  activeView: 'dashboard' | 'chat' | 'patients' | 'documents';
  
  /** PDF Viewer */
  isPdfViewerOpen: boolean;
  activePdfUrl: string | null;
}

/**
 * Service for managing UI state and responsive behavior
 * 
 * @description Centralized management of UI state including responsive breakpoints,
 * sidebar state, modals, loading indicators, toast notifications, and view management.
 * Automatically handles responsive state changes and provides reactive observables.
 * 
 * @example
 * ```typescript
 * constructor(private uiState: UiStateService) {}
 * 
 * // Subscribe to responsive changes
 * this.uiState.isMobile$.subscribe(isMobile => {
 *   console.log('Is mobile:', isMobile);
 * });
 * 
 * // Show toast notification
 * this.uiState.showSuccessToast('Operation completed successfully');
 * 
 * // Toggle sidebar
 * this.uiState.toggleSidebar();
 * 
 * // Start loading indicator
 * this.uiState.startLoading('data-fetch');
 * ```
 * 
 * @since 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class UiStateService {
  /** Mobile breakpoint threshold in pixels */
  private readonly MOBILE_BREAKPOINT = 768;
  
  /** Tablet breakpoint threshold in pixels */
  private readonly TABLET_BREAKPOINT = 1024;
  
  /** Desktop breakpoint threshold in pixels */
  private readonly DESKTOP_BREAKPOINT = 1200;

  /** Initial state configuration */
  private readonly initialState: UIState = {
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenWidth: window.innerWidth,
    isSidebarOpen: true,
    isSidebarCollapsed: false,
    activeModal: null,
    modalData: null,
    globalLoading: false,
    loadingTasks: new Set(),
    toasts: [],
    activeView: 'dashboard',
    isPdfViewerOpen: false,
    activePdfUrl: null
  };

  /** Internal state subject for reactive state management */
  private state$ = new BehaviorSubject<UIState>(this.initialState);

  /** Observable for mobile state changes */
  public readonly isMobile$ = this.state$.pipe(
    map(state => state.isMobile),
    distinctUntilChanged()
  );

  /** Observable for tablet state changes */
  public readonly isTablet$ = this.state$.pipe(
    map(state => state.isTablet),
    distinctUntilChanged()
  );

  /** Observable for desktop state changes */
  public readonly isDesktop$ = this.state$.pipe(
    map(state => state.isDesktop),
    distinctUntilChanged()
  );

  /** Observable for sidebar open state changes */
  public readonly isSidebarOpen$ = this.state$.pipe(
    map(state => state.isSidebarOpen),
    distinctUntilChanged()
  );

  /** Observable for sidebar collapsed state changes */
  public readonly isSidebarCollapsed$ = this.state$.pipe(
    map(state => state.isSidebarCollapsed),
    distinctUntilChanged()
  );

  /** Observable for active modal changes */
  public readonly activeModal$ = this.state$.pipe(
    map(state => state.activeModal),
    distinctUntilChanged()
  );

  /** Observable for loading state changes */
  public readonly isLoading$ = this.state$.pipe(
    map(state => state.globalLoading || state.loadingTasks.size > 0),
    distinctUntilChanged()
  );

  /** Observable for toast notifications changes */
  public readonly toasts$ = this.state$.pipe(
    map(state => state.toasts),
    distinctUntilChanged()
  );

  /** Observable for active view changes */
  public readonly activeView$ = this.state$.pipe(
    map(state => state.activeView),
    distinctUntilChanged()
  );

  /** Observable for sidebar width changes */
  public readonly sidebarWidth$ = this.state$.pipe(
    map(state => {
      if (!state.isSidebarOpen) return 0;
      if (state.isSidebarCollapsed) return 80;
      return 300;
    }),
    distinctUntilChanged()
  );

  /**
   * Creates an instance of UiStateService
   * 
   * @description Initializes responsive listener and sets initial responsive state
   */
  constructor() {
    this.initializeResponsiveListener();
    this.updateResponsiveState();
  }

  // ========== Responsive Management ==========

  /**
   * Initializes window resize event listener with throttling
   * 
   * @private
   * @description Sets up throttled window resize listener to update responsive state
   */
  private initializeResponsiveListener(): void {
    fromEvent(window, 'resize')
      .pipe(throttleTime(200))
      .subscribe(() => this.updateResponsiveState());
  }

  /**
   * Updates responsive state based on current window width
   * 
   * @private
   * @description Calculates responsive breakpoints and updates state accordingly.
   * Auto-closes sidebar on mobile devices.
   */
  private updateResponsiveState(): void {
    const width = window.innerWidth;
    const currentState = this.state$.value;

    const isMobile = width < this.MOBILE_BREAKPOINT;
    const isTablet = width >= this.MOBILE_BREAKPOINT && width < this.TABLET_BREAKPOINT;
    const isDesktop = width >= this.DESKTOP_BREAKPOINT;

    // Auto-close sidebar on mobile
    const isSidebarOpen = isMobile ? false : currentState.isSidebarOpen;

    this.state$.next({
      ...currentState,
      screenWidth: width,
      isMobile,
      isTablet,
      isDesktop,
      isSidebarOpen
    });
  }

  // ========== Sidebar Management ==========

  /**
   * Toggles sidebar open/closed state
   * 
   * @description Switches the sidebar between open and closed states
   * 
   * @example
   * ```typescript
   * this.uiState.toggleSidebar();
   * ```
   */
  toggleSidebar(): void {
    const currentState = this.state$.value;
    this.state$.next({
      ...currentState,
      isSidebarOpen: !currentState.isSidebarOpen
    });
  }

  /**
   * Sets sidebar open state explicitly
   * 
   * @param open - Whether sidebar should be open
   * 
   * @example
   * ```typescript
   * this.uiState.setSidebarOpen(true);  // Open sidebar
   * this.uiState.setSidebarOpen(false); // Close sidebar
   * ```
   */
  setSidebarOpen(open: boolean): void {
    this.state$.next({
      ...this.state$.value,
      isSidebarOpen: open
    });
  }

  /**
   * Toggles sidebar collapsed state (desktop only)
   * 
   * @description Collapses or expands sidebar on desktop devices.
   * Has no effect on mobile devices.
   * 
   * @example
   * ```typescript
   * this.uiState.toggleSidebarCollapse();
   * ```
   */
  toggleSidebarCollapse(): void {
    const currentState = this.state$.value;
    if (!currentState.isMobile) {
      this.state$.next({
        ...currentState,
        isSidebarCollapsed: !currentState.isSidebarCollapsed
      });
    }
  }

  // ========== Modal Management ==========

  /**
   * Opens a modal with optional data
   * 
   * @param modalId - Unique identifier for the modal
   * @param data - Optional data to pass to the modal
   * 
   * @example
   * ```typescript
   * // Open simple modal
   * this.uiState.openModal('patient-details');
   * 
   * // Open modal with data
   * const patientData = { id: '123', name: 'John Doe' };
   * this.uiState.openModal('patient-edit', patientData);
   * ```
   */
  openModal(modalId: string, data?: any): void {
    this.state$.next({
      ...this.state$.value,
      activeModal: modalId,
      modalData: data
    });
  }

  /**
   * Closes the currently active modal
   * 
   * @description Closes any open modal and clears modal data
   * 
   * @example
   * ```typescript
   * this.uiState.closeModal();
   * ```
   */
  closeModal(): void {
    this.state$.next({
      ...this.state$.value,
      activeModal: null,
      modalData: null
    });
  }

  // ========== Loading Management ==========

  /**
   * Sets global loading state
   * 
   * @param loading - Whether global loading should be active
   * 
   * @description Controls the global loading indicator that overlays the entire application
   * 
   * @example
   * ```typescript
   * this.uiState.setGlobalLoading(true);  // Show global loader
   * this.uiState.setGlobalLoading(false); // Hide global loader
   * ```
   */
  setGlobalLoading(loading: boolean): void {
    this.state$.next({
      ...this.state$.value,
      globalLoading: loading
    });
  }

  /**
   * Starts a named loading task
   * 
   * @param taskId - Unique identifier for the loading task
   * 
   * @description Adds a task to the loading tasks set. Loading indicator
   * remains active while any tasks are running.
   * 
   * @example
   * ```typescript
   * this.uiState.startLoading('fetching-patients');
   * // Perform async operation
   * this.uiState.stopLoading('fetching-patients');
   * ```
   */
  startLoading(taskId: string): void {
    const currentState = this.state$.value;
    const newTasks = new Set(currentState.loadingTasks);
    newTasks.add(taskId);
    
    this.state$.next({
      ...currentState,
      loadingTasks: newTasks
    });
  }

  /**
   * Stops a named loading task
   * 
   * @param taskId - Unique identifier for the loading task to stop
   * 
   * @description Removes a task from the loading tasks set. Loading indicator
   * hides when no tasks remain.
   * 
   * @example
   * ```typescript
   * this.uiState.stopLoading('fetching-patients');
   * ```
   */
  stopLoading(taskId: string): void {
    const currentState = this.state$.value;
    const newTasks = new Set(currentState.loadingTasks);
    newTasks.delete(taskId);
    
    this.state$.next({
      ...currentState,
      loadingTasks: newTasks
    });
  }

  // ========== Toast Management ==========

  /**
   * Shows a toast notification
   * 
   * @param message - Message to display in the toast
   * @param type - Type of toast (affects styling)
   * @param duration - Duration in milliseconds (0 = no auto-removal)
   * 
   * @description Creates and displays a toast notification. Auto-removes after
   * specified duration unless duration is 0.
   * 
   * @example
   * ```typescript
   * this.uiState.showToast('Hello World', 'info', 3000);
   * this.uiState.showToast('Permanent toast', 'warning', 0);
   * ```
   */
  showToast(message: string, type: Toast['type'] = 'info', duration = 5000): void {
    const toast: Toast = {
      id: `toast-${Date.now()}-${Math.random()}`,
      message,
      type,
      duration
    };

    const currentState = this.state$.value;
    this.state$.next({
      ...currentState,
      toasts: [...currentState.toasts, toast]
    });

    // Auto-remove toast after duration
    if (duration > 0) {
      setTimeout(() => this.removeToast(toast.id), duration);
    }
  }

  /**
   * Removes a specific toast by ID
   * 
   * @param toastId - Unique identifier of the toast to remove
   * 
   * @example
   * ```typescript
   * this.uiState.removeToast('toast-123456789');
   * ```
   */
  removeToast(toastId: string): void {
    const currentState = this.state$.value;
    this.state$.next({
      ...currentState,
      toasts: currentState.toasts.filter(t => t.id !== toastId)
    });
  }

  /**
   * Shows a success toast notification
   * 
   * @param message - Success message to display
   * 
   * @description Convenience method for showing success toasts with default duration
   * 
   * @example
   * ```typescript
   * this.uiState.showSuccessToast('Operation completed successfully');
   * ```
   */
  showSuccessToast(message: string): void {
    this.showToast(message, 'success');
  }

  /**
   * Shows an error toast notification
   * 
   * @param message - Error message to display
   * 
   * @description Convenience method for showing error toasts with longer duration (10s)
   * 
   * @example
   * ```typescript
   * this.uiState.showErrorToast('Failed to save data');
   * ```
   */
  showErrorToast(message: string): void {
    this.showToast(message, 'error', 10000); // Longer duration for errors
  }

  /**
   * Shows a warning toast notification
   * 
   * @param message - Warning message to display
   * 
   * @description Convenience method for showing warning toasts with default duration
   * 
   * @example
   * ```typescript
   * this.uiState.showWarningToast('Please verify your input');
   * ```
   */
  showWarningToast(message: string): void {
    this.showToast(message, 'warning');
  }

  // ========== View Management ==========

  /**
   * Sets the active view/page
   * 
   * @param view - The view to set as active
   * 
   * @description Updates the active view state for navigation and UI updates
   * 
   * @example
   * ```typescript
   * this.uiState.setActiveView('chat');
   * this.uiState.setActiveView('patients');
   * ```
   */
  setActiveView(view: UIState['activeView']): void {
    this.state$.next({
      ...this.state$.value,
      activeView: view
    });
  }

  // ========== PDF Viewer Management ==========

  /**
   * Opens the PDF viewer with specified URL
   * 
   * @param pdfUrl - URL of the PDF to display
   * 
   * @description Opens the PDF viewer modal and loads the specified PDF
   * 
   * @example
   * ```typescript
   * this.uiState.openPdfViewer('https://example.com/document.pdf');
   * ```
   */
  openPdfViewer(pdfUrl: string): void {
    this.state$.next({
      ...this.state$.value,
      isPdfViewerOpen: true,
      activePdfUrl: pdfUrl
    });
  }

  /**
   * Closes the PDF viewer
   * 
   * @description Closes the PDF viewer modal and clears the active PDF URL
   * 
   * @example
   * ```typescript
   * this.uiState.closePdfViewer();
   * ```
   */
  closePdfViewer(): void {
    this.state$.next({
      ...this.state$.value,
      isPdfViewerOpen: false,
      activePdfUrl: null
    });
  }

  // ========== Getters ==========

  /**
   * Gets the current complete UI state
   * 
   * @returns Current UIState object
   * 
   * @example
   * ```typescript
   * const state = this.uiState.currentState;
   * console.log('Current view:', state.activeView);
   * ```
   */
  get currentState(): UIState {
    return this.state$.value;
  }

  /**
   * Gets current mobile state
   * 
   * @returns True if currently in mobile view
   * 
   * @example
   * ```typescript
   * if (this.uiState.isMobileView) {
   *   // Handle mobile-specific logic
   * }
   * ```
   */
  get isMobileView(): boolean {
    return this.state$.value.isMobile;
  }

  /**
   * Gets current tablet state
   * 
   * @returns True if currently in tablet view
   * 
   * @example
   * ```typescript
   * if (this.uiState.isTabletView) {
   *   // Handle tablet-specific logic
   * }
   * ```
   */
  get isTabletView(): boolean {
    return this.state$.value.isTablet;
  }

  /**
   * Gets current desktop state
   * 
   * @returns True if currently in desktop view
   * 
   * @example
   * ```typescript
   * if (this.uiState.isDesktopView) {
   *   // Handle desktop-specific logic
   * }
   * ```
   */
  get isDesktopView(): boolean {
    return this.state$.value.isDesktop;
  }

  /**
   * Gets current sidebar width in pixels
   * 
   * @returns Sidebar width (0 = closed, 80 = collapsed, 300 = open)
   * 
   * @example
   * ```typescript
   * const width = this.uiState.sidebarWidth;
   * console.log(`Sidebar width: ${width}px`);
   * ```
   */
  get sidebarWidth(): number {
    const state = this.state$.value;
    if (!state.isSidebarOpen) return 0;
    if (state.isSidebarCollapsed) return 80;
    return 300;
  }
}