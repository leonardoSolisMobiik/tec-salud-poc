import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MedicalIconsService } from './medical-icons.service';
import { SafeHtml } from '@angular/platform-browser';

/**
 * Medical Icon Component for displaying healthcare-specific SVG icons
 * 
 * @description Reusable component for displaying medical icons from the
 * MedicalIconsService. Supports customizable size, color, and icon selection
 * with safe HTML rendering and responsive design.
 * 
 * @example
 * ```typescript
 * // Basic usage
 * <app-medical-icon name="stethoscope"></app-medical-icon>
 * 
 * // Custom size and color
 * <app-medical-icon 
 *   name="heartbeat" 
 *   [size]="32" 
 *   color="#ff4444">
 * </app-medical-icon>
 * 
 * // In Angular templates
 * <app-medical-icon 
 *   [name]="iconName" 
 *   [size]="iconSize" 
 *   [color]="themeColor">
 * </app-medical-icon>
 * ```
 * 
 * @features
 * - Medical-specific icon library integration
 * - Customizable size and color
 * - Safe HTML rendering with XSS protection
 * - Responsive SVG scaling
 * - Fallback to default icon for unknown names
 * 
 * @inputs
 * - name: Icon name from medical icons collection
 * - size: Icon size in pixels (default: 24)
 * - color: Icon color (default: 'currentColor')
 * 
 * @availableIcons
 * - stethoscope: Medical examination tool
 * - heartbeat: Cardiac monitoring
 * - patient: Patient records
 * - medical_history: Medical documentation
 * - prescription: Medication management
 * - chat_medical: Medical consultations
 * - laboratory: Lab tests and analysis
 * 
 * @since 1.0.0
 */
@Component({
  selector: 'app-medical-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="medical-icon" 
          [style.width.px]="size" 
          [style.height.px]="size"
          [style.color]="color"
          [innerHTML]="iconContent">
    </span>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
    
    .medical-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      
      ::ng-deep svg {
        width: 100%;
        height: 100%;
      }
    }
  `]
})
export class MedicalIconComponent implements OnInit {
  /** Name of the medical icon to display */
  @Input() name: string = 'patient';
  
  /** Size of the icon in pixels */
  @Input() size: number = 24;
  
  /** Color of the icon (CSS color value) */
  @Input() color: string = 'currentColor';
  
  /** Safe HTML content for the icon SVG */
  iconContent: SafeHtml = '';

  /**
   * Creates an instance of MedicalIconComponent
   * 
   * @param iconService - Service for retrieving medical icons
   */
  constructor(private iconService: MedicalIconsService) {}

  /**
   * Component initialization lifecycle hook
   * 
   * @description Loads the icon content from the medical icons service
   * based on the provided icon name. Uses safe HTML rendering to prevent XSS.
   * 
   * @example
   * ```typescript
   * // Component automatically loads icon on initialization
   * // For icon name "stethoscope", loads stethoscope SVG
   * // For unknown names, loads default icon
   * ```
   */
  ngOnInit(): void {
    this.iconContent = this.iconService.getIcon(this.name);
  }
} 