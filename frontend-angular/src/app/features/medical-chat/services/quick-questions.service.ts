import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, Observable } from 'rxjs';
import { Patient } from '@core/models';

export interface QuickQuestion {
  id: string;
  text: string;
  icon: string;
  category: 'diagnosis' | 'symptoms' | 'treatment' | 'medication' | 'tests' | 'emergency' | 'follow-up' | 'prevention';
  priority: 'high' | 'medium' | 'low';
  contextual: boolean;
  ageRelevant?: boolean;
  genderRelevant?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class QuickQuestionsService {
  private rotationInterval = 10000; // 10 seconds
  private maxVisible = 8;
  private currentQuestions$ = new BehaviorSubject<QuickQuestion[]>([]);
  private rotationTimer: any;

  // Reutilizando y extendiendo preguntas existentes de chat-input.component.ts y medical-chat.component.ts
  private readonly baseQuestions: QuickQuestion[] = [
    // Desde chat-input.component.ts (reutilizadas)
    { id: 'q1', text: 'Realizar diagnóstico inicial', icon: '🩺', category: 'diagnosis', priority: 'high', contextual: true },
    { id: 'q2', text: 'Revisar medicamentos', icon: '💊', category: 'medication', priority: 'medium', contextual: true },
    { id: 'q3', text: 'Analizar síntomas', icon: '📋', category: 'symptoms', priority: 'high', contextual: true },
    { id: 'q4', text: 'Recomendar especialista', icon: '🏥', category: 'treatment', priority: 'medium', contextual: true },
    
    // Desde medical-chat.component.ts (reutilizadas y adaptadas)
    { id: 'q5', text: 'El paciente presenta los siguientes síntomas:', icon: '🤒', category: 'symptoms', priority: 'high', contextual: true },
    { id: 'q6', text: 'Necesito ayuda con el diagnóstico diferencial para:', icon: '🔍', category: 'diagnosis', priority: 'high', contextual: true },
    { id: 'q7', text: 'Recomienda opciones de tratamiento para:', icon: '💉', category: 'treatment', priority: 'medium', contextual: true },
    { id: 'q8', text: 'Qué exámenes clínicos recomiendas para evaluar:', icon: '🔬', category: 'tests', priority: 'medium', contextual: true },
    { id: 'q9', text: 'Evalúa la urgencia de este caso:', icon: '🚨', category: 'emergency', priority: 'high', contextual: true },
    { id: 'q10', text: 'Considerando el historial médico del paciente:', icon: '📝', category: 'follow-up', priority: 'medium', contextual: true },
    
    // Nuevas preguntas contextuales
    { id: 'q11', text: '¿Cuáles son los valores normales de laboratorio?', icon: '📊', category: 'tests', priority: 'low', contextual: false },
    { id: 'q12', text: '¿Qué contraindicaciones tiene este medicamento?', icon: '⚠️', category: 'medication', priority: 'medium', contextual: true },
    { id: 'q13', text: '¿Cuándo programar el siguiente control?', icon: '⏰', category: 'follow-up', priority: 'medium', contextual: true },
    { id: 'q14', text: '¿Qué medidas preventivas recomiendas?', icon: '🛡️', category: 'prevention', priority: 'low', contextual: true },
    
    // Preguntas específicas por contexto
    { id: 'q15', text: '¿Es seguro durante el embarazo?', icon: '🤱', category: 'medication', priority: 'high', contextual: true, genderRelevant: true },
    { id: 'q16', text: '¿Requiere ajuste de dosis en pediatría?', icon: '👶', category: 'medication', priority: 'high', contextual: true, ageRelevant: true },
    { id: 'q17', text: '¿Cuáles son las complicaciones en adultos mayores?', icon: '👴', category: 'treatment', priority: 'medium', contextual: true, ageRelevant: true },
    { id: 'q18', text: '¿Qué estudios de imagen son necesarios?', icon: '📸', category: 'tests', priority: 'medium', contextual: true },
    { id: 'q19', text: '¿Cuál es el pronóstico esperado?', icon: '📈', category: 'follow-up', priority: 'medium', contextual: true },
    { id: 'q20', text: '¿Necesita interconsulta especializada?', icon: '👨‍⚕️', category: 'treatment', priority: 'medium', contextual: true }
  ];

  constructor() {}

  /**
   * Get current questions observable
   */
  getCurrentQuestions(): Observable<QuickQuestion[]> {
    return this.currentQuestions$.asObservable();
  }

  /**
   * Generate contextual questions based on patient data
   * Reutiliza la lógica existente pero la hace contextual
   */
  getContextualQuestions(patient: Patient, maxCount: number = 8): QuickQuestion[] {
    let questions = [...this.baseQuestions];

    // Filtrar por contexto del paciente
    if (patient) {
      questions = this.filterByPatientContext(questions, patient);
    }

    // Ordenar por prioridad
    questions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // Tomar máximo permitido
    return questions.slice(0, maxCount);
  }

  /**
   * Start automatic rotation
   */
  startRotation(patient: Patient): void {
    this.stopRotation();
    
    // Initial load
    this.updateQuestions(patient);
    
    // Set rotation timer
    this.rotationTimer = setInterval(() => {
      this.updateQuestions(patient);
    }, this.rotationInterval);
  }

  /**
   * Stop automatic rotation
   */
  stopRotation(): void {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = null;
    }
  }

  /**
   * Manually rotate questions
   */
  rotateQuestions(patient: Patient): void {
    this.updateQuestions(patient);
  }

  /**
   * Update current questions
   */
  private updateQuestions(patient: Patient): void {
    const newQuestions = this.getContextualQuestions(patient, this.maxVisible);
    this.currentQuestions$.next(newQuestions);
  }

  /**
   * Filter questions by patient context
   */
  private filterByPatientContext(questions: QuickQuestion[], patient: Patient): QuickQuestion[] {
    return questions.filter(q => {
      // Siempre incluir preguntas no contextuales
      if (!q.contextual) return true;

      // Filtrar por edad si es relevante
      if (q.ageRelevant && patient.age !== undefined) {
        const age = patient.age;
        if (q.id === 'q16' && age >= 18) return false; // Pediatría
        if (q.id === 'q17' && age < 65) return false; // Adultos mayores
      }

      // Filtrar por género si es relevante
      if (q.genderRelevant && patient.gender) {
        if (q.id === 'q15' && patient.gender !== 'F') return false; // Embarazo
      }

      return true;
    });
  }

  /**
   * Get category icon for backward compatibility
   */
  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'diagnosis': '🩺',
      'symptoms': '🤒',
      'treatment': '💊',
      'medication': '💉',
      'tests': '🔬',
      'emergency': '🚨',
      'follow-up': '📋',
      'prevention': '🛡️'
    };
    return icons[category] || '❓';
  }

  /**
   * Clean up resources
   */
  ngOnDestroy(): void {
    this.stopRotation();
  }
} 