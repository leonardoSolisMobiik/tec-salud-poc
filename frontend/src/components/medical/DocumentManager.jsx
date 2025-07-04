import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, FileText, Search, Download, Trash2, 
  Eye, Calendar, User, AlertCircle, CheckCircle,
  Loader, Plus, Filter
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useMedicalStore } from '../../stores/medicalStore';
import { useUIStore } from '../../stores/uiStore';
import apiService from '../../services/apiService';

// Styled Components
const DocumentsContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${props => props.theme.colors.background.primary};
`;

const DocumentsHeader = styled.div`
  padding: ${props => props.theme.spacing.lg};
  border-bottom: 1px solid ${props => props.theme.colors.border.light};
  background: ${props => props.theme.colors.background.secondary};
`;

const HeaderTitle = styled.h2`
  font-size: ${props => props.theme.typography.fontSize.lg};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text.primary};
  margin: 0 0 ${props => props.theme.spacing.sm} 0;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  align-items: center;
  flex-wrap: wrap;
`;

const SearchContainer = styled.div`
  position: relative;
  flex: 1;
  min-width: 200px;
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

const UploadArea = styled.div`
  margin: ${props => props.theme.spacing.lg};
  padding: ${props => props.theme.spacing.xl};
  border: 2px dashed ${props => props.theme.colors.border.light};
  border-radius: ${props => props.theme.borderRadius.lg};
  text-align: center;
  background: ${props => props.theme.colors.background.secondary};
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    border-color: ${props => props.theme.colors.primary.main};
    background: ${props => props.theme.colors.primary.light};
  }

  ${props => props.isDragOver && `
    border-color: ${props.theme.colors.primary.main};
    background: ${props.theme.colors.primary.light};
  `}
`;

const UploadIcon = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: ${props => props.theme.colors.primary.main};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto ${props => props.theme.spacing.md};
`;

const UploadText = styled.p`
  font-size: ${props => props.theme.typography.fontSize.md};
  color: ${props => props.theme.colors.text.primary};
  margin: 0 0 ${props => props.theme.spacing.sm} 0;
`;

const UploadSubtext = styled.p`
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.secondary};
  margin: 0;
`;

const DocumentsList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${props => props.theme.spacing.lg};
`;

const DocumentCard = styled(motion.div)`
  padding: ${props => props.theme.spacing.md};
  border: 1px solid ${props => props.theme.colors.border.light};
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.theme.colors.background.secondary};
  margin-bottom: ${props => props.theme.spacing.sm};
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.theme.colors.primary.main};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

const DocumentHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const DocumentIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.theme.colors.primary.light};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.primary.main};
  flex-shrink: 0;
`;

const DocumentInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const DocumentTitle = styled.h3`
  font-size: ${props => props.theme.typography.fontSize.md};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text.primary};
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const DocumentMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.secondary};
`;

const DocumentActions = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.xs};
`;

const ActionButton = styled(Button)`
  padding: ${props => props.theme.spacing.xs};
  min-width: 32px;
  height: 32px;
`;

const DocumentPreview = styled.div`
  margin-top: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.sm};
  background: ${props => props.theme.colors.background.primary};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.secondary};
  line-height: 1.4;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xl};
  color: ${props => props.theme.colors.text.secondary};
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.xl};
  gap: ${props => props.theme.spacing.md};
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

const UploadProgress = styled.div`
  margin-top: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background.primary};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.border.light};
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: ${props => props.theme.colors.background.secondary};
  border-radius: 4px;
  overflow: hidden;
  margin: ${props => props.theme.spacing.sm} 0;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: ${props => props.theme.colors.primary.main};
  transition: width 0.3s ease;
  width: ${props => props.progress}%;
`;

const HiddenFileInput = styled.input`
  display: none;
`;

export const DocumentManager = () => {
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const { selectedPatient } = useMedicalStore();
  const { showToast } = useUIStore();
  
  const fileInputRef = React.useRef(null);

  // Load documents when patient changes
  useEffect(() => {
    if (selectedPatient) {
      loadPatientDocuments();
    } else {
      loadAllDocuments();
    }
  }, [selectedPatient]);

  // Search documents when query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      searchDocuments();
    } else if (selectedPatient) {
      loadPatientDocuments();
    } else {
      loadAllDocuments();
    }
  }, [searchQuery]);

  const loadPatientDocuments = async () => {
    if (!selectedPatient) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getPatientDocuments(selectedPatient.id);
      setDocuments(response);
    } catch (err) {
      console.error('Error loading patient documents:', err);
      setError('Error al cargar documentos del paciente');
      showToast('Error al cargar documentos', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllDocuments = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.listDocuments();
      setDocuments(response.documents);
    } catch (err) {
      console.error('Error loading documents:', err);
      setError('Error al cargar documentos');
      showToast('Error al cargar documentos', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const searchDocuments = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.searchDocuments(
        searchQuery,
        selectedPatient?.id
      );
      setDocuments(response.results);
    } catch (err) {
      console.error('Error searching documents:', err);
      setError('Error en la búsqueda de documentos');
      showToast('Error en la búsqueda', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (files) => {
    if (!selectedPatient) {
      showToast('Selecciona un paciente primero', 'warning');
      return;
    }

    Array.from(files).forEach(file => {
      uploadDocument(file);
    });
  };

  const uploadDocument = async (file) => {
    setUploadProgress({ fileName: file.name, progress: 0 });
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 200);

      const response = await apiService.uploadDocument(
        file,
        selectedPatient.id,
        'general',
        file.name
      );

      clearInterval(progressInterval);
      setUploadProgress({ fileName: file.name, progress: 100 });

      // Reload documents
      setTimeout(() => {
        setUploadProgress(null);
        loadPatientDocuments();
        showToast('Documento subido exitosamente', 'success');
      }, 1000);

    } catch (err) {
      console.error('Error uploading document:', err);
      setUploadProgress(null);
      showToast(`Error al subir ${file.name}`, 'error');
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este documento?')) {
      return;
    }

    try {
      await apiService.deleteDocument(documentId);
      setDocuments(prev => prev.filter(doc => doc.document_id !== documentId));
      showToast('Documento eliminado', 'success');
    } catch (err) {
      console.error('Error deleting document:', err);
      showToast('Error al eliminar documento', 'error');
    }
  };

  const handleViewDocument = async (documentId) => {
    try {
      const response = await apiService.getDocument(documentId);
      // Here you would open a modal or new tab to view the document
      console.log('Document content:', response);
      showToast('Abriendo documento...', 'info');
    } catch (err) {
      console.error('Error viewing document:', err);
      showToast('Error al abrir documento', 'error');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDocumentTypeColor = (type) => {
    const colors = {
      'laboratorio': '#10B981',
      'radiologia': '#8B5CF6',
      'consulta': '#3B82F6',
      'receta': '#F59E0B',
      'general': '#6B7280'
    };
    return colors[type] || colors.general;
  };

  return (
    <DocumentsContainer>
      <DocumentsHeader>
        <HeaderTitle>
          Documentos Médicos
          {selectedPatient && ` - ${selectedPatient.name}`}
        </HeaderTitle>
        
        <HeaderActions>
          <SearchContainer>
            <SearchIcon size={20} />
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar documentos..."
            />
          </SearchContainer>
          
          <Button
            variant="primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={!selectedPatient}
          >
            <Plus size={20} />
            Subir Documento
          </Button>
        </HeaderActions>
      </DocumentsHeader>

      {!selectedPatient && (
        <UploadArea>
          <UploadIcon>
            <User size={30} color="white" />
          </UploadIcon>
          <UploadText>Selecciona un paciente</UploadText>
          <UploadSubtext>
            Para gestionar documentos, primero selecciona un paciente
          </UploadSubtext>
        </UploadArea>
      )}

      {selectedPatient && (
        <UploadArea
          isDragOver={isDragOver}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadIcon>
            <Upload size={30} color="white" />
          </UploadIcon>
          <UploadText>Arrastra archivos aquí o haz clic para seleccionar</UploadText>
          <UploadSubtext>
            Soporta PDF, TXT, DOC, DOCX (máx. 10MB)
          </UploadSubtext>
          
          {uploadProgress && (
            <UploadProgress>
              <div>Subiendo: {uploadProgress.fileName}</div>
              <ProgressBar>
                <ProgressFill progress={uploadProgress.progress} />
              </ProgressBar>
              <div>{uploadProgress.progress}%</div>
            </UploadProgress>
          )}
        </UploadArea>
      )}

      <DocumentsList>
        {error && (
          <ErrorState>
            <AlertCircle size={20} />
            {error}
          </ErrorState>
        )}

        {isLoading && (
          <LoadingState>
            <LoadingSpinner size="sm" />
            <span>Cargando documentos...</span>
          </LoadingState>
        )}

        {!isLoading && documents.length === 0 && !error && (
          <EmptyState>
            {searchQuery.trim() 
              ? 'No se encontraron documentos que coincidan con la búsqueda'
              : selectedPatient 
                ? 'Este paciente no tiene documentos aún'
                : 'No hay documentos disponibles'
            }
          </EmptyState>
        )}

        <AnimatePresence>
          {documents.map((document, index) => (
            <DocumentCard
              key={document.document_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <DocumentHeader>
                <DocumentIcon>
                  <FileText size={20} />
                </DocumentIcon>
                
                <DocumentInfo>
                  <DocumentTitle>{document.title}</DocumentTitle>
                  <DocumentMeta>
                    <Badge 
                      variant="secondary" 
                      size="sm"
                      style={{ 
                        backgroundColor: getDocumentTypeColor(document.document_type) + '20',
                        color: getDocumentTypeColor(document.document_type)
                      }}
                    >
                      {document.document_type}
                    </Badge>
                    
                    {document.date && (
                      <>
                        <Calendar size={14} />
                        {new Date(document.date).toLocaleDateString()}
                      </>
                    )}
                    
                    {document.metadata?.file_size && (
                      <span>{formatFileSize(document.metadata.file_size)}</span>
                    )}
                  </DocumentMeta>
                </DocumentInfo>

                <DocumentActions>
                  <ActionButton
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDocument(document.document_id)}
                  >
                    <Eye size={16} />
                  </ActionButton>
                  
                  <ActionButton
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteDocument(document.document_id)}
                  >
                    <Trash2 size={16} />
                  </ActionButton>
                </DocumentActions>
              </DocumentHeader>

              {document.preview && (
                <DocumentPreview>
                  {document.preview}
                </DocumentPreview>
              )}
            </DocumentCard>
          ))}
        </AnimatePresence>
      </DocumentsList>

      <HiddenFileInput
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.txt,.doc,.docx"
        onChange={(e) => handleFileSelect(e.target.files)}
      />
    </DocumentsContainer>
  );
};

