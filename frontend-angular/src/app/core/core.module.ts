import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { 
  ApiService, 
  MedicalStateService, 
  StreamingService, 
  UiStateService 
} from './services';

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule
  ],
  providers: [
    ApiService,
    MedicalStateService,
    StreamingService,
    UiStateService
  ]
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import it in the AppModule only');
    }
  }
}