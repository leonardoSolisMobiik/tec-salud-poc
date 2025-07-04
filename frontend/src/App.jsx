import React from 'react';
import { ThemeProvider } from 'styled-components';
import { motion } from 'framer-motion';
import { useUIStore } from './stores/uiStore';
import { useMedicalStore } from './stores/medicalStore';
import { GlobalStyles } from './styles/globalStyles';
import { theme } from './styles/theme';
import apiService from './services/apiService';
import ReactMarkdown from 'react-markdown';
import { PatientSearch } from './components/medical/PatientSearch';
import { RecentPatients } from './components/medical/RecentPatients';
import { PatientContext } from './components/medical/PatientContext';
import { ConversationalLoader } from './components/ui/ConversationalLoader';
import { PremiumButton } from './components/ui/PremiumButton';
import { PremiumInput } from './components/ui/PremiumInput';
import { SearchInput } from './components/ui/SearchInput';
import { StethoscopeIcon, HeartIcon, ActivityIcon } from './components/ui/icons/MedicalIcons';


function App() {
  const { activeView, setActiveView } = useUIStore();
  const { activePatient, recentPatients, currentChat, addMessage, setTyping, setActivePatient, clearActivePatient, fetchRecentPatients, isLoadingPatients } = useMedicalStore();
  const [inputMessage, setInputMessage] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [streamingMessage, setStreamingMessage] = React.useState('');
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchError, setSearchError] = React.useState(null);
  const streamingContentRef = React.useRef('');
  
  // Fetch recent patients on initial load
  React.useEffect(() => {
    clearActivePatient();
    fetchRecentPatients();
  }, [fetchRecentPatients, clearActivePatient]);
  
  // Debounce search query
  const [debouncedSearchQuery, setDebouncedSearchQuery] = React.useState('');
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Perform search when debounced query changes
  React.useEffect(() => {
    if (!debouncedSearchQuery.trim()) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }
    
    performSearch(debouncedSearchQuery);
  }, [debouncedSearchQuery]);
  
  const performSearch = async (query) => {
    setIsSearching(true);
    setSearchError(null);
    
    try {
      console.log('🔍 Searching for:', query);
      const response = await apiService.searchPatients(query, 10, 0);
      console.log('📡 Search response:', response);
      // Adaptar la respuesta al formato que espera RecentPatients
      const adaptedPatients = response.patients?.map(patient => ({
        id: patient.id,
        name: patient.name,
        age: patient.age || 'N/A',
        specialty: patient.specialty || patient.conditions?.[0] || 'General',
        expediente: patient.medical_record_number || patient.id,
        status: patient.status || 'Activo',
        lastVisit: patient.last_visit || new Date().toISOString()
      })) || [];
      
      console.log('✅ Adapted patients:', adaptedPatients);
      setSearchResults(adaptedPatients);
    } catch (error) {
      console.error('Error searching patients:', error);
      setSearchError('Error al buscar pacientes');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  // Get patients to display (search results or recent patients)
  const patientsToShow = searchQuery.trim() ? searchResults : recentPatients;
  
  console.log('App component rendered, activeView:', activeView, 'activePatient:', activePatient);
  
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    // Agregar mensaje del usuario al chat
    const userMessage = { role: 'user', content: inputMessage };
    addMessage(userMessage);
    setInputMessage('');
    setIsLoading(true);
    setIsStreaming(true);
    setStreamingMessage('');
    streamingContentRef.current = '';
    
    try {
      // Preparar mensajes para API (incluir contexto del paciente si existe)
      const contextualMessages = activePatient 
        ? [
            { role: 'system', content: `Contexto del paciente: ${activePatient.name}, ${activePatient.age} años, ${activePatient.specialty}. Expediente: ${activePatient.expediente}` },
            ...currentChat.slice(-5), // Últimos 5 mensajes para contexto
            userMessage
          ]
        : [userMessage];
      
      // Debug: Log state
      console.log('🔍 Debug - activePatient:', activePatient);
      console.log('🔍 Debug - patientId to send:', activePatient ? activePatient.id : null);
      
      // Usar streaming real de Azure OpenAI
      await apiService.sendMedicalChatStream(contextualMessages, {
        patientId: activePatient ? activePatient.id : null,
        includeContext: !!activePatient,
        onChunk: (chunk) => {
          console.log('🔥 Chunk received in App:', chunk);
          // Acumular contenido en ref y actualizar estado para mostrar
          streamingContentRef.current += chunk;
          setStreamingMessage(streamingContentRef.current);
          console.log('📝 Current streaming message:', streamingContentRef.current);
        }
      });
      
      // Agregar mensaje final al store con contenido completo
      const finalContent = streamingContentRef.current.replace(/\\n/g, '\n');
      addMessage({ role: 'assistant', content: finalContent });
      
    } catch (error) {
      console.error('Error en chat:', error);
      addMessage({ 
        role: 'assistant', 
        content: 'Lo siento, hubo un error al procesar tu consulta. Por favor intenta de nuevo.' 
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingMessage('');
      streamingContentRef.current = '';
    }
  };
  
  const renderChatContent = () => {
    const welcomeMessage = activePatient 
      ? `¡Hola! Soy tu Copiloto médico. Tengo acceso al expediente completo de ${activePatient.name}. ¿En qué puedo ayudarte hoy? Puedo consultar laboratorios, medicamentos, diagnósticos, estudios de imagen y más.`
      : '👋 Hola, soy tu Copiloto médico. Selecciona un paciente del panel izquierdo para comenzar a consultar su expediente.';

    return (
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}>
        {/* Header con contexto del paciente */}
        {activePatient && <PatientContext />}
        
        {/* Área de mensajes */}
        <div style={{ 
          background: theme.colors.background.primary,
          borderRadius: theme.borderRadius.lg,
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: `1px solid ${theme.colors.gray[200]}`
        }}>
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: theme.spacing.lg
          }}>
            {currentChat.length === 0 ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.md,
                padding: theme.spacing.lg,
                background: theme.colors.primary.blueLight,
                borderRadius: theme.borderRadius.md,
                marginBottom: theme.spacing.md
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${theme.colors.primary.blue} 0%, ${theme.colors.primary.blueDark} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: theme.typography.fontWeight.bold,
                  fontSize: '18px',
                  flexShrink: 0,
                  boxShadow: `0 4px 12px ${theme.colors.primary.blue}40`
                }}>
                  <HeartIcon size="24px" pulse={true} />
                </div>
                <div>
                  <div style={{
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.primary.blueDark,
                    marginBottom: '4px'
                  }}>
                    Copiloto Médico
                  </div>
                  <div style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.text.secondary,
                    marginBottom: theme.spacing.sm
                  }}>
                    • En línea
                  </div>
                  <div style={{
                    color: theme.colors.text.primary,
                    lineHeight: '1.5'
                  }}>
                    {welcomeMessage}
                  </div>
                </div>
              </div>
            ) : (
              currentChat.map((message, index) => (
                <div 
                  key={message.id || index} 
                  style={{
                    marginBottom: theme.spacing.md,
                    display: 'flex',
                    gap: theme.spacing.md,
                    flexDirection: message.role === 'user' ? 'row-reverse' : 'row'
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: message.role === 'user' 
                      ? theme.colors.gray[300] 
                      : theme.colors.primary.blue,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: message.role === 'user' ? theme.colors.text.primary : 'white',
                    fontWeight: theme.typography.fontWeight.bold,
                    fontSize: '14px',
                    flexShrink: 0
                  }}>
                    {message.role === 'user' ? '👤' : 'AI'}
                  </div>
                  <div style={{
                    flex: 1,
                    maxWidth: '70%'
                  }}>
                    <div style={{
                      padding: theme.spacing.md,
                      borderRadius: theme.borderRadius.md,
                      background: message.role === 'user' 
                        ? theme.colors.primary.blueLight 
                        : theme.colors.gray[50],
                      color: theme.colors.text.primary
                    }}>
                      {message.role === 'assistant' ? (
                        <ReactMarkdown
                          components={{
                            p: ({children}) => <p style={{margin: '0 0 10px 0'}}>{children}</p>,
                            ul: ({children}) => <ul style={{margin: '10px 0', paddingLeft: '20px'}}>{children}</ul>,
                            li: ({children}) => <li style={{marginBottom: '5px'}}>{children}</li>,
                            strong: ({children}) => <strong style={{fontWeight: theme.typography.fontWeight.semibold}}>{children}</strong>,
                            h1: ({children}) => <h1 style={{fontSize: theme.typography.fontSize.xl, margin: '10px 0', color: theme.colors.primary.blue}}>{children}</h1>,
                            h2: ({children}) => <h2 style={{fontSize: theme.typography.fontSize.lg, margin: '10px 0', color: theme.colors.primary.blue}}>{children}</h2>,
                            h3: ({children}) => <h3 style={{fontSize: theme.typography.fontSize.base, margin: '10px 0', color: theme.colors.primary.blue}}>{children}</h3>,
                            hr: () => <hr style={{margin: '15px 0', border: 'none', borderTop: `1px solid ${theme.colors.gray[300]}`}} />
                          }}
                        >
                          {message.content.replace(/\\n/g, '\n')}
                        </ReactMarkdown>
                      ) : (
                        message.content
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {/* Mensaje de streaming */}
            {isStreaming && streamingMessage && (
              <div style={{
                marginBottom: theme.spacing.md,
                display: 'flex',
                gap: theme.spacing.md,
                flexDirection: 'row'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: theme.colors.primary.blue,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: theme.typography.fontWeight.bold,
                  fontSize: '14px',
                  flexShrink: 0
                }}>
                  AI
                </div>
                <div style={{
                  flex: 1,
                  maxWidth: '70%'
                }}>
                  <div style={{
                    padding: theme.spacing.md,
                    borderRadius: theme.borderRadius.md,
                    background: theme.colors.gray[50],
                    color: theme.colors.text.primary
                  }}>
                    <ReactMarkdown
                      components={{
                        p: ({children}) => <p style={{margin: '0 0 10px 0'}}>{children}</p>,
                        ul: ({children}) => <ul style={{margin: '10px 0', paddingLeft: '20px'}}>{children}</ul>,
                        li: ({children}) => <li style={{marginBottom: '5px'}}>{children}</li>,
                        strong: ({children}) => <strong style={{fontWeight: theme.typography.fontWeight.semibold}}>{children}</strong>,
                        h1: ({children}) => <h1 style={{fontSize: theme.typography.fontSize.xl, margin: '10px 0', color: theme.colors.primary.blue}}>{children}</h1>,
                        h2: ({children}) => <h2 style={{fontSize: theme.typography.fontSize.lg, margin: '10px 0', color: theme.colors.primary.blue}}>{children}</h2>,
                        h3: ({children}) => <h3 style={{fontSize: theme.typography.fontSize.base, margin: '10px 0', color: theme.colors.primary.blue}}>{children}</h3>,
                        hr: () => <hr style={{margin: '15px 0', border: 'none', borderTop: `1px solid ${theme.colors.gray[300]}`}} />
                      }}
                    >
                      {streamingMessage}
                    </ReactMarkdown>
                    <span style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '1em',
                      background: theme.colors.primary.blue,
                      animation: 'blink 1s infinite',
                      marginLeft: '2px'
                    }}>|</span>
                  </div>
                </div>
              </div>
            )}

            {isLoading && !isStreaming && (
              <ConversationalLoader 
                type={activePatient ? 'diagnostic' : 'general'}
                loaderType="heartbeat"
                showParticles={true}
              />
            )}
          </div>
          
          {/* Input de mensaje */}
          <div style={{
            padding: theme.spacing.lg,
            borderTop: `1px solid ${theme.colors.gray[200]}`,
            background: theme.colors.background.primary
          }}>
            <div style={{
              display: 'flex',
              gap: theme.spacing.md
            }}>
              <PremiumInput
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
                placeholder={activePatient ? "Pregunta sobre el expediente..." : "Selecciona un paciente primero..."}
                disabled={isLoading || !activePatient}
                size="md"
                fullWidth={true}
                animated={true}
                style={{ flex: 1 }}
              />
              <PremiumButton
                onClick={sendMessage}
                disabled={!inputMessage.trim() || !activePatient}
                isLoading={isLoading}
                variant="primary"
                size="md"
                icon={<ActivityIcon />}
                iconPosition="right"
                showRipple={true}
              >
                {isLoading ? 'Enviando...' : 'Enviar'}
              </PremiumButton>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: sidebarCollapsed ? '60px 1fr' : '320px 1fr',
        height: '100vh',
        overflow: 'hidden',
        transition: 'grid-template-columns 0.3s ease'
      }}>
        {/* Panel Izquierdo - Pacientes */}
        <div style={{ 
          background: theme.colors.background.primary,
          borderRight: `1px solid ${theme.colors.gray[200]}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'all 0.3s ease'
        }}>
          {/* Header del Panel */}
          {!sidebarCollapsed ? (
            <div style={{
              padding: theme.spacing.lg,
              borderBottom: `1px solid ${theme.colors.gray[200]}`,
              background: theme.colors.background.primary
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.md,
                marginBottom: theme.spacing.md
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: theme.colors.primary.blue,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: theme.typography.fontWeight.bold,
                  fontSize: '16px'
                }}>
                  T
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ 
                    color: theme.colors.text.primary,
                    fontSize: theme.typography.fontSize.lg,
                    fontWeight: theme.typography.fontWeight.semibold,
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.xs
                  }}>
                    <StethoscopeIcon size="18px" color={theme.colors.primary.blue} animated={true} />
                    TecSalud
                  </h2>
                  <p style={{
                    color: theme.colors.text.secondary,
                    fontSize: theme.typography.fontSize.sm,
                    margin: 0
                  }}>
                    Asistente Virtual
                  </p>
                </div>
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: theme.colors.text.secondary,
                    cursor: 'pointer',
                    padding: theme.spacing.xs,
                    borderRadius: theme.borderRadius.sm,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  title="Colapsar panel"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              padding: `${theme.spacing.md} 0`,
              borderBottom: `1px solid ${theme.colors.gray[200]}`,
              background: theme.colors.background.primary,
              display: 'flex',
              justifyContent: 'center'
            }}>
              <motion.button
                onClick={() => setSidebarCollapsed(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: `linear-gradient(135deg, ${theme.colors.primary.blue} 0%, ${theme.colors.primary.blueDark} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: theme.typography.fontWeight.bold,
                  fontSize: '18px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: `0 2px 8px ${theme.colors.primary.blue}30`,
                  transition: 'all 0.2s ease'
                }}
                title="Expandir panel"
              >
                T
              </motion.button>
            </div>
          )}

          {/* Buscador de Pacientes */}
          {!sidebarCollapsed && (
            <div style={{ 
              flex: 1,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                padding: `${theme.spacing.md} ${theme.spacing.lg} 0`,
                borderBottom: `1px solid ${theme.colors.gray[200]}`
              }}>
                <SearchInput
                  placeholder="Buscar paciente..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  style={{
                    marginBottom: theme.spacing.md
                  }}
                />
              </div>

              {/* Lista de Pacientes Recientes */}
              <div style={{
                padding: `${theme.spacing.md} ${theme.spacing.sm}`, // Menos padding horizontal
                flex: 1,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0 // Importante para que flex funcione correctamente
              }}>
                <h3 style={{
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.text.primary,
                  marginBottom: theme.spacing.lg,
                  margin: '0 0 16px 0',
                  flexShrink: 0 // Evita que el título se comprima
                }}>
                  {searchQuery.trim() ? 
                    (isSearching ? 'Buscando...' : `Resultados (${patientsToShow.length})`) : 
                    'Pacientes Recientes'
                  }
                </h3>
                
                <div style={{
                  flex: 1,
                  overflow: 'auto',
                  minHeight: 0, // Permite que el contenido se comprima apropiadamente
                  paddingBottom: theme.spacing.md // Espacio extra en la parte inferior
                }}>
                  {/* Loading state */}
                  {isSearching && (
                    <div style={{
                      textAlign: 'center',
                      padding: theme.spacing.lg,
                      color: theme.colors.text.secondary
                    }}>
                      <ConversationalLoader 
                        type="search"
                        loaderType="thinking"
                        showParticles={false}
                        customMessages={['Buscando pacientes...', 'Consultando base de datos...', 'Preparando resultados...']}
                      />
                    </div>
                  )}
                  
                  {/* Error state */}
                  {searchError && (
                    <div style={{
                      textAlign: 'center',
                      padding: theme.spacing.xl,
                      color: theme.colors.medical.error
                    }}>
                      <p style={{ margin: 0, fontSize: theme.typography.fontSize.sm }}>
                        {searchError}
                      </p>
                    </div>
                  )}
                  
                  {/* No results state */}
                  {!isSearching && !searchError && patientsToShow.length === 0 && searchQuery.trim() && (
                    <div style={{
                      textAlign: 'center',
                      padding: theme.spacing.xl,
                      color: theme.colors.text.secondary
                    }}>
                      <div style={{ marginBottom: theme.spacing.sm }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '32px', height: '32px', margin: '0 auto' }}>
                          <circle cx="11" cy="11" r="8"/>
                          <path d="m21 21-4.35-4.35"/>
                        </svg>
                      </div>
                      <p style={{ margin: 0, fontSize: theme.typography.fontSize.sm }}>
                        No se encontraron pacientes
                      </p>
                    </div>
                  )}
                  
                  {/* Results */}
                  {!isSearching && !searchError && patientsToShow.length > 0 && (
                    <RecentPatients patients={patientsToShow} compact={true} />
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Panel colapsado - Vista compacta premium */}
          {sidebarCollapsed && (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              background: `linear-gradient(180deg, ${theme.colors.gray[50]} 0%, ${theme.colors.background.primary} 100%)`,
            }}>
              {/* Búsqueda compacta */}
              <div style={{
                padding: theme.spacing.md,
                display: 'flex',
                justifyContent: 'center'
              }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSidebarCollapsed(false)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '12px',
                    background: theme.colors.background.primary,
                    border: `1px solid ${theme.colors.gray[200]}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: theme.colors.text.secondary,
                    boxShadow: theme.shadows.sm,
                    transition: 'all 0.2s ease'
                  }}
                  title="Buscar pacientes"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                </motion.button>
              </div>
              
              {/* Divider */}
              <div style={{
                width: '32px',
                height: '1px',
                background: theme.colors.gray[200],
                margin: `0 auto ${theme.spacing.md} auto`
              }} />
              
              {/* Pacientes recientes */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: `0 ${theme.spacing.xs}`,
                display: 'flex',
                flexDirection: 'column',
                gap: theme.spacing.xs,
                alignItems: 'center'
              }}>
                {recentPatients.slice(0, 5).map((patient, index) => (
                  <motion.div
                    key={patient.id}
                    onClick={() => setActivePatient(patient)}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 2 }}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      justifyContent: 'center',
                      padding: theme.spacing.xs,
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '14px',
                      background: activePatient?.id === patient.id 
                        ? `linear-gradient(135deg, ${theme.colors.primary.blue} 0%, ${theme.colors.primary.blueDark} 100%)`
                        : theme.colors.background.primary,
                      border: activePatient?.id === patient.id 
                        ? 'none' 
                        : `2px solid ${theme.colors.gray[200]}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: activePatient?.id === patient.id ? 'white' : theme.colors.primary.blue,
                      fontWeight: theme.typography.fontWeight.semibold,
                      fontSize: '14px',
                      boxShadow: activePatient?.id === patient.id 
                        ? `0 4px 12px ${theme.colors.primary.blue}40` 
                        : theme.shadows.xs,
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    title={patient.name}
                    >
                      {patient.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      
                      {/* Active indicator */}
                      {activePatient?.id === patient.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          style={{
                            position: 'absolute',
                            bottom: '-2px',
                            right: '-2px',
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: theme.colors.medical.success,
                            border: `2px solid ${theme.colors.background.primary}`,
                            boxShadow: `0 2px 4px ${theme.colors.medical.success}40`
                          }}
                        />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* Bottom actions */}
              <div style={{
                padding: theme.spacing.md,
                borderTop: `1px solid ${theme.colors.gray[200]}`,
                display: 'flex',
                justifyContent: 'center'
              }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '12px',
                    background: theme.colors.gray[100],
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: theme.colors.text.secondary
                  }}
                  title="Más opciones"
                >
                  •••
                </motion.button>
              </div>
            </div>
          )}
        </div>

        {/* Panel Principal - Chat */}
        <div style={{ 
          background: theme.colors.background.secondary,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Header Principal */}
          <div style={{
            padding: theme.spacing.lg,
            background: theme.colors.background.primary,
            borderBottom: `1px solid ${theme.colors.gray[200]}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h1 style={{
                fontSize: theme.typography.fontSize.xl,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.primary,
                margin: 0
              }}>
                Copiloto Médico
              </h1>
              <p style={{
                color: theme.colors.text.secondary,
                fontSize: theme.typography.fontSize.sm,
                margin: 0
              }}>
                Asistente Virtual TecSalud
              </p>
            </div>
          </div>

          {/* Contenido del Chat */}
          <div style={{ 
            flex: 1,
            padding: theme.spacing.lg,
            overflow: 'hidden'
          }}>
            {renderChatContent()}
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;