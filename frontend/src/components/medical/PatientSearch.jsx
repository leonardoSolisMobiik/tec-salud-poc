import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Calendar, Phone, Mail, AlertCircle, Loader } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useMedicalStore } from '../../stores/medicalStore';
import { useUIStore } from '../../stores/uiStore';
import apiService from '../../services/apiService';

// Styled Components
const SearchContainer = styled.div`
  padding: ${props => props.theme.spacing.lg};
`;

const SearchInputContainer = styled.div`
  position: relative;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const SearchInput = styled(Input)`
  padding-left: 40px;
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme.colors.text.muted};
  pointer-events: none;
`;

const SearchResults = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
  max-height: 400px;
  overflow-y: auto;
`;

const PatientCard = styled(motion.div)`
  padding: ${props => props.theme.spacing.md};
  border: 1px solid ${props => props.theme.colors.border.light};
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.theme.colors.background.secondary};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.theme.colors.primary.main};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  ${props => props.selected && `
    border-color: ${props.theme.colors.primary.main};
    background: ${props.theme.colors.primary.light};
  `}
`;

const PatientHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const PatientAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${props => props.theme.colors.primary.main};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  flex-shrink: 0;
`;

const PatientInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const PatientName = styled.h3`
  font-size: ${props => props.theme.typography.fontSize.md};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text.primary};
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const PatientId = styled.p`
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.secondary};
  margin: 0;
`;

const PatientDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.sm};
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.secondary};
`;

const PatientConditions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.xs};
  margin-top: ${props => props.theme.spacing.sm};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xl};
  color: ${props => props.theme.colors.text.secondary};
`;

const ErrorState = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.error.light};
  border: 1px solid ${props => props.theme.colors.error.main};
  border-radius: ${props => props.theme.borderRadius.md};
  color: ${props => props.theme.colors.error.dark};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.xl};
  gap: ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.text.secondary};
`;

const SearchStats = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.md};
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.secondary};
`;

const LoadMoreButton = styled(Button)`
  width: 100%;
  margin-top: ${props => props.theme.spacing.md};
`;

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const PatientSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  
  const { selectedPatient, setSelectedPatient } = useMedicalStore();
  const { showToast } = useUIStore();
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Load initial patients
  useEffect(() => {
    loadInitialPatients();
  }, []);

  // Search when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      performSearch(debouncedSearchQuery, 0, true);
    } else {
      loadInitialPatients();
    }
  }, [debouncedSearchQuery]);

  const loadInitialPatients = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getPatients(10, 0);
      setSearchResults(response);
      setOffset(10);
      setHasMore(response.length === 10);
      setTotalResults(response.length);
    } catch (err) {
      console.error('Error loading patients:', err);
      setError('Error al cargar pacientes');
      showToast('Error al cargar pacientes', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const performSearch = async (query, searchOffset = 0, isNewSearch = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.searchPatients(query, 10, searchOffset);
      
      if (isNewSearch) {
        setSearchResults(response.patients);
        setOffset(response.offset + response.patients.length);
      } else {
        setSearchResults(prev => [...prev, ...response.patients]);
        setOffset(prev => prev + response.patients.length);
      }
      
      setTotalResults(response.total);
      setHasMore(response.offset + response.patients.length < response.total);
      
    } catch (err) {
      console.error('Error searching patients:', err);
      setError('Error en la búsqueda de pacientes');
      showToast('Error en la búsqueda', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (debouncedSearchQuery.trim()) {
      performSearch(debouncedSearchQuery, offset, false);
    } else {
      loadMorePatients();
    }
  };

  const loadMorePatients = async () => {
    setIsLoading(true);
    
    try {
      const response = await apiService.getPatients(10, offset);
      setSearchResults(prev => [...prev, ...response]);
      setOffset(prev => prev + response.length);
      setHasMore(response.length === 10);
      setTotalResults(prev => prev + response.length);
    } catch (err) {
      console.error('Error loading more patients:', err);
      showToast('Error al cargar más pacientes', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePatientSelect = async (patient) => {
    try {
      // Get detailed patient information
      const detailedPatient = await apiService.getPatient(patient.id);
      setSelectedPatient(detailedPatient);
      showToast(`Paciente ${patient.name} seleccionado`, 'success');
    } catch (err) {
      console.error('Error selecting patient:', err);
      showToast('Error al seleccionar paciente', 'error');
    }
  };

  const getPatientInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return 'N/A';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  return (
    <SearchContainer>
      <SearchInputContainer>
        <SearchIcon size={20} />
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar pacientes por nombre, ID o expediente..."
        />
      </SearchInputContainer>

      {error && (
        <ErrorState>
          <AlertCircle size={20} />
          {error}
        </ErrorState>
      )}

      {searchQuery.trim() && (
        <SearchStats>
          <span>
            {totalResults > 0 
              ? `${totalResults} resultado${totalResults !== 1 ? 's' : ''} encontrado${totalResults !== 1 ? 's' : ''}`
              : 'Sin resultados'
            }
          </span>
        </SearchStats>
      )}

      <SearchResults>
        <AnimatePresence>
          {searchResults.map((patient, index) => (
            <PatientCard
              key={patient.id}
              selected={selectedPatient?.id === patient.id}
              onClick={() => handlePatientSelect(patient)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <PatientHeader>
                <PatientAvatar>
                  {getPatientInitials(patient.name)}
                </PatientAvatar>
                <PatientInfo>
                  <PatientName>{patient.name}</PatientName>
                  <PatientId>
                    {patient.medical_record_number || patient.id}
                  </PatientId>
                </PatientInfo>
              </PatientHeader>

              <PatientDetails>
                <DetailItem>
                  <User size={16} />
                  {patient.age || calculateAge(patient.birth_date)} años, {patient.gender}
                </DetailItem>
                
                {patient.phone && (
                  <DetailItem>
                    <Phone size={16} />
                    {patient.phone}
                  </DetailItem>
                )}
                
                {patient.email && (
                  <DetailItem>
                    <Mail size={16} />
                    {patient.email}
                  </DetailItem>
                )}
                
                {patient.last_visit && (
                  <DetailItem>
                    <Calendar size={16} />
                    Última visita: {new Date(patient.last_visit).toLocaleDateString()}
                  </DetailItem>
                )}
              </PatientDetails>

              {patient.conditions && patient.conditions.length > 0 && (
                <PatientConditions>
                  {patient.conditions.slice(0, 3).map((condition, idx) => (
                    <Badge key={idx} variant="secondary" size="sm">
                      {condition}
                    </Badge>
                  ))}
                  {patient.conditions.length > 3 && (
                    <Badge variant="outline" size="sm">
                      +{patient.conditions.length - 3} más
                    </Badge>
                  )}
                </PatientConditions>
              )}
            </PatientCard>
          ))}
        </AnimatePresence>

        {isLoading && (
          <LoadingState>
            <LoadingSpinner size="sm" />
            <span>
              {searchResults.length === 0 ? 'Cargando pacientes...' : 'Cargando más...'}
            </span>
          </LoadingState>
        )}

        {searchResults.length === 0 && !isLoading && !error && (
          <EmptyState>
            {searchQuery.trim() 
              ? 'No se encontraron pacientes que coincidan con la búsqueda'
              : 'No hay pacientes disponibles'
            }
          </EmptyState>
        )}

        {hasMore && !isLoading && searchResults.length > 0 && (
          <LoadMoreButton
            variant="outline"
            onClick={handleLoadMore}
          >
            Cargar más pacientes
          </LoadMoreButton>
        )}
      </SearchResults>
    </SearchContainer>
  );
};

