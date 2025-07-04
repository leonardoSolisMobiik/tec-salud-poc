export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'M' | 'F' | 'Otro';
  birth_date: string;
  phone?: string;
  email?: string;
  address?: string;
  medical_record_number?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PatientInteraction {
  id?: string;
  patient_id: string;
  interaction_type: 'chat' | 'document' | 'analysis';
  summary: string;
  timestamp: string;
  metadata?: any;
}

export interface PatientSearchResult {
  patients: Patient[];
  total: number;
  page: number;
  per_page: number;
}