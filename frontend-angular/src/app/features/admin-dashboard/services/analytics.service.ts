import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { MedicalStateService } from '@core/services';
import { ChatMessage } from '@core/models';

/**
 * Interface for hourly interaction data
 */
export interface HourlyInteractionData {
  hour: string;
  count: number;
}

/**
 * Interface for pills distribution data
 */
export interface PillsDistributionData {
  category: string;
  count: number;
  color: string;
}

/**
 * Service for analytics data processing and chart generation
 *
 * @description Provides methods to process medical data for analytics visualizations
 * including interaction timelines, pills usage distribution, and trend analysis.
 *
 * @example
 * ```typescript
 * constructor(private analytics: AnalyticsService) {}
 *
 * // Get hourly interactions for timeline chart
 * this.analytics.getInteractionsByHour().subscribe(data => {
 *   console.log('Hourly data:', data);
 * });
 *
 * // Get pills distribution for pie chart
 * this.analytics.getPillsDistribution().subscribe(data => {
 *   console.log('Pills distribution:', data);
 * });
 * ```
 *
 * @features
 * - Hourly interaction analysis
 * - Pills category distribution
 * - Color-coded chart data
 * - 24-hour data filtering
 * - Real-time data processing
 *
 * @since 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  /** Color palette for pills categories */
  private readonly pillsColors = {
    'diagnosis': '#0EA5E9',     // Blue
    'symptoms': '#EF4444',      // Red
    'treatment': '#10B981',     // Green
    'medication': '#8B5CF6',    // Purple
    'tests': '#F59E0B',         // Amber
    'emergency': '#DC2626',     // Dark Red
    'follow-up': '#6B7280',     // Gray
    'prevention': '#059669'     // Emerald
  };

  /** Pills category labels in Spanish */
  private readonly pillsLabels = {
    'diagnosis': 'Diagnóstico',
    'symptoms': 'Síntomas',
    'treatment': 'Tratamiento',
    'medication': 'Medicamentos',
    'tests': 'Exámenes',
    'emergency': 'Emergencia',
    'follow-up': 'Seguimiento',
    'prevention': 'Prevención'
  };

  /**
   * Creates an instance of AnalyticsService
   *
   * @param medicalState - Service for medical state management
   */
  constructor(private medicalState: MedicalStateService) {}

  /**
   * Gets interactions grouped by hour for the last 24 hours
   *
   * @returns Observable with hourly interaction data
   *
   * @description Analyzes chat messages to create hourly interaction timeline
   * for the dashboard line chart visualization.
   */
  getInteractionsByHour(): Observable<HourlyInteractionData[]> {
    return new Observable(observer => {
      try {
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Initialize hourly data structure
        const hourlyData: { [hour: string]: number } = {};

        // Create empty data for last 24 hours
        for (let i = 0; i < 24; i++) {
          const hour = new Date(last24Hours.getTime() + i * 60 * 60 * 1000);
          const hourKey = hour.getHours().toString().padStart(2, '0') + ':00';
          hourlyData[hourKey] = 0;
        }

        const currentState = this.medicalState.currentState;

        // Process chat history
        currentState.chatHistory.forEach((messages: ChatMessage[]) => {
          messages.forEach(msg => {
            if (msg.role === 'user' && msg.timestamp) {
              const messageDate = new Date(msg.timestamp);
              if (messageDate >= last24Hours) {
                const hourKey = messageDate.getHours().toString().padStart(2, '0') + ':00';
                if (hourlyData[hourKey] !== undefined) {
                  hourlyData[hourKey]++;
                }
              }
            }
          });
        });

        // Process current chat messages
        currentState.currentChatMessages.forEach(msg => {
          if (msg.role === 'user' && msg.timestamp) {
            const messageDate = new Date(msg.timestamp);
            if (messageDate >= last24Hours) {
              const hourKey = messageDate.getHours().toString().padStart(2, '0') + ':00';
              if (hourlyData[hourKey] !== undefined) {
                hourlyData[hourKey]++;
              }
            }
          }
        });

        // Convert to array and sort by hour
        const result = Object.entries(hourlyData)
          .map(([hour, count]) => ({ hour, count }))
          .sort((a, b) => a.hour.localeCompare(b.hour));

        observer.next(result);
        observer.complete();
      } catch (error) {
        console.error('Error getting interactions by hour:', error);
        observer.next(this.getDefaultHourlyData());
        observer.complete();
      }
    });
  }

  /**
   * Gets pills distribution data for pie chart
   *
   * @returns Observable with pills distribution data
   *
   * @description Analyzes pills usage patterns to create distribution chart.
   * Currently returns mock data based on medical consultation patterns.
   */
  getPillsDistribution(): Observable<PillsDistributionData[]> {
    return new Observable(observer => {
      try {
        // Mock data based on typical medical consultation patterns
        // In a real implementation, this would analyze actual pills usage from chat logs
        const mockDistribution = [
          { category: 'Diagnóstico', count: 28, color: this.pillsColors.diagnosis },
          { category: 'Síntomas', count: 22, color: this.pillsColors.symptoms },
          { category: 'Tratamiento', count: 18, color: this.pillsColors.treatment },
          { category: 'Medicamentos', count: 15, color: this.pillsColors.medication },
          { category: 'Exámenes', count: 12, color: this.pillsColors.tests },
          { category: 'Emergencia', count: 8, color: this.pillsColors.emergency },
          { category: 'Seguimiento', count: 6, color: this.pillsColors['follow-up'] },
          { category: 'Prevención', count: 4, color: this.pillsColors.prevention }
        ];

        observer.next(mockDistribution);
        observer.complete();
      } catch (error) {
        console.error('Error getting pills distribution:', error);
        observer.next(this.getDefaultPillsDistribution());
        observer.complete();
      }
    });
  }

  /**
   * Gets interaction trends for the last week
   *
   * @returns Observable with weekly trend data
   *
   * @description Provides weekly interaction trends (future enhancement)
   */
  getWeeklyTrends(): Observable<{ day: string; interactions: number }[]> {
    return of([
      { day: 'Lun', interactions: 45 },
      { day: 'Mar', interactions: 52 },
      { day: 'Mié', interactions: 48 },
      { day: 'Jue', interactions: 61 },
      { day: 'Vie', interactions: 38 },
      { day: 'Sáb', interactions: 22 },
      { day: 'Dom', interactions: 18 }
    ]);
  }

  /**
   * Gets response time distribution data
   *
   * @returns Observable with response time distribution
   *
   * @description Analyzes response time patterns (future enhancement)
   */
  getResponseTimeDistribution(): Observable<{ range: string; count: number }[]> {
    return of([
      { range: '0-1s', count: 42 },
      { range: '1-2s', count: 28 },
      { range: '2-3s', count: 15 },
      { range: '3-5s', count: 8 },
      { range: '5s+', count: 3 }
    ]);
  }

  /**
   * Gets top medical categories by usage
   *
   * @returns Observable with top medical categories
   *
   * @description Provides top medical categories analysis (future enhancement)
   */
  getTopMedicalCategories(): Observable<{ category: string; count: number; percentage: number }[]> {
    return of([
      { category: 'Cardiología', count: 32, percentage: 24.1 },
      { category: 'Neurología', count: 28, percentage: 21.1 },
      { category: 'Gastroenterología', count: 22, percentage: 16.5 },
      { category: 'Endocrinología', count: 18, percentage: 13.5 },
      { category: 'Dermatología', count: 15, percentage: 11.3 },
      { category: 'Otros', count: 18, percentage: 13.5 }
    ]);
  }

  /**
   * Gets default hourly data for error fallback
   *
   * @returns Default hourly interaction data
   * @private
   */
  private getDefaultHourlyData(): HourlyInteractionData[] {
    const defaultData: HourlyInteractionData[] = [];

    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, '0') + ':00';
      // Mock realistic interaction pattern
      let count = 0;
      if (i >= 8 && i <= 18) { // Business hours
        count = Math.floor(Math.random() * 15) + 5;
      } else if (i >= 19 && i <= 23) { // Evening
        count = Math.floor(Math.random() * 8) + 2;
      } else { // Night/Early morning
        count = Math.floor(Math.random() * 3);
      }

      defaultData.push({ hour, count });
    }

    return defaultData;
  }

  /**
   * Gets default pills distribution for error fallback
   *
   * @returns Default pills distribution data
   * @private
   */
  private getDefaultPillsDistribution(): PillsDistributionData[] {
    return [
      { category: 'Diagnóstico', count: 25, color: this.pillsColors.diagnosis },
      { category: 'Síntomas', count: 20, color: this.pillsColors.symptoms },
      { category: 'Tratamiento', count: 15, color: this.pillsColors.treatment },
      { category: 'Medicamentos', count: 12, color: this.pillsColors.medication },
      { category: 'Exámenes', count: 10, color: this.pillsColors.tests },
      { category: 'Emergencia', count: 8, color: this.pillsColors.emergency },
      { category: 'Seguimiento', count: 6, color: this.pillsColors['follow-up'] },
      { category: 'Prevención', count: 4, color: this.pillsColors.prevention }
    ];
  }

  /**
   * Gets color for a specific pills category
   *
   * @param category - Category name
   * @returns Color hex code
   *
   * @description Provides consistent color mapping for pills categories
   */
  getPillsCategoryColor(category: string): string {
    const normalizedCategory = category.toLowerCase();
    return this.pillsColors[normalizedCategory as keyof typeof this.pillsColors] || '#6B7280';
  }

  /**
   * Gets Spanish label for pills category
   *
   * @param category - Category name in English
   * @returns Spanish label
   *
   * @description Provides localized labels for pills categories
   */
  getPillsCategoryLabel(category: string): string {
    const normalizedCategory = category.toLowerCase();
    return this.pillsLabels[normalizedCategory as keyof typeof this.pillsLabels] || category;
  }
}
