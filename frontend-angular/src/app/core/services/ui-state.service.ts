import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent } from 'rxjs';
import { map, distinctUntilChanged, throttleTime } from 'rxjs/operators';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface UIState {
  // Responsive states
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  
  // Sidebar states
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  
  // Modal/Dialog states
  activeModal: string | null;
  modalData: any;
  
  // Loading states
  globalLoading: boolean;
  loadingTasks: Set<string>;
  
  // Toast notifications
  toasts: Toast[];
  
  // View states
  activeView: 'dashboard' | 'chat' | 'patients' | 'documents';
  
  // PDF Viewer
  isPdfViewerOpen: boolean;
  activePdfUrl: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class UiStateService {
  // Breakpoints
  private readonly MOBILE_BREAKPOINT = 768;
  private readonly TABLET_BREAKPOINT = 1024;
  private readonly DESKTOP_BREAKPOINT = 1200;

  // Initial state
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

  // State subject
  private state$ = new BehaviorSubject<UIState>(this.initialState);

  // Public observables
  public readonly isMobile$ = this.state$.pipe(
    map(state => state.isMobile),
    distinctUntilChanged()
  );

  public readonly isTablet$ = this.state$.pipe(
    map(state => state.isTablet),
    distinctUntilChanged()
  );

  public readonly isDesktop$ = this.state$.pipe(
    map(state => state.isDesktop),
    distinctUntilChanged()
  );

  public readonly isSidebarOpen$ = this.state$.pipe(
    map(state => state.isSidebarOpen),
    distinctUntilChanged()
  );

  public readonly isSidebarCollapsed$ = this.state$.pipe(
    map(state => state.isSidebarCollapsed),
    distinctUntilChanged()
  );

  public readonly activeModal$ = this.state$.pipe(
    map(state => state.activeModal),
    distinctUntilChanged()
  );

  public readonly isLoading$ = this.state$.pipe(
    map(state => state.globalLoading || state.loadingTasks.size > 0),
    distinctUntilChanged()
  );

  public readonly toasts$ = this.state$.pipe(
    map(state => state.toasts),
    distinctUntilChanged()
  );

  public readonly activeView$ = this.state$.pipe(
    map(state => state.activeView),
    distinctUntilChanged()
  );

  public readonly sidebarWidth$ = this.state$.pipe(
    map(state => {
      if (!state.isSidebarOpen) return 0;
      if (state.isSidebarCollapsed) return 80;
      return 300;
    }),
    distinctUntilChanged()
  );

  constructor() {
    this.initializeResponsiveListener();
    this.updateResponsiveState();
  }

  // ========== Responsive Management ==========

  private initializeResponsiveListener(): void {
    fromEvent(window, 'resize')
      .pipe(throttleTime(200))
      .subscribe(() => this.updateResponsiveState());
  }

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

  toggleSidebar(): void {
    const currentState = this.state$.value;
    this.state$.next({
      ...currentState,
      isSidebarOpen: !currentState.isSidebarOpen
    });
  }

  setSidebarOpen(open: boolean): void {
    this.state$.next({
      ...this.state$.value,
      isSidebarOpen: open
    });
  }

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

  openModal(modalId: string, data?: any): void {
    this.state$.next({
      ...this.state$.value,
      activeModal: modalId,
      modalData: data
    });
  }

  closeModal(): void {
    this.state$.next({
      ...this.state$.value,
      activeModal: null,
      modalData: null
    });
  }

  // ========== Loading Management ==========

  setGlobalLoading(loading: boolean): void {
    this.state$.next({
      ...this.state$.value,
      globalLoading: loading
    });
  }

  startLoading(taskId: string): void {
    const currentState = this.state$.value;
    const newTasks = new Set(currentState.loadingTasks);
    newTasks.add(taskId);
    
    this.state$.next({
      ...currentState,
      loadingTasks: newTasks
    });
  }

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

  removeToast(toastId: string): void {
    const currentState = this.state$.value;
    this.state$.next({
      ...currentState,
      toasts: currentState.toasts.filter(t => t.id !== toastId)
    });
  }

  showSuccessToast(message: string): void {
    this.showToast(message, 'success');
  }

  showErrorToast(message: string): void {
    this.showToast(message, 'error', 10000); // Longer duration for errors
  }

  showWarningToast(message: string): void {
    this.showToast(message, 'warning');
  }

  // ========== View Management ==========

  setActiveView(view: UIState['activeView']): void {
    this.state$.next({
      ...this.state$.value,
      activeView: view
    });
  }

  // ========== PDF Viewer Management ==========

  openPdfViewer(pdfUrl: string): void {
    this.state$.next({
      ...this.state$.value,
      isPdfViewerOpen: true,
      activePdfUrl: pdfUrl
    });
  }

  closePdfViewer(): void {
    this.state$.next({
      ...this.state$.value,
      isPdfViewerOpen: false,
      activePdfUrl: null
    });
  }

  // ========== Getters ==========

  get currentState(): UIState {
    return this.state$.value;
  }

  get isMobileView(): boolean {
    return this.state$.value.isMobile;
  }

  get isTabletView(): boolean {
    return this.state$.value.isTablet;
  }

  get isDesktopView(): boolean {
    return this.state$.value.isDesktop;
  }

  get sidebarWidth(): number {
    const state = this.state$.value;
    if (!state.isSidebarOpen) return 0;
    if (state.isSidebarCollapsed) return 80;
    return 300;
  }
}