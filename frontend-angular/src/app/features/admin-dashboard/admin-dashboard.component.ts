import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { DashboardMetricsService } from './services/dashboard-metrics.service';
import { UiStateService } from '@core/services';
import { ApiService } from '@core/services/api.service';
import { MetricCardComponent } from './components/metric-card/metric-card.component';

/**
 * Interface for dashboard metrics data
 */
interface DashboardMetrics {
  consultationsToday: number;
  averageResponseTime: number;
  totalDocuments?: number;
  activeUsers?: number;
  totalSessions?: number;
  totalInteractions?: number;
  activePills?: number;
  storageUsed?: number;
  avgDocumentSize?: number;
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
  imports: [CommonModule, MetricCardComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  styles: [`
    /** 🏗️ GLOBAL CONTAINER WITH SUFFICIENT SPACE */
    .global-container {
      min-height: 100vh;
      padding-bottom: 63px; /* Extra space for bottom controls */
      overflow-y: auto;
    }
  `]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  /** Subject for component destruction */
  private destroy$ = new Subject<void>();

  /** Dashboard metrics data */
  metrics: DashboardMetrics = {
    consultationsToday: 0,
    averageResponseTime: 0
  };

  /** Loading states */
  isLoadingMetrics = true;

  /** Error states */
  hasError = false;
  errorMessage = '';

    /**
   * Creates an instance of AdminDashboardComponent
   *
   * @param dashboardMetrics - Service for dashboard metrics
   * @param uiState - Service for UI state management
   * @param apiService - Service for API communications
   * @param location - Angular Location service for navigation
   */
  constructor(
    private dashboardMetrics: DashboardMetricsService,
    private uiState: UiStateService,
    private apiService: ApiService,
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
   * Loads all dashboard data
   *
   * @description Fetches platform metrics for dashboard display
   */
  private loadDashboardData(): void {
    this.loadMetrics();
  }

  /**
   * Loads dashboard metrics from multiple sources
   *
   * @description Retrieves metrics from both legacy service and new platform statistics API
   */
  private loadMetrics(): void {
    this.isLoadingMetrics = true;
    this.hasError = false;

    // Load data from both sources in parallel
    forkJoin({
      dashboardMetrics: this.dashboardMetrics.getDashboardMetrics(),
      platformStats: this.apiService.getPlatformStatistics()
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (result) => {
        // Merge data from both sources using correct API structure
        this.metrics = {
          ...result.dashboardMetrics,
          totalDocuments: result.platformStats.totals?.documents || 0,
          activeUsers: result.platformStats.totals?.unique_users || 0,
          totalSessions: result.platformStats.totals?.sessions || 0,
          totalInteractions: result.platformStats.totals?.interactions || 0,
          activePills: result.platformStats.totals?.active_pills || 0,
          storageUsed: result.platformStats.storage?.total_size_mb || 0,
          avgDocumentSize: result.platformStats.storage?.avg_size_mb || 0
        };

        console.log('📊 Combined dashboard metrics:', this.metrics);
        this.isLoadingMetrics = false;
      },
      error: (error) => {
        console.error('Error loading dashboard metrics:', error);
        this.handleError('Error al cargar las métricas del dashboard');
        this.isLoadingMetrics = false;

        // Fallback to legacy metrics only
        this.loadLegacyMetricsOnly();
      }
    });
  }

  /**
   * Fallback method to load only legacy metrics
   *
   * @description Used when platform statistics API is unavailable
   */
  private loadLegacyMetricsOnly(): void {
    this.dashboardMetrics.getDashboardMetrics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (metrics) => {
          this.metrics = metrics;
          this.isLoadingMetrics = false;
          console.log('⚠️ Using legacy metrics only:', this.metrics);
        },
        error: (error) => {
          console.error('Error loading legacy metrics:', error);
          this.isLoadingMetrics = false;
        }
      });
  }









  /**
   * Starts periodic updates for dashboard data
   *
   * @description Updates metrics every 5 minutes to show real-time data
   */
  private startPeriodicUpdates(): void {
    // Update metrics every 5 minutes
    setInterval(() => {
      if (!this.isLoadingMetrics) {
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
   * Formats storage values in MB to appropriate units
   *
   * @param valueMB - Storage value in megabytes
   * @returns Formatted string with appropriate unit (MB, GB, TB)
   */
  formatStorageValue(valueMB: number): string {
    if (valueMB >= 1024 * 1024) {
      return `${(valueMB / (1024 * 1024)).toFixed(1)} TB`;
    } else if (valueMB >= 1024) {
      return `${(valueMB / 1024).toFixed(1)} GB`;
    }
    return `${valueMB.toFixed(1)} MB`;
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
