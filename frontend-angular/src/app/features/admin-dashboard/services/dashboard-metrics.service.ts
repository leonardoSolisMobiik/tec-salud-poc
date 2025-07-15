import { Injectable } from '@angular/core';
import { Observable, of, combineLatest } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { MedicalStateService } from '@core/services';
import { ChatMessage, PatientInteraction } from '@core/models';

/**
 * Interface for dashboard metrics
 */
export interface DashboardMetrics {
  consultationsToday: number;
  averageResponseTime: number;
}

/**
 * Service for retrieving dashboard metrics data
 *
 * @description Provides methods to calculate and retrieve key metrics for the admin dashboard
 * including consultations, response times, token usage, and document processing statistics.
 *
 * @example
 * ```typescript
 * constructor(private dashboardMetrics: DashboardMetricsService) {}
 *
 * // Get all dashboard metrics
 * this.dashboardMetrics.getDashboardMetrics().subscribe(metrics => {
 *   console.log('Consultations today:', metrics.consultationsToday);
 *   console.log('Average response time:', metrics.averageResponseTime);
 * });
 * ```
 *
 * @features
 * - Real-time metrics calculation
 * - 24-hour data filtering
 * - Performance metrics analysis
 * - Document type classification
 * - Error handling and fallbacks
 *
 * @since 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class DashboardMetricsService {
  /**
   * Creates an instance of DashboardMetricsService
   *
   * @param medicalState - Service for medical state management
   */
  constructor(private medicalState: MedicalStateService) {}

  /**
   * Gets comprehensive dashboard metrics
   *
   * @returns Observable containing all dashboard metrics
   *
   * @description Retrieves and calculates all key metrics for the admin dashboard
   * including consultations, response times, token usage, and document processing.
   */
  getDashboardMetrics(): Observable<DashboardMetrics> {
    return combineLatest([
      this.getConsultationsToday(),
      this.getAverageResponseTime()
    ]).pipe(
      map(([consultations, avgTime]) => ({
        consultationsToday: consultations,
        averageResponseTime: avgTime
      })),
      catchError(error => {
        console.error('Error getting dashboard metrics:', error);
        return of({
          consultationsToday: 0,
          averageResponseTime: 0
        });
      })
    );
  }

  /**
   * Gets the number of consultations today
   *
   * @returns Observable with today's consultation count
   *
   * @description Counts chat messages from today across all patients
   */
  private getConsultationsToday(): Observable<number> {
    return new Observable(observer => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const currentState = this.medicalState.currentState;
        let consultationCount = 0;

        // Count messages from today across all chat histories
        currentState.chatHistory.forEach((messages: ChatMessage[]) => {
          const todayMessages = messages.filter(msg => {
            if (!msg.timestamp) return false;
            const messageDate = new Date(msg.timestamp);
            return messageDate >= today && msg.role === 'user';
          });
          consultationCount += todayMessages.length;
        });

        // Add current chat messages from today
        const todayCurrentMessages = currentState.currentChatMessages.filter(msg => {
          if (!msg.timestamp) return false;
          const messageDate = new Date(msg.timestamp);
          return messageDate >= today && msg.role === 'user';
        });

        consultationCount += todayCurrentMessages.length;

        observer.next(consultationCount);
        observer.complete();
      } catch (error) {
        console.error('Error calculating consultations today:', error);
        observer.next(0);
        observer.complete();
      }
    });
  }

  /**
   * Gets the average response time for AI responses
   *
   * @returns Observable with average response time in milliseconds
   *
   * @description Calculates average processing time from chat message metadata
   */
  private getAverageResponseTime(): Observable<number> {
    return new Observable(observer => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const currentState = this.medicalState.currentState;
        const processingTimes: number[] = [];

        // Collect processing times from all chat histories
        currentState.chatHistory.forEach((messages: ChatMessage[]) => {
          messages.forEach(msg => {
            if (msg.role === 'assistant' && msg.metadata?.processingTime && msg.timestamp) {
              const messageDate = new Date(msg.timestamp);
              if (messageDate >= today) {
                processingTimes.push(msg.metadata.processingTime);
              }
            }
          });
        });

        // Add current chat messages processing times
        currentState.currentChatMessages.forEach(msg => {
          if (msg.role === 'assistant' && msg.metadata?.processingTime && msg.timestamp) {
            const messageDate = new Date(msg.timestamp);
            if (messageDate >= today) {
              processingTimes.push(msg.metadata.processingTime);
            }
          }
        });

        const averageTime = processingTimes.length > 0
          ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
          : 0;

        observer.next(Math.round(averageTime));
        observer.complete();
      } catch (error) {
        console.error('Error calculating average response time:', error);
        observer.next(0);
        observer.complete();
      }
    });
  }





  /**
   * Gets recent consultation trends
   *
   * @returns Observable with consultation trend data
   *
   * @description Provides data for trend analysis (future enhancement)
   */
  getConsultationTrends(): Observable<{ period: string; count: number }[]> {
    return of([
      { period: '00:00', count: 2 },
      { period: '06:00', count: 8 },
      { period: '12:00', count: 24 },
      { period: '18:00', count: 18 }
    ]);
  }

  /**
   * Gets system performance metrics
   *
   * @returns Observable with performance metrics
   *
   * @description Provides system performance data (future enhancement)
   */
  getPerformanceMetrics(): Observable<{ metric: string; value: number; unit: string }[]> {
    return of([
      { metric: 'CPU Usage', value: 45, unit: '%' },
      { metric: 'Memory Usage', value: 68, unit: '%' },
      { metric: 'Response Time', value: 1.2, unit: 's' },
      { metric: 'Error Rate', value: 0.1, unit: '%' }
    ]);
  }
}
