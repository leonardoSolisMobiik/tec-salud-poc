import { Component, Input, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Chart type definitions
 */
export type ChartType = 'line' | 'doughnut' | 'bar';

/**
 * Chart data interface
 */
export interface ChartData {
  labels: string[];
  datasets: {
    label?: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    borderWidth?: number;
    tension?: number;
  }[];
}

/**
 * Analytics Chart component for dashboard visualizations
 *
 * @description Componente para mostrar gráficos de analytics usando Canvas API
 * con soporte para líneas de tiempo, pie charts y gráficos de barras.
 *
 * @example
 * ```html
 * <app-analytics-chart
 *   title="Interacciones por Hora"
 *   type="line"
 *   [data]="chartData"
 *   [isLoading]="false">
 * </app-analytics-chart>
 * ```
 *
 * @features
 * - Gráficos de líneas para timeline
 * - Gráficos de dona para distribución
 * - Canvas API nativo (sin dependencias externas)
 * - Estados de carga con skeleton
 * - Responsive design
 * - Tooltips interactivos en hover
 *
 * @since 1.0.0
 */
@Component({
  selector: 'app-analytics-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container">
      <div class="chart-header">
        <h3 class="chart-title">{{ title }}</h3>
      </div>

      <div class="chart-content">
        <div class="chart-skeleton" *ngIf="isLoading"></div>

        <div class="chart-wrapper" *ngIf="!isLoading">
          <canvas #chartCanvas
                  [width]="canvasWidth"
                  [height]="canvasHeight"
                  (mousemove)="onMouseMove($event)"
                  (mouseleave)="onMouseLeave()">
          </canvas>

          <div class="chart-legend" *ngIf="showLegend && legendItems.length > 0">
            <div class="legend-item" *ngFor="let item of legendItems">
              <div class="legend-color" [style.background-color]="item.color"></div>
              <span class="legend-label">{{ item.label }}</span>
              <span class="legend-value">{{ item.value }}</span>
            </div>
          </div>
        </div>

        <div class="chart-tooltip"
             *ngIf="tooltip.show"
             [style.left.px]="tooltip.x"
             [style.top.px]="tooltip.y">
          <div class="tooltip-content">
            <strong>{{ tooltip.label }}</strong>
            <span>{{ tooltip.value }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chart-container {
      background: var(--general_contrasts-surface);
      border: 1px solid var(--general_contrasts-container-outline);
      border-radius: var(--bmb-radius-l);
      padding: var(--bmb-spacing-l);
      height: 100%;
      display: flex;
      flex-direction: column;
      box-shadow: var(--medical-shadow);
      transition: all 0.3s ease;

      &:hover {
        box-shadow: var(--medical-shadow-hover);
      }
    }

    .chart-header {
      margin-bottom: var(--bmb-spacing-m);
    }

    .chart-title {
      font-size: var(--text-lg);
      font-weight: var(--font-semibold);
      color: var(--general_contrasts-text-primary);
      margin: 0;
      font-family: var(--font-display);
      line-height: var(--leading-tight);
    }

    .chart-content {
      flex: 1;
      position: relative;
      display: flex;
      flex-direction: column;
    }

    .chart-skeleton {
      width: 100%;
      height: 200px;
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
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .chart-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    canvas {
      border-radius: var(--bmb-radius-s);
      cursor: crosshair;
    }

    .chart-legend {
      display: flex;
      flex-wrap: wrap;
      gap: var(--bmb-spacing-m);
      margin-top: var(--bmb-spacing-m);
      justify-content: center;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: var(--bmb-spacing-xs);
      font-size: var(--text-sm);
      font-family: var(--font-body);
    }

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .legend-label {
      color: var(--general_contrasts-text-secondary);
      font-weight: var(--font-regular);
      line-height: var(--leading-normal);
    }

    .legend-value {
      color: var(--general_contrasts-text-primary);
      font-weight: var(--font-medium);
      line-height: var(--leading-normal);
    }

    .chart-tooltip {
      position: absolute;
      background: var(--general_contrasts-text-primary);
      color: var(--general_contrasts-surface);
      padding: var(--bmb-spacing-s);
      border-radius: var(--bmb-radius-s);
      font-size: var(--text-xs);
      font-family: var(--font-body);
      pointer-events: none;
      z-index: 1000;
      box-shadow: var(--medical-shadow);
    }

    .tooltip-content {
      display: flex;
      flex-direction: column;
      gap: 2px;

      strong {
        font-weight: var(--font-semibold);
        line-height: var(--leading-normal);
      }

      span {
        font-weight: var(--font-regular);
        line-height: var(--leading-normal);
      }
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .chart-container {
        padding: var(--bmb-spacing-m);
      }

      .chart-title {
        font-size: var(--text-base);
      }

      .chart-legend {
        gap: var(--bmb-spacing-s);
      }

      .legend-item {
        font-size: var(--text-xs);
      }
    }
  `]
})
export class AnalyticsChartComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('chartCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  /** Chart title */
  @Input() title: string = '';

  /** Chart type */
  @Input() type: ChartType = 'line';

  /** Chart data */
  @Input() data: ChartData = { labels: [], datasets: [] };

  /** Loading state */
  @Input() isLoading: boolean = false;

  /** Show legend */
  @Input() showLegend: boolean = true;

  /** Canvas dimensions */
  canvasWidth = 400;
  canvasHeight = 200;

  /** Chart context */
  private ctx: CanvasRenderingContext2D | null = null;

  /** Legend items */
  legendItems: { label: string; value: string; color: string }[] = [];

  /** Tooltip state */
  tooltip = {
    show: false,
    x: 0,
    y: 0,
    label: '',
    value: ''
  };

  /** Animation frame ID */
  private animationId: number | null = null;

  ngOnInit(): void {
    this.updateCanvasSize();
    this.generateLegend();
  }

  ngAfterViewInit(): void {
    if (this.canvasRef?.nativeElement) {
      this.ctx = this.canvasRef.nativeElement.getContext('2d');
      this.drawChart();
    }
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  /**
   * Updates canvas size based on container
   */
  private updateCanvasSize(): void {
    // Responsive canvas sizing
    this.canvasWidth = window.innerWidth < 768 ? 300 : 400;
    this.canvasHeight = 200;
  }

  /**
   * Generates legend items from chart data
   */
  private generateLegend(): void {
    if (!this.data.datasets.length) return;

    this.legendItems = this.data.datasets.map((dataset, index) => ({
      label: dataset.label || `Serie ${index + 1}`,
      value: dataset.data.reduce((sum, val) => sum + val, 0).toString(),
      color: Array.isArray(dataset.backgroundColor)
        ? dataset.backgroundColor[0]
        : dataset.backgroundColor || '#0EA5E9'
    }));
  }

  /**
   * Draws the chart based on type
   */
  private drawChart(): void {
    if (!this.ctx || !this.data.labels.length) return;

    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    switch (this.type) {
      case 'line':
        this.drawLineChart();
        break;
      case 'doughnut':
        this.drawDoughnutChart();
        break;
      case 'bar':
        this.drawBarChart();
        break;
    }
  }

  /**
   * Draws line chart
   */
  private drawLineChart(): void {
    if (!this.ctx || !this.data.datasets.length) return;

    const dataset = this.data.datasets[0];
    const padding = 40;
    const chartWidth = this.canvasWidth - padding * 2;
    const chartHeight = this.canvasHeight - padding * 2;

    const maxValue = Math.max(...dataset.data);
    const minValue = Math.min(...dataset.data);
    const range = maxValue - minValue || 1;

    // Draw grid
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    this.ctx.lineWidth = 1;

    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = padding + (i * chartHeight / 4);
      this.ctx.beginPath();
      this.ctx.moveTo(padding, y);
      this.ctx.lineTo(this.canvasWidth - padding, y);
      this.ctx.stroke();
    }

    // Draw line
    this.ctx.strokeStyle = dataset.borderColor || '#0EA5E9';
    this.ctx.lineWidth = dataset.borderWidth || 2;
    this.ctx.beginPath();

    dataset.data.forEach((value, index) => {
      const x = padding + (index * chartWidth / (dataset.data.length - 1));
      const y = padding + chartHeight - ((value - minValue) / range * chartHeight);

      if (index === 0) {
        this.ctx!.moveTo(x, y);
      } else {
        this.ctx!.lineTo(x, y);
      }
    });

    this.ctx.stroke();

    // Draw points
    this.ctx.fillStyle = dataset.borderColor || '#0EA5E9';
    dataset.data.forEach((value, index) => {
      const x = padding + (index * chartWidth / (dataset.data.length - 1));
      const y = padding + chartHeight - ((value - minValue) / range * chartHeight);

      this.ctx!.beginPath();
      this.ctx!.arc(x, y, 3, 0, 2 * Math.PI);
      this.ctx!.fill();
    });
  }

  /**
   * Draws doughnut chart
   */
  private drawDoughnutChart(): void {
    if (!this.ctx || !this.data.datasets.length) return;

    const dataset = this.data.datasets[0];
    const centerX = this.canvasWidth / 2;
    const centerY = this.canvasHeight / 2;
    const radius = Math.min(centerX, centerY) - 20;
    const innerRadius = radius * 0.6;

    const total = dataset.data.reduce((sum, val) => sum + val, 0);
    let currentAngle = -Math.PI / 2;

    dataset.data.forEach((value, index) => {
      const sliceAngle = (value / total) * 2 * Math.PI;
      const color = Array.isArray(dataset.backgroundColor)
        ? dataset.backgroundColor[index]
        : dataset.backgroundColor || '#0EA5E9';

      // Draw slice
      this.ctx!.fillStyle = color;
      this.ctx!.beginPath();
      this.ctx!.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      this.ctx!.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
      this.ctx!.closePath();
      this.ctx!.fill();

      currentAngle += sliceAngle;
    });
  }

  /**
   * Draws bar chart
   */
  private drawBarChart(): void {
    if (!this.ctx || !this.data.datasets.length) return;

    const dataset = this.data.datasets[0];
    const padding = 40;
    const chartWidth = this.canvasWidth - padding * 2;
    const chartHeight = this.canvasHeight - padding * 2;

    const maxValue = Math.max(...dataset.data);
    const barWidth = chartWidth / dataset.data.length * 0.8;
    const barSpacing = chartWidth / dataset.data.length * 0.2;

    dataset.data.forEach((value, index) => {
      const barHeight = (value / maxValue) * chartHeight;
      const x = padding + index * (barWidth + barSpacing);
      const y = padding + chartHeight - barHeight;

      this.ctx!.fillStyle = Array.isArray(dataset.backgroundColor)
        ? dataset.backgroundColor[index]
        : dataset.backgroundColor || '#0EA5E9';

      this.ctx!.fillRect(x, y, barWidth, barHeight);
    });
  }

  /**
   * Handles mouse move for tooltips
   */
  onMouseMove(event: MouseEvent): void {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Simple tooltip logic for line charts
    if (this.type === 'line' && this.data.datasets.length > 0) {
      const dataset = this.data.datasets[0];
      const padding = 40;
      const chartWidth = this.canvasWidth - padding * 2;

      const pointIndex = Math.round((x - padding) / chartWidth * (dataset.data.length - 1));

      if (pointIndex >= 0 && pointIndex < dataset.data.length) {
        this.tooltip = {
          show: true,
          x: event.clientX - rect.left + 10,
          y: event.clientY - rect.top - 10,
          label: this.data.labels[pointIndex],
          value: dataset.data[pointIndex].toString()
        };
      }
    }
  }

  /**
   * Handles mouse leave
   */
  onMouseLeave(): void {
    this.tooltip.show = false;
  }


}
