import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Metric Card component for displaying dashboard metrics
 *
 * @description Tarjeta reutilizable para mostrar métricas del dashboard con
 * diseño consistente, iconos, valores y estados de carga.
 *
 * @example
 * ```html
 * <app-metric-card
 *   title="Consultas Hoy"
 *   value="47"
 *   icon="💬"
 *   trend="+12%"
 *   trendUp="true"
 *   [isLoading]="false">
 * </app-metric-card>
 * ```
 *
 * @features
 * - Diseño consistente con Bamboo Design System
 * - Estados de carga con skeleton
 * - Indicadores de tendencia opcionales
 * - Iconos personalizables
 * - Responsive design
 *
 * @since 1.0.0
 */
@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="metric-card" [class.loading]="isLoading">
      <div class="metric-header">
        <div class="metric-icon">{{ icon }}</div>
        <div class="metric-title">{{ title }}</div>
      </div>

      <div class="metric-content">
        <div class="metric-value" *ngIf="!isLoading">{{ value }}</div>
        <div class="metric-skeleton" *ngIf="isLoading"></div>

        <div class="metric-trend" *ngIf="trend && !isLoading" [class.trend-up]="trendUp" [class.trend-down]="!trendUp">
          <span class="trend-icon">{{ trendUp ? '↗' : '↘' }}</span>
          <span class="trend-value">{{ trend }}</span>
        </div>
      </div>

      <div class="metric-subtitle" *ngIf="subtitle && !isLoading">{{ subtitle }}</div>
    </div>
  `,
  styles: [`
    .metric-card {
      background: var(--general_contrasts-surface);
      border: 1px solid var(--general_contrasts-container-outline);
      border-radius: var(--bmb-radius-l);
      padding: var(--bmb-spacing-l);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      box-shadow: var(--medical-shadow);

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--medical-shadow-hover);
        border-color: rgba(var(--color-blue-tec), 0.3);
      }

      &.loading {
        pointer-events: none;
      }
    }

    .metric-header {
      display: flex;
      align-items: center;
      gap: var(--bmb-spacing-s);
      margin-bottom: var(--bmb-spacing-m);
    }

    .metric-icon {
      font-size: var(--text-2xl);
      line-height: var(--leading-normal);
      opacity: 0.8;
    }

    .metric-title {
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
      color: var(--general_contrasts-text-secondary);
      font-family: var(--font-body);
      line-height: var(--leading-normal);
    }

    .metric-content {
      margin-bottom: var(--bmb-spacing-s);
    }

    .metric-value {
      font-size: var(--text-3xl);
      font-weight: var(--font-bold);
      color: var(--general_contrasts-text-primary);
      line-height: var(--leading-tight);
      font-family: var(--font-display);
    }

    .metric-skeleton {
      width: 80%;
      height: 2rem;
      background: linear-gradient(
        90deg,
        var(--general_contrasts-15) 0%,
        var(--general_contrasts-25) 50%,
        var(--general_contrasts-15) 100%
      );
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
      border-radius: var(--bmb-radius-s);
    }

    @keyframes loading {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }

    .metric-trend {
      display: flex;
      align-items: center;
      gap: var(--bmb-spacing-xs);
      margin-top: var(--bmb-spacing-xs);

      &.trend-up {
        color: var(--semantic-success);
      }

      &.trend-down {
        color: var(--semantic-error);
      }
    }

    .trend-icon {
      font-size: var(--text-sm);
      font-weight: var(--font-semibold);
      line-height: var(--leading-normal);
    }

    .trend-value {
      font-size: var(--text-xs);
      font-weight: var(--font-semibold);
      font-family: var(--font-body);
      line-height: var(--leading-normal);
    }

    .metric-subtitle {
      font-size: var(--text-xs);
      color: var(--general_contrasts-50);
      font-weight: var(--font-regular);
      font-family: var(--font-body);
      line-height: var(--leading-normal);
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .metric-card {
        padding: var(--bmb-spacing-m);
      }

      .metric-value {
        font-size: var(--text-2xl);
      }

      .metric-icon {
        font-size: var(--text-xl);
      }
    }
  `]
})
export class MetricCardComponent {
  /** Card title */
  @Input() title: string = '';

  /** Metric value to display */
  @Input() value: string = '';

  /** Icon emoji or symbol */
  @Input() icon: string = '';

  /** Optional trend indicator */
  @Input() trend?: string;

  /** Whether trend is positive (up) or negative (down) */
  @Input() trendUp: boolean = true;

  /** Optional subtitle */
  @Input() subtitle?: string;

  /** Loading state */
  @Input() isLoading: boolean = false;
}
