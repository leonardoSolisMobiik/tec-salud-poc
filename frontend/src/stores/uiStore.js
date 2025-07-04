import { create } from 'zustand';

export const useUIStore = create((set, get) => ({
  // Estados responsive
  isMobile: false,
  isTablet: false,
  sidebarCollapsed: false,
  sidebarCollapsedDesktop: false, // Estado específico para desktop

  // Estados de navegación
  activeView: 'dashboard', // 'dashboard', 'chat', 'documents'

  // Estados del PDF viewer
  pdfViewer: {
    isOpen: false,
    url: null,
    title: null,
  },

  // Estados de toast/notificaciones
  toast: {
    isVisible: false,
    message: '',
    type: 'info', // 'success', 'error', 'warning', 'info'
  },

  // Estados de loading
  isLoading: false,
  loadingMessage: '',

  // Estados de modal
  modal: {
    isOpen: false,
    type: null,
    data: null,
  },

  // Acciones responsive
  setMobile: (isMobile) => set({ isMobile }),
  setTablet: (isTablet) => set({ isTablet }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebarDesktop: () => set((state) => ({ 
    sidebarCollapsedDesktop: !state.sidebarCollapsedDesktop 
  })),

  // Acciones de navegación
  setActiveView: (view) => set({ activeView: view }),

  // Acciones del PDF viewer
  openPDFViewer: (url, title) => set({
    pdfViewer: {
      isOpen: true,
      url,
      title,
    },
  }),
  closePDFViewer: () => set({
    pdfViewer: {
      isOpen: false,
      url: null,
      title: null,
    },
  }),

  // Acciones de toast
  showToast: (message, type = 'info') => {
    set({
      toast: {
        isVisible: true,
        message,
        type,
      },
    });
    
    // Auto-hide después de 5 segundos
    setTimeout(() => {
      set((state) => ({
        toast: {
          ...state.toast,
          isVisible: false,
        },
      }));
    }, 5000);
  },
  hideToast: () => set((state) => ({
    toast: {
      ...state.toast,
      isVisible: false,
    },
  })),

  // Acciones de loading
  setLoading: (isLoading, message = '') => set({
    isLoading,
    loadingMessage: message,
  }),

  // Acciones de modal
  openModal: (type, data = null) => set({
    modal: {
      isOpen: true,
      type,
      data,
    },
  }),
  closeModal: () => set({
    modal: {
      isOpen: false,
      type: null,
      data: null,
    },
  }),

  // Utilidades
  resetUI: () => set({
    sidebarCollapsed: false,
    sidebarCollapsedDesktop: false,
    activeView: 'dashboard',
    pdfViewer: {
      isOpen: false,
      url: null,
      title: null,
    },
    toast: {
      isVisible: false,
      message: '',
      type: 'info',
    },
    isLoading: false,
    loadingMessage: '',
    modal: {
      isOpen: false,
      type: null,
      data: null,
    },
  }),

  // Getters computados
  get isDesktop() {
    const state = get();
    return !state.isMobile && !state.isTablet;
  },

  get shouldShowSidebar() {
    const state = get();
    if (state.isMobile || state.isTablet) {
      return !state.sidebarCollapsed;
    }
    return true; // Siempre visible en desktop, pero puede estar colapsado
  },

  get sidebarWidth() {
    const state = get();
    if (state.isMobile || state.isTablet) {
      return state.sidebarCollapsed ? 0 : 320;
    }
    return state.sidebarCollapsedDesktop ? 60 : 320;
  },
}));

