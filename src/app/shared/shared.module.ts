import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Importar componentes específicos de Bamboo
import { 
  BmbSearchInputComponent,
  BmbCardComponent,
  BmbCardHeaderComponent,
  BmbCardContentComponent,
  BmbCardFooterComponent,
  BmbChatBubblesComponent,
  BmbToastComponent,
  BmbIconComponent,
  BmbBadgeComponent
} from '@ti-tecnologico-de-monterrey-oficial/ds-ng';

// Componentes locales
import { SidebarComponent } from './components/layout/sidebar/sidebar.component';
import { AppShellComponent } from './components/layout/app-shell/app-shell.component';
import { HeaderComponent } from './components/layout/header/header.component';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';
import { GlobalLoaderComponent } from './components/global-loader/global-loader.component';

@NgModule({
  declarations: [
    SidebarComponent,
    AppShellComponent,
    HeaderComponent,
    ToastContainerComponent,
    GlobalLoaderComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    // Bamboo Components
    BmbSearchInputComponent,
    BmbCardComponent,
    BmbCardHeaderComponent,
    BmbCardContentComponent,
    BmbCardFooterComponent,
    BmbChatBubblesComponent,
    BmbToastComponent,
    BmbIconComponent,
    BmbBadgeComponent
  ],
  exports: [
    // Módulos comunes
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    // Componentes locales
    SidebarComponent,
    AppShellComponent,
    HeaderComponent,
    ToastContainerComponent,
    GlobalLoaderComponent,
    // Bamboo Components
    BmbSearchInputComponent,
    BmbCardComponent,
    BmbCardHeaderComponent,
    BmbCardContentComponent,
    BmbCardFooterComponent,
    BmbChatBubblesComponent,
    BmbToastComponent,
    BmbIconComponent,
    BmbBadgeComponent
  ]
})
export class SharedModule { } 