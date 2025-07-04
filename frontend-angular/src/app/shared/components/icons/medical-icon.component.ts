import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MedicalIconsService } from './medical-icons.service';
import { SafeHtml } from '@angular/platform-browser';

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
  @Input() name: string = 'patient';
  @Input() size: number = 24;
  @Input() color: string = 'currentColor';
  
  iconContent: SafeHtml = '';

  constructor(private iconService: MedicalIconsService) {}

  ngOnInit(): void {
    this.iconContent = this.iconService.getIcon(this.name);
  }
} 