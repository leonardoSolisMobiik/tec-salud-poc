  <!-- Search Section -->
  <div class="search-section">
    <bmb-search-input
      [placeholder]="'Buscar paciente...'"
      [value]="searchQuery"
      (valueChange)="onSearchChange($event)"
      [disabled]="isSearching$ | async"
      class="patient-search">
    </bmb-search-input>
  </div> 