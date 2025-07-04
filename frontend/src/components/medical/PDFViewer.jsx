import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useUIStore } from '../../stores/uiStore.js';
import { Button } from '../ui/button.jsx';
import { LoadingSpinner } from '../ui/LoadingSpinner.jsx';

// Container principal del visor PDF
const PDFContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${props => props.theme.colors.background.primary};
`;

// Header del visor
const PDFHeader = styled.div`
  padding: ${props => props.theme.spacing.lg};
  border-bottom: 1px solid ${props => props.theme.colors.gray[200]};
  background: ${props => props.theme.colors.background.secondary};
  
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.spacing.md};
`;

const PDFTitle = styled.h3`
  font-size: ${props => props.theme.typography.fontSize.base};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text.primary};
  margin: 0;
  flex: 1;
  min-width: 0;
  
  /* Truncar texto largo */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CloseButton = styled(Button)`
  flex-shrink: 0;
`;

// Controles del PDF
const PDFControls = styled.div`
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border-bottom: 1px solid ${props => props.theme.colors.gray[200]};
  background: ${props => props.theme.colors.background.tertiary};
  
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.spacing.md};
`;

const PageControls = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const PageInfo = styled.span`
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.secondary};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  min-width: 80px;
  text-align: center;
`;

const ZoomControls = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const ZoomInfo = styled.span`
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.secondary};
  min-width: 50px;
  text-align: center;
`;

// Área del documento
const DocumentArea = styled.div`
  flex: 1;
  overflow: auto;
  background: ${props => props.theme.colors.gray[100]};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.lg};
`;

// Simulación del documento PDF
const DocumentPreview = styled(motion.div)`
  background: white;
  border-radius: ${props => props.theme.borderRadius.md};
  box-shadow: ${props => props.theme.shadows.lg};
  padding: ${props => props.theme.spacing.xl};
  max-width: 100%;
  width: ${props => props.zoom}%;
  min-height: 600px;
  
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.lg};
  
  transition: width ${props => props.theme.transitions.normal};
`;

// Header del documento simulado
const DocumentHeader = styled.div`
  text-align: center;
  border-bottom: 2px solid ${props => props.theme.colors.primary.blue};
  padding-bottom: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const DocumentTitle = styled.h1`
  font-size: ${props => props.theme.typography.fontSize['2xl']};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.theme.colors.primary.blueDark};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const DocumentSubtitle = styled.h2`
  font-size: ${props => props.theme.typography.fontSize.lg};
  color: ${props => props.theme.colors.text.secondary};
  font-weight: ${props => props.theme.typography.fontWeight.normal};
`;

// Contenido del documento
const DocumentContent = styled.div`
  line-height: ${props => props.theme.typography.lineHeight.relaxed};
  color: ${props => props.theme.colors.text.primary};
  
  h3 {
    font-size: ${props => props.theme.typography.fontSize.lg};
    font-weight: ${props => props.theme.typography.fontWeight.semibold};
    margin-bottom: ${props => props.theme.spacing.md};
    color: ${props => props.theme.colors.primary.blueDark};
  }
  
  p {
    margin-bottom: ${props => props.theme.spacing.md};
  }
  
  .highlight {
    background: ${props => props.theme.colors.medical.warning}30;
    padding: 2px 4px;
    border-radius: ${props => props.theme.borderRadius.sm};
  }
  
  .medical-data {
    background: ${props => props.theme.colors.primary.blueLight};
    padding: ${props => props.theme.spacing.md};
    border-radius: ${props => props.theme.borderRadius.md};
    border-left: 4px solid ${props => props.theme.colors.primary.blue};
    margin: ${props => props.theme.spacing.md} 0;
  }
`;

// Estado de carga
const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  gap: ${props => props.theme.spacing.md};
`;

// Estado vacío
const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: ${props => props.theme.colors.text.muted};
  text-align: center;
`;

// Iconos
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const ChevronLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15,18 9,12 15,6"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9,18 15,12 9,6"/>
  </svg>
);

const ZoomInIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
    <line x1="11" y1="8" x2="11" y2="14"/>
    <line x1="8" y1="11" x2="14" y2="11"/>
  </svg>
);

const ZoomOutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
    <line x1="8" y1="11" x2="14" y2="11"/>
  </svg>
);

// Contenido simulado de documentos médicos
const getDocumentContent = (document, page) => {
  const contents = {
    'lab_colesterol_mar2024.pdf': {
      title: 'Laboratorio de Colesterol',
      subtitle: 'Marzo 2024 - TecSalud',
      content: `
        <h3>Perfil Lipídico Completo</h3>
        <div class="medical-data">
          <p><strong>Colesterol Total:</strong> <span class="highlight">245 mg/dL</span> (Elevado)</p>
          <p><strong>LDL Colesterol:</strong> <span class="highlight">165 mg/dL</span> (Alto)</p>
          <p><strong>HDL Colesterol:</strong> 42 mg/dL (Bajo)</p>
          <p><strong>Triglicéridos:</strong> <span class="highlight">190 mg/dL</span> (Elevado)</p>
        </div>
        
        <h3>Interpretación Clínica</h3>
        <p>Los valores de colesterol total y LDL se encuentran por encima de los rangos recomendados. Se sugiere continuar con tratamiento farmacológico y modificaciones dietéticas.</p>
        
        <h3>Recomendaciones</h3>
        <p>• Continuar con estatinas según prescripción médica</p>
        <p>• Dieta baja en grasas saturadas</p>
        <p>• Ejercicio cardiovascular regular</p>
        <p>• Control en 3 meses</p>
      `
    },
    'lab_biometria_dic2024.pdf': {
      title: 'Biometría Hemática',
      subtitle: 'Diciembre 2024 - TecSalud',
      content: `
        <h3>Hemograma Completo</h3>
        <div class="medical-data">
          <p><strong>Hemoglobina:</strong> 14.2 g/dL (Normal)</p>
          <p><strong>Hematocrito:</strong> 42.1% (Normal)</p>
          <p><strong>Leucocitos:</strong> 7,200/μL (Normal)</p>
          <p><strong>Plaquetas:</strong> 285,000/μL (Normal)</p>
        </div>
        
        <h3>Fórmula Leucocitaria</h3>
        <p>• Neutrófilos: 65% (Normal)</p>
        <p>• Linfocitos: 28% (Normal)</p>
        <p>• Monocitos: 5% (Normal)</p>
        <p>• Eosinófilos: 2% (Normal)</p>
        
        <h3>Conclusión</h3>
        <p>Biometría hemática dentro de parámetros normales. No se observan alteraciones significativas en la serie roja, blanca o plaquetaria.</p>
      `
    }
  };

  return contents[document] || {
    title: 'Documento Médico',
    subtitle: 'TecSalud - Sistema de Expedientes',
    content: `
      <h3>Documento: ${document}</h3>
      <p>Este es un documento médico simulado para demostración del visor de PDFs.</p>
      <div class="medical-data">
        <p>Página actual: ${page}</p>
        <p>Documento: ${document}</p>
      </div>
      <p>En un sistema real, aquí se mostraría el contenido completo del documento PDF seleccionado.</p>
    `
  };
};

export const PDFViewer = () => {
  const { pdfViewer, closePDFViewer, setPDFPage } = useUIStore();
  const [zoom, setZoom] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [totalPages] = useState(5); // Simulado

  // Simular carga del documento
  useEffect(() => {
    if (pdfViewer.document) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [pdfViewer.document]);

  const handleClose = () => {
    closePDFViewer();
    setZoom(100);
  };

  const handlePrevPage = () => {
    if (pdfViewer.page > 1) {
      setPDFPage(pdfViewer.page - 1);
    }
  };

  const handleNextPage = () => {
    if (pdfViewer.page < totalPages) {
      setPDFPage(pdfViewer.page + 1);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  if (!pdfViewer.isOpen) {
    return null;
  }

  const documentContent = getDocumentContent(pdfViewer.document, pdfViewer.page);

  return (
    <PDFContainer>
      {/* Header */}
      <PDFHeader>
        <PDFTitle title={pdfViewer.title}>
          {pdfViewer.title || pdfViewer.document}
        </PDFTitle>
        <CloseButton
          variant="ghost"
          size="sm"
          leftIcon={<CloseIcon />}
          onClick={handleClose}
        />
      </PDFHeader>

      {/* Controles */}
      <PDFControls>
        <PageControls>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ChevronLeftIcon />}
            onClick={handlePrevPage}
            disabled={pdfViewer.page <= 1}
          />
          
          <PageInfo>
            {pdfViewer.page} / {totalPages}
          </PageInfo>
          
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ChevronRightIcon />}
            onClick={handleNextPage}
            disabled={pdfViewer.page >= totalPages}
          />
        </PageControls>

        <ZoomControls>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ZoomOutIcon />}
            onClick={handleZoomOut}
            disabled={zoom <= 50}
          />
          
          <ZoomInfo>{zoom}%</ZoomInfo>
          
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ZoomInIcon />}
            onClick={handleZoomIn}
            disabled={zoom >= 200}
          />
        </ZoomControls>
      </PDFControls>

      {/* Documento */}
      <DocumentArea>
        {isLoading ? (
          <LoadingState>
            <LoadingSpinner size="lg" />
            <p>Cargando documento...</p>
          </LoadingState>
        ) : pdfViewer.document ? (
          <DocumentPreview
            zoom={zoom}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <DocumentHeader>
              <DocumentTitle>{documentContent.title}</DocumentTitle>
              <DocumentSubtitle>{documentContent.subtitle}</DocumentSubtitle>
            </DocumentHeader>
            
            <DocumentContent
              dangerouslySetInnerHTML={{ __html: documentContent.content }}
            />
          </DocumentPreview>
        ) : (
          <EmptyState>
            <p>No hay documento seleccionado</p>
          </EmptyState>
        )}
      </DocumentArea>
    </PDFContainer>
  );
};

export default PDFViewer;

