import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { DashboardMetricsService } from './services/dashboard-metrics.service';
import { AnalyticsService } from './services/analytics.service';
import { UiStateService } from '@core/services';
import { MetricCardComponent } from './components/metric-card/metric-card.component';
import { AnalyticsChartComponent } from './components/analytics-chart/analytics-chart.component';

/**
 * Interface for dashboard metrics data
 */
interface DashboardMetrics {
  consultationsToday: number;
  averageResponseTime: number;
}

/**
 * Interface for chart data
 */
interface ChartData {
  interactionsByHour: { hour: string; count: number }[];
  pillsDistribution: { category: string; count: number; color: string }[];
}

/**
 * Admin Dashboard component for TecSalud Medical Assistant
 *
 * @description Administrative dashboard displaying key operational metrics
 * of the medical system including consultations, response times, token usage,
 * processed documents, and interaction analysis by category.
 *
 * @example
 * ```typescript
 * // Accessed automatically via routing
 * // Route: '/admin-dashboard'
 * ```
 *
 * @features
 * - Real-time system metrics monitoring
 * - Interactive activity charts and visualizations
 * - Medical pill usage analysis and distribution
 * - Document processing statistics by type
 * - Responsive modern interface design
 *
 * @metrics
 * - 💬 Consultas del día
 * - ⏱️ Tiempo promedio de respuesta
 * - 🎯 Tokens consumidos (24h)
 * - 📄 Documentos procesados por tipo
 *
 * @charts
 * - Línea de tiempo: Interacciones por hora
 * - Pie chart: Distribución de categorías de pastillas
 *
 * @since 1.0.0
 */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, MetricCardComponent, AnalyticsChartComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  /** Subject for component destruction */
  private destroy$ = new Subject<void>();

  /** Dashboard metrics data */
  metrics: DashboardMetrics = {
    consultationsToday: 0,
    averageResponseTime: 0
  };

  /** Chart data for visualizations */
  chartData: ChartData = {
    interactionsByHour: [],
    pillsDistribution: []
  };

  /** Chart data objects for template binding */
  interactionsChartData: any = {
    labels: [],
    datasets: []
  };

  pillsChartData: any = {
    labels: [],
    datasets: []
  };

  /** Loading states */
  isLoadingMetrics = true;
  isLoadingCharts = true;

  /** Error states */
  hasError = false;
  errorMessage = '';

    /**
   * Creates an instance of AdminDashboardComponent
   *
   * @param dashboardMetrics - Service for dashboard metrics
   * @param analytics - Service for analytics processing
   * @param uiState - Service for UI state management
   * @param location - Angular Location service for navigation
   */
  constructor(
    private dashboardMetrics: DashboardMetricsService,
    private analytics: AnalyticsService,
    private uiState: UiStateService,
    private location: Location
  ) {}

  /**
   * Component initialization lifecycle hook
   *
   * @description Loads initial dashboard data and starts periodic updates
   */
  ngOnInit(): void {
    this.loadDashboardData();
    this.startPeriodicUpdates();
  }

  /**
   * Component cleanup lifecycle hook
   *
   * @description Stops subscriptions and cleans up resources
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Loads all dashboard data including metrics and charts
   *
   * @description Fetches metrics and chart data simultaneously for optimal performance
   */
  private loadDashboardData(): void {
    this.loadMetrics();
    this.loadChartData();
  }

  /**
   * Loads dashboard metrics from the service
   *
   * @description Retrieves consultations, response times, tokens, and documents data
   */
  private loadMetrics(): void {
    this.isLoadingMetrics = true;
    this.hasError = false;

    this.dashboardMetrics.getDashboardMetrics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (metrics) => {
          this.metrics = metrics;
          this.isLoadingMetrics = false;
        },
        error: (error) => {
          console.error('Error loading dashboard metrics:', error);
          this.handleError('Error al cargar las métricas del dashboard');
          this.isLoadingMetrics = false;
        }
      });
  }

    /**
   * Loads chart data for visualizations
   *
   * @description Retrieves interaction timeline and pills distribution data
   */
  private loadChartData(): void {
    this.isLoadingCharts = true;

    this.analytics.getInteractionsByHour()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (hourlyData) => {
          this.chartData.interactionsByHour = hourlyData;
          this.updateInteractionsChartData();
          this.loadPillsDistribution();
        },
        error: (error) => {
          console.error('Error loading hourly interactions:', error);
          this.handleError('Error al cargar datos de interacciones');
          this.isLoadingCharts = false;
        }
      });
  }

    /**
   * Loads pills distribution data for pie chart
   *
   * @description Retrieves pills usage by category with associated colors
   */
  private loadPillsDistribution(): void {
    this.analytics.getPillsDistribution()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pillsData) => {
          this.chartData.pillsDistribution = pillsData;
          this.updatePillsChartData();
          this.isLoadingCharts = false;
        },
        error: (error) => {
          console.error('Error loading pills distribution:', error);
          this.handleError('Error al cargar distribución de pastillas');
          this.isLoadingCharts = false;
        }
      });
  }

  /**
   * Updates interactions chart data for template binding
   *
   * @description Converts raw data to chart.js format for interactions timeline
   */
  private updateInteractionsChartData(): void {
    this.interactionsChartData = {
      labels: this.chartData.interactionsByHour.map(item => item.hour),
      datasets: [{
        label: 'Consultas',
        data: this.chartData.interactionsByHour.map(item => item.count),
        borderColor: '#0EA5E9',
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        borderWidth: 2,
        tension: 0.4
      }]
    };
  }

  /**
   * Updates pills chart data for template binding
   *
   * @description Converts raw data to chart.js format for pills distribution
   */
  private updatePillsChartData(): void {
    this.pillsChartData = {
      labels: this.chartData.pillsDistribution.map(item => item.category),
      datasets: [{
        data: this.chartData.pillsDistribution.map(item => item.count),
        backgroundColor: this.chartData.pillsDistribution.map(item => item.color),
        borderWidth: 0
      }]
    };
  }

  /**
   * Starts periodic updates for dashboard data
   *
   * @description Updates metrics every 5 minutes to show real-time data
   */
  private startPeriodicUpdates(): void {
    // Update metrics every 5 minutes
    setInterval(() => {
      if (!this.isLoadingMetrics && !this.isLoadingCharts) {
        this.loadDashboardData();
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Handles errors and displays user-friendly messages
   *
   * @param message - Error message to display
   */
  private handleError(message: string): void {
    this.hasError = true;
    this.errorMessage = message;
    this.uiState.showErrorToast(message);
  }

  /**
   * Navigates back to the previous page
   *
   * @description Uses Angular Location service to go back in browser history
   */
  goBack(): void {
    this.location.back();
  }

  /**
   * Manually refreshes dashboard data
   *
   * @description Triggered by user refresh action
   */
  refreshDashboard(): void {
    this.uiState.showToast('Actualizando dashboard...', 'info');
    this.loadDashboardData();
  }

  /**
   * Formats numbers for display with appropriate units
   *
   * @param value - Number to format
   * @param unit - Unit suffix (optional)
   * @returns Formatted string
   */
  formatMetricValue(value: number, unit?: string): string {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M${unit || ''}`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k${unit || ''}`;
    }
    return `${value}${unit || ''}`;
  }

    /**
   * Formats time values for display
   *
   * @param milliseconds - Time in milliseconds
   * @returns Formatted time string
   */
  formatTimeValue(milliseconds: number): string {
    if (milliseconds >= 60000) {
      return `${(milliseconds / 60000).toFixed(1)}min`;
    } else if (milliseconds >= 1000) {
      return `${(milliseconds / 1000).toFixed(1)}s`;
    }
    return `${milliseconds}ms`;
  }



  /**
   * Gets current time for display
   *
   * @returns Formatted current time string
   */
  getCurrentTime(): string {
    return new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * Gets next update time for display
   *
   * @returns Formatted next update time string
   */
  getNextUpdateTime(): string {
    const nextUpdate = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    return nextUpdate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
