// Datos mock de pacientes para la maqueta funcional
export const mockPatients = [
  {
    id: "12345",
    name: "Julio Gómez Martínez",
    age: 37,
    lastVisit: "2024-12-15",
    photo: null, // Se generará avatar con iniciales
    expediente: "EXP-12345",
    specialty: "Medicina Interna",
    status: "Activo",
    diagnosis: "Hipertensión arterial controlada",
  },
  {
    id: "12346", 
    name: "Carlos Gómez López",
    age: 46,
    lastVisit: "2024-12-14",
    photo: null,
    expediente: "EXP-12346",
    specialty: "Cardiología",
    status: "Seguimiento",
    diagnosis: "Cardiopatía isquémica",
  },
  {
    id: "12347",
    name: "María González Ruiz",
    age: 52,
    lastVisit: "2024-12-13",
    photo: null,
    expediente: "EXP-12347",
    specialty: "Endocrinología",
    status: "Control",
    diagnosis: "Diabetes mellitus tipo 2",
  },
  {
    id: "12348",
    name: "Ana Sofía Herrera",
    age: 32,
    lastVisit: "2024-12-12",
    photo: null,
    expediente: "EXP-12348",
    specialty: "Ginecología",
    status: "Embarazo",
    diagnosis: "Embarazo 28 semanas",
  },
  {
    id: "12349",
    name: "Roberto Jiménez López",
    age: 67,
    lastVisit: "2024-12-11",
    photo: null,
    expediente: "EXP-12349",
    specialty: "Cardiología",
    status: "Post-operatorio",
    diagnosis: "Post-IAM con angioplastia",
  },
  {
    id: "12350",
    name: "Carmen Rodríguez Vega",
    age: 45,
    lastVisit: "2024-12-10",
    photo: null,
    expediente: "EXP-12350",
    specialty: "Neurología",
    status: "Seguimiento",
    diagnosis: "Migraña crónica",
  },
  {
    id: "12351",
    name: "Luis Fernando Castro",
    age: 29,
    lastVisit: "2024-12-09",
    photo: null,
    expediente: "EXP-12351",
    specialty: "Traumatología",
    status: "Rehabilitación",
    diagnosis: "Fractura de tibia consolidada",
  },
  {
    id: "12352",
    name: "Patricia Morales Sánchez",
    age: 38,
    lastVisit: "2024-12-08",
    photo: null,
    expediente: "EXP-12352",
    specialty: "Dermatología",
    status: "Control",
    diagnosis: "Dermatitis atópica",
  },
];

// Pacientes recientes (los primeros 5)
export const recentPatients = mockPatients.slice(0, 5);

// Función para buscar pacientes
export const searchPatients = (searchTerm) => {
  if (!searchTerm || searchTerm.length < 2) {
    return [];
  }
  
  const term = searchTerm.toLowerCase();
  return mockPatients.filter(patient => 
    patient.name.toLowerCase().includes(term) ||
    patient.id.includes(term) ||
    patient.expediente.toLowerCase().includes(term) ||
    patient.diagnosis.toLowerCase().includes(term)
  ).slice(0, 5); // Máximo 5 resultados como especifica el PRD
};

// Función para obtener paciente por ID
export const getPatientById = (id) => {
  return mockPatients.find(patient => patient.id === id);
};

// Función para obtener paciente por nombre (para comandos de voz)
export const getPatientByName = (name) => {
  const searchName = name.toLowerCase();
  return mockPatients.find(patient => 
    patient.name.toLowerCase().includes(searchName)
  );
};

// Función para generar iniciales del avatar
export const getPatientInitials = (name) => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Función para formatear fecha de última visita
export const formatLastVisit = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    return 'Ayer';
  } else if (diffDays < 7) {
    return `Hace ${diffDays} días`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Hace ${weeks} semana${weeks > 1 ? 's' : ''}`;
  } else {
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
};

export default mockPatients;

