import { Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class MedicalIconsService {
  private icons: { [key: string]: string } = {
    stethoscope: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21C12.83 21 13.5 20.33 13.5 19.5C13.5 19.11 13.35 18.76 13.11 18.49C12.88 18.23 12.73 17.88 12.73 17.5C12.73 16.67 13.4 16 14.23 16H16C18.76 16 21 13.76 21 11C21 6.58 16.97 3 12 3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="7.5" cy="11.5" r="1.5" fill="currentColor"/>
      <circle cx="11.5" cy="7.5" r="1.5" fill="currentColor"/>
      <circle cx="16.5" cy="11.5" r="1.5" fill="currentColor"/>
    </svg>`,
    
    heartbeat: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5C22 12.27 18.6 15.36 13.45 20.03L12 21.35Z" fill="currentColor"/>
      <path d="M7 12H9L11 9L13 15L15 12H17" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    
    patient: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="3" stroke="currentColor" stroke-width="2"/>
      <path d="M16 14H8C6.89543 14 6 14.8954 6 16V20C6 21.1046 6.89543 22 8 22H16C17.1046 22 18 21.1046 18 20V16C18 14.8954 17.1046 14 16 14Z" stroke="currentColor" stroke-width="2"/>
    </svg>`,
    
    medical_history: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12 11V17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M9 14H15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    
    prescription: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 3H15L17 5L19 7V13L17 15L15 17H9L7 15L5 13V7L7 5L9 3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12 8V16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M8 12H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    
    chat_medical: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 2H4C2.9 2 2 2.9 2 4V16C2 17.1 2.9 18 4 18H8L12 22L16 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12 6V12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M9 9H15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    
    laboratory: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 2V9L6 15V22H18V15L15 9V2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M6 2H18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M8 15H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <circle cx="10" cy="18" r="1" fill="currentColor"/>
      <circle cx="14" cy="19" r="1" fill="currentColor"/>
      <circle cx="12" cy="17" r="1" fill="currentColor"/>
    </svg>`
  };

  constructor(private sanitizer: DomSanitizer) {}

  getIcon(name: string): SafeHtml {
    const icon = this.icons[name] || this.getDefaultIcon();
    return this.sanitizer.bypassSecurityTrustHtml(icon);
  }

  private getDefaultIcon(): string {
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
      <path d="M12 7V12L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`;
  }

  // Get all available icon names
  getAvailableIcons(): string[] {
    return Object.keys(this.icons);
  }
} 