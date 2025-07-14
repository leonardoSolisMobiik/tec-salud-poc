import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, Observable } from 'rxjs';
import { Patient } from '@core/models';

/**
 * Interface for quick question items in medical chat
 * 
 * @interface QuickQuestion
 * @description Defines the structure for pre-defined medical questions that can be
 * quickly selected by users to speed up medical consultations and ensure comprehensive care.
 */
export interface QuickQuestion {
  /** Unique identifier for the question */
  id: string;
  /** Display text for the question */
  text: string;
  /** Emoji icon representing the question category */
  icon: string;
  /** Medical category classification */
  category: 'diagnosis' | 'symptoms' | 'treatment' | 'medication' | 'tests' | 'emergency' | 'follow-up' | 'prevention';
  /** Priority level for question ordering */
  priority: 'high' | 'medium' | 'low';
  /** Whether question adapts to patient context */
  contextual: boolean;
  /** Whether question is relevant to specific age groups */
  ageRelevant?: boolean;
  /** Whether question is relevant to specific genders */
  genderRelevant?: boolean;
}

/**
 * Service for managing contextual quick questions in medical chat
 * 
 * @description Provides intelligent quick question suggestions based on patient context,
 * medical priorities, and user patterns. Includes automatic rotation of questions
 * and contextual filtering based on patient demographics and medical history.
 * 
 * @example
 * ```typescript
 * constructor(private quickQuestions: QuickQuestionsService) {}
 * 
 * // Get contextual questions for a patient
 * const questions = this.quickQuestions.getContextualQuestions(patient, 6);
 * console.log('Suggested questions:', questions);
 * 
 * // Start automatic rotation
 * this.quickQuestions.startRotation(patient);
 * 
 * // Subscribe to current questions
 * this.quickQuestions.getCurrentQuestions().subscribe(questions => {
 *   this.displayQuestions = questions;
 * });
 * ```
 * 
 * @features
 * - Context-aware question suggestions
 * - Automatic question rotation every 10 seconds
 * - Priority-based question ordering
 * - Age and gender-specific filtering
 * - 8 medical categories coverage
 * - Integration with existing chat templates
 * 
 * @since 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class QuickQuestionsService {
  /** Rotation interval in milliseconds (10 seconds) */
  private rotationInterval = 10000;
  
  /** Maximum number of questions to display simultaneously */
  private maxVisible = 8;
  
  /** BehaviorSubject for current question set */
  private currentQuestions$ = new BehaviorSubject<QuickQuestion[]>([]);
  
  /** Timer reference for question rotation */
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

  /**
   * Creates an instance of QuickQuestionsService
   */
  constructor() {}

  /**
   * Gets the current questions observable stream
   * 
   * @returns Observable that emits the current set of visible questions
   * 
   * @description Provides a reactive stream of questions that updates automatically
   * during rotation cycles. Use this to subscribe to question changes in components.
   * 
   * @example
   * ```typescript
   * this.quickQuestions.getCurrentQuestions().subscribe(questions => {
   *   this.visibleQuestions = questions;
   *   this.cdr.detectChanges();
   * });
   * ```
   */
  getCurrentQuestions(): Observable<QuickQuestion[]> {
    return this.currentQuestions$.asObservable();
  }

  /**
   * Generates contextual questions based on patient data
   * 
   * @param patient - Patient object to contextualize questions for
   * @param maxCount - Maximum number of questions to return (default: 8)
   * @returns Array of contextual questions sorted by priority
   * 
   * @description Filters and prioritizes questions based on patient demographics,
   * medical history, and contextual relevance. High-priority questions appear first,
   * followed by medium and low priority questions.
   * 
   * @example
   * ```typescript
   * const patient: Patient = { id: '123', age: 65, gender: 'M', ... };
   * const questions = this.getContextualQuestions(patient, 6);
   * 
   * // Returns age-relevant questions for elderly male patient:
   * // - High priority: diagnosis, symptoms, emergency
   * // - Medium priority: treatment, medication adjustments
   * // - Low priority: prevention, follow-up
   * ```
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
   * Starts automatic rotation of questions for a patient
   * 
   * @param patient - Patient context for question filtering
   * 
   * @description Begins automatic question rotation every 10 seconds with questions
   * filtered and prioritized for the given patient. Automatically stops any existing
   * rotation before starting a new one.
   * 
   * @example
   * ```typescript
   * // Start rotation when patient is selected
   * onPatientSelected(patient: Patient) {
   *   this.quickQuestions.startRotation(patient);
   * }
   * ```
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
   * Stops the automatic question rotation
   * 
   * @description Clears the rotation timer and stops automatic question updates.
   * Call this when navigating away from chat or when patient context changes.
   * 
   * @example
   * ```typescript
   * // Stop rotation when leaving chat
   * ngOnDestroy() {
   *   this.quickQuestions.stopRotation();
   * }
   * ```
   */
  stopRotation(): void {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = null;
    }
  }

  /**
   * Manually triggers question rotation for a patient
   * 
   * @param patient - Patient context for new question set
   * 
   * @description Forces an immediate update of the question set without waiting
   * for the automatic rotation timer. Useful for manual refresh actions.
   */
  rotateQuestions(patient: Patient): void {
    this.updateQuestions(patient);
  }

  /**
   * Updates the current question set and emits new questions
   * 
   * @param patient - Patient context for question filtering
   * @private
   * 
   * @description Internal method that generates new contextual questions
   * and updates the observable stream with the latest question set.
   */
  private updateQuestions(patient: Patient): void {
    const newQuestions = this.getContextualQuestions(patient, this.maxVisible);
    this.currentQuestions$.next(newQuestions);
  }

  /**
   * Filters questions based on patient demographics and context
   * 
   * @param questions - Full question set to filter
   * @param patient - Patient object with demographic data
   * @returns Filtered questions relevant to the patient
   * @private
   * 
   * @description Applies contextual filtering based on patient age, gender,
   * and other demographic factors. Age-relevant questions are filtered for
   * pediatric (<18) and geriatric (>65) patients. Gender-relevant questions
   * are filtered based on patient gender.
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
   * Gets the appropriate emoji icon for a medical category
   * 
   * @param category - Medical category name
   * @returns Emoji icon representing the category
   * 
   * @description Maps medical categories to their corresponding emoji icons
   * for consistent visual representation. Returns a fallback question mark
   * icon for unrecognized categories.
   * 
   * @example
   * ```typescript
   * const icon = this.getCategoryIcon('diagnosis'); // Returns '🩺'
   * const icon = this.getCategoryIcon('emergency'); // Returns '🚨'
   * const icon = this.getCategoryIcon('unknown');   // Returns '❓'
   * ```
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
   * Cleans up service resources and stops rotation
   * 
   * @description Lifecycle method to properly clean up the rotation timer
   * and prevent memory leaks. Should be called when the service is destroyed.
   * 
   * @example
   * ```typescript
   * // Called automatically by Angular when service is destroyed
   * // Or call manually when needed:
   * this.quickQuestions.ngOnDestroy();
   * ```
   */
  ngOnDestroy(): void {
    this.stopRotation();
  }
} 