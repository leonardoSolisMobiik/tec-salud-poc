import { create } from 'zustand';
import apiService from '../services/apiService';

// Store principal para el estado médico
export const useMedicalStore = create((set, get) => ({
  // Estado de pacientes
  activePatient: null,
  recentPatients: [],
  allPatients: [],
  searchResults: [],
  isLoadingPatients: false,
  patientsError: null,
  
  // Estado del chat
  chatHistory: {}, // Historial por paciente ID
  currentChat: [],
  isTyping: false,
  isProcessing: false,
  
  // Estado de UI médica
  isVoiceListening: false,
  voiceCommand: null,
  
  // Acciones de pacientes
  setActivePatient: async (patient) => {
    set((state) => {
      // Cargar historial del chat para este paciente
      const patientChatHistory = state.chatHistory[patient.id] || [];
      
      return {
        activePatient: patient,
        currentChat: patientChatHistory,
      };
    });
    
    // Record interaction with backend
    try {
      await apiService.recordPatientInteraction(patient.id, 'view');
      // Refresh recent patients after interaction
      get().fetchRecentPatients();
    } catch (error) {
      console.error('Failed to record patient interaction:', error);
    }
  },
  
  fetchRecentPatients: async () => {
    set({ isLoadingPatients: true, patientsError: null });
    try {
      const patients = await apiService.getRecentPatients(5);
      set({ recentPatients: patients, isLoadingPatients: false });
    } catch (error) {
      console.error('Failed to fetch recent patients:', error);
      set({ patientsError: error.message, isLoadingPatients: false });
    }
  },
  
  setRecentPatients: (patients) => set({ recentPatients: patients }),
  
  clearActivePatient: () => set({
    activePatient: null,
    currentChat: [],
  }),
  
  searchPatients: async (term) => {
    if (!term.trim()) {
      set({ searchResults: [] });
      return [];
    }
    
    set({ isLoadingPatients: true, patientsError: null });
    try {
      const response = await apiService.searchPatients(term, 10, 0);
      const results = response.patients || [];
      set({ searchResults: results, isLoadingPatients: false });
      return results;
    } catch (error) {
      console.error('Failed to search patients:', error);
      set({ patientsError: error.message, isLoadingPatients: false });
      return [];
    }
  },
  
  clearSearchResults: () => set({ searchResults: [] }),
  
  // Acciones del chat
  addMessage: (message) => {
    set((state) => {
      const newMessage = {
        id: Date.now().toString(),
        timestamp: new Date(),
        ...message,
      };
      
      const newCurrentChat = [...state.currentChat, newMessage];
      
      // Guardar en historial del paciente activo
      let newChatHistory = { ...state.chatHistory };
      if (state.activePatient) {
        newChatHistory[state.activePatient.id] = newCurrentChat;
      }
      
      return {
        currentChat: newCurrentChat,
        chatHistory: newChatHistory,
      };
    });
  },
  
  clearChat: () => {
    set((state) => {
      let newChatHistory = { ...state.chatHistory };
      if (state.activePatient) {
        newChatHistory[state.activePatient.id] = [];
      }
      
      return {
        currentChat: [],
        chatHistory: newChatHistory,
      };
    });
  },
  
  setTyping: (isTyping) => set({ isTyping }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  
  // Acciones de voz
  setVoiceListening: (isListening) => set({ isVoiceListening: isListening }),
  setVoiceCommand: (command) => set({ voiceCommand: command }),
  
  // Utilidades
  getPatientById: (id) => {
    const { allPatients } = get();
    return allPatients.find(patient => patient.id === id);
  },
  
  getPatientByName: (name) => {
    const { allPatients } = get();
    const searchName = name.toLowerCase();
    return allPatients.find(patient => 
      patient.name.toLowerCase().includes(searchName)
    );
  },
}));

export default useMedicalStore;

