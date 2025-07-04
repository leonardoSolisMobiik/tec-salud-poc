import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader, AlertCircle, Zap, Brain, Search, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useMedicalStore } from '../../stores/medicalStore';
import { useUIStore } from '../../stores/uiStore';
import apiService from '../../services/apiService';

// Styled Components
const CopilotContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${props => props.theme.colors.background.primary};
`;

const ChatHeader = styled.div`
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

const HeaderSubtitle = styled.p`
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.secondary};
  margin: 0;
`;

const ModelSelector = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.md};
  flex-wrap: wrap;
`;

const ModelButton = styled(Button)`
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.typography.fontSize.xs};
  height: auto;
  
  ${props => props.active && `
    background: ${props.theme.colors.primary.main};
    color: white;
  `}
`;

const ChatMessages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${props => props.theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

const MessageContainer = styled(motion.div)`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  align-items: flex-start;
  
  ${props => props.isUser && `
    flex-direction: row-reverse;
  `}
`;

const MessageAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  ${props => props.isUser ? `
    background: ${props.theme.colors.primary.main};
    color: white;
  ` : `
    background: ${props.theme.colors.secondary.main};
    color: white;
  `}
`;

const MessageBubble = styled.div`
  max-width: 70%;
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.lg};
  
  ${props => props.isUser ? `
    background: ${props.theme.colors.primary.main};
    color: white;
    border-bottom-right-radius: ${props.theme.borderRadius.sm};
  ` : `
    background: ${props.theme.colors.background.secondary};
    color: ${props.theme.colors.text.primary};
    border-bottom-left-radius: ${props.theme.borderRadius.sm};
    border: 1px solid ${props.theme.colors.border.light};
  `}
`;

const MessageContent = styled.div`
  font-size: ${props => props.theme.typography.fontSize.sm};
  line-height: 1.5;
  white-space: pre-wrap;
  
  h2, h3 {
    margin: ${props => props.theme.spacing.md} 0 ${props => props.theme.spacing.sm} 0;
    font-size: ${props => props.theme.typography.fontSize.md};
    font-weight: ${props => props.theme.typography.fontWeight.semibold};
  }
  
  ul, ol {
    margin: ${props => props.theme.spacing.sm} 0;
    padding-left: ${props => props.theme.spacing.lg};
  }
  
  li {
    margin: ${props => props.theme.spacing.xs} 0;
  }
  
  strong {
    font-weight: ${props => props.theme.typography.fontWeight.semibold};
  }
  
  code {
    background: rgba(0, 0, 0, 0.1);
    padding: 2px 4px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.9em;
  }
`;

const MessageMetadata = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.typography.fontSize.xs};
  color: ${props => props.theme.colors.text.muted};
`;

const ChatInput = styled.div`
  padding: ${props => props.theme.spacing.lg};
  border-top: 1px solid ${props => props.theme.colors.border.light};
  background: ${props => props.theme.colors.background.secondary};
`;

const InputContainer = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  align-items: flex-end;
`;

const MessageInput = styled(Input)`
  flex: 1;
  min-height: 44px;
  resize: none;
`;

const SendButton = styled(Button)`
  padding: ${props => props.theme.spacing.sm};
  min-width: 44px;
  height: 44px;
`;

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: ${props => props.theme.spacing.xl};
`;

const EmptyStateIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${props => props.theme.colors.primary.light};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const EmptyStateTitle = styled.h3`
  font-size: ${props => props.theme.typography.fontSize.lg};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text.primary};
  margin: 0 0 ${props => props.theme.spacing.sm} 0;
`;

const EmptyStateText = styled.p`
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.secondary};
  margin: 0 0 ${props => props.theme.spacing.lg} 0;
  max-width: 300px;
`;

const QuickActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.sm};
  justify-content: center;
`;

const QuickActionButton = styled(Button)`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  font-size: ${props => props.theme.typography.fontSize.sm};
  height: auto;
`;

const TypingIndicator = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.border.light};
  max-width: 200px;
`;

const TypingDots = styled.div`
  display: flex;
  gap: 4px;
  
  span {
    width: 6px;
    height: 6px;
    background: ${props => props.theme.colors.text.muted};
    border-radius: 50%;
    animation: typing 1.4s infinite ease-in-out;
    
    &:nth-child(1) { animation-delay: -0.32s; }
    &:nth-child(2) { animation-delay: -0.16s; }
  }
  
  @keyframes typing {
    0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
    40% { transform: scale(1); opacity: 1; }
  }
`;

// Model configurations
const MODELS = {
  'gpt-4o-mini': {
    name: 'Respuesta Rápida',
    icon: Zap,
    description: 'Consultas rápidas y preguntas simples',
    color: '#10B981'
  },
  'gpt-4o': {
    name: 'Análisis Profundo',
    icon: Brain,
    description: 'Diagnósticos complejos y análisis detallado',
    color: '#8B5CF6'
  }
};

export const Copilot = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  
  const { selectedPatient } = useMedicalStore();
  const { showToast } = useUIStore();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Quick action prompts
  const quickActions = [
    {
      label: 'Buscar síntomas',
      icon: Search,
      prompt: 'Ayúdame a buscar información sobre síntomas específicos'
    },
    {
      label: 'Analizar expediente',
      icon: FileText,
      prompt: 'Analiza el expediente médico del paciente actual'
    },
    {
      label: 'Diagnóstico diferencial',
      icon: Brain,
      prompt: 'Ayúdame con un diagnóstico diferencial'
    },
    {
      label: 'Consulta rápida',
      icon: Zap,
      prompt: '¿Cuáles son las indicaciones para...?'
    }
  ];

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      // Prepare messages for API
      const apiMessages = messages.concat(userMessage).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Choose API endpoint based on selected model
      let response;
      const options = {
        modelType: selectedModel,
        patientId: selectedPatient?.id,
        includeContext: !!selectedPatient
      };

      if (selectedModel === 'gpt-4o') {
        response = await apiService.analyzeMedicalCase(apiMessages, options);
      } else {
        response = await apiService.sendMedicalChat(apiMessages, options);
      }

      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        model: response.model,
        usage: response.usage,
        toolCalls: response.tool_calls || []
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Show success toast
      showToast('Respuesta generada exitosamente', 'success');

    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.message);
      
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `Lo siento, ocurrió un error al procesar tu consulta: ${error.message}`,
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
      showToast('Error al enviar mensaje', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (prompt) => {
    setInputValue(prompt);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageContent = (content) => {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
  };

  return (
    <CopilotContainer>
      <ChatHeader>
        <HeaderTitle>
          Asistente Médico IA
        </HeaderTitle>
        <HeaderSubtitle>
          {selectedPatient 
            ? `Consultando sobre ${selectedPatient.name}`
            : 'Consultas médicas generales'
          }
        </HeaderSubtitle>
        
        <ModelSelector>
          {Object.entries(MODELS).map(([key, model]) => {
            const IconComponent = model.icon;
            return (
              <ModelButton
                key={key}
                variant="outline"
                size="sm"
                active={selectedModel === key}
                onClick={() => setSelectedModel(key)}
              >
                <IconComponent size={14} />
                {model.name}
              </ModelButton>
            );
          })}
        </ModelSelector>
      </ChatHeader>

      <ChatMessages>
        {messages.length === 0 ? (
          <EmptyState>
            <EmptyStateIcon>
              <Bot size={40} color="white" />
            </EmptyStateIcon>
            <EmptyStateTitle>
              ¡Hola! Soy tu asistente médico
            </EmptyStateTitle>
            <EmptyStateText>
              Puedo ayudarte con consultas médicas, análisis de expedientes, 
              diagnósticos diferenciales y mucho más.
            </EmptyStateText>
            <QuickActions>
              {quickActions.map((action, index) => {
                const IconComponent = action.icon;
                return (
                  <QuickActionButton
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction(action.prompt)}
                  >
                    <IconComponent size={16} />
                    {action.label}
                  </QuickActionButton>
                );
              })}
            </QuickActions>
          </EmptyState>
        ) : (
          <>
            <AnimatePresence>
              {messages.map((message) => (
                <MessageContainer
                  key={message.id}
                  isUser={message.role === 'user'}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <MessageAvatar isUser={message.role === 'user'}>
                    {message.role === 'user' ? (
                      <User size={20} />
                    ) : (
                      <Bot size={20} />
                    )}
                  </MessageAvatar>
                  
                  <div>
                    <MessageBubble isUser={message.role === 'user'}>
                      <MessageContent
                        dangerouslySetInnerHTML={{
                          __html: formatMessageContent(message.content)
                        }}
                      />
                      
                      {message.role === 'assistant' && (
                        <MessageMetadata>
                          {message.model && (
                            <Badge variant="secondary" size="sm">
                              {MODELS[message.model]?.name || message.model}
                            </Badge>
                          )}
                          {message.usage && (
                            <span>
                              {message.usage.total_tokens} tokens
                            </span>
                          )}
                          {message.toolCalls && message.toolCalls.length > 0 && (
                            <Badge variant="primary" size="sm">
                              {message.toolCalls.length} herramientas usadas
                            </Badge>
                          )}
                        </MessageMetadata>
                      )}
                    </MessageBubble>
                  </div>
                </MessageContainer>
              ))}
            </AnimatePresence>

            {isLoading && (
              <MessageContainer>
                <MessageAvatar>
                  <Bot size={20} />
                </MessageAvatar>
                <TypingIndicator
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <TypingDots>
                    <span></span>
                    <span></span>
                    <span></span>
                  </TypingDots>
                  <span>Procesando...</span>
                </TypingIndicator>
              </MessageContainer>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </ChatMessages>

      <ChatInput>
        {error && (
          <Toast
            message={error}
            type="error"
            onClose={() => setError(null)}
          />
        )}
        
        <InputContainer>
          <MessageInput
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              selectedModel === 'gpt-4o' 
                ? "Describe el caso médico para análisis profundo..."
                : "Escribe tu consulta médica..."
            }
            disabled={isLoading}
            multiline
            rows={1}
          />
          <SendButton
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            variant="primary"
          >
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Send size={20} />
            )}
          </SendButton>
        </InputContainer>
      </ChatInput>
    </CopilotContainer>
  );
};

