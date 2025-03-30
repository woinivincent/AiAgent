import { useState } from 'react';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { Message, ChatState } from './types/chat';
import { Bot } from 'lucide-react';

function App() {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
  });

  const sendMessage = async (content: string) => {
    const userMessage: Message = { role: 'user', content };
    
    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-opus-20240229',
          max_tokens: 1024,
          messages: [...chatState.messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error ${response.status}:`, errorText);
        throw new Error(`Error al comunicarse con Claude: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      // Manejo mejorado de la respuesta de la API
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.content && data.content[0] && data.content[0].text 
          ? data.content[0].text 
          : (data.content || data.message || 'No se pudo obtener respuesta'),
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error completo:', error);
      setChatState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al procesar tu mensaje',
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-2">
          <Bot className="w-8 h-8 text-purple-500" />
          <h1 className="text-xl font-semibold text-gray-800"> AI Agent Chat</h1>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 flex flex-col">
        <div className="flex-1 mb-6 overflow-y-auto">
          {chatState.messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <Bot className="w-12 h-12 mx-auto mb-4 text-purple-500" />
              <p>¡Hola! Soy Tu agente virtual. ¿En qué puedo ayudarte hoy?</p>
            </div>
          ) : (
            chatState.messages.map((message, index) => (
              <ChatMessage key={index} message={message} />
            ))
          )}
          
          {chatState.isLoading && (
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent" />
              <span>Claude está escribiendo...</span>
            </div>
          )}
          
          {chatState.error && (
            <div className="text-red-500 text-center my-4">
              {chatState.error}
            </div>
          )}
        </div>

        <ChatInput 
          onSendMessage={sendMessage} 
          isLoading={chatState.isLoading} 
        />
      </main>
    </div>
  );
}

export default App;