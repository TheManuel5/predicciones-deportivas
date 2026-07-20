import React, { useState, useRef, useEffect } from 'react';
import { TRANSLATIONS } from '../translations';
import { Send, Mic, Square, Key } from 'lucide-react';

export default function AIAssistant({ user, language, apiUrl }) {
  const t = TRANSLATIONS[language];
  const [messages, setMessages] = useState([
    { role: 'assistant', content: language === 'es' ? '¡Hola! Soy tu asistente de predicciones deportivas. Pregúntame sobre los próximos partidos o el rendimiento de los equipos.' : 'Hello! I am your sports predictions assistant. Ask me about upcoming matches or team performances.' }
  ]);
  const [inputText, setInputText] = useState("");
  const [recording, setRecording] = useState(false);
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('gemini_api_key') || "");
  const [keyInputVisible, setKeyInputVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const chatBottomRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const saveGeminiKey = (key) => {
    setGeminiKey(key);
    localStorage.setItem('gemini_api_key', key);
    setKeyInputVisible(false);
  };

  const handleSendMessage = async (textToSend = null, audioBlob = null) => {
    const queryText = textToSend || inputText;
    if (!queryText && !audioBlob) return;

    // Add user message to UI
    const newUserMessage = { 
      role: 'user', 
      content: audioBlob ? (language === 'es' ? '🎤 Mensaje de voz enviado' : '🎤 Voice message sent') : queryText,
      isAudio: !!audioBlob
    };
    setMessages(prev => [...prev, newUserMessage]);
    setInputText("");
    setLoading(true);

    try {
      const formData = new FormData();
      if (audioBlob) {
        formData.append('audio', audioBlob, 'question.wav');
      } else {
        formData.append('message', queryText);
      }

      const headers = {};
      if (geminiKey) {
        headers['gemini-key'] = geminiKey;
      }

      const res = await fetch(`${apiUrl}/api/ai-assistant`, {
        method: 'POST',
        headers: headers,
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        const err = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.detail || 'Fallo de conexión'}` }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Fallo de conexión al servidor de IA.' }]);
    } finally {
      setLoading(false);
    }
  };

  // Audio Recording handlers
  const startRecording = async () => {
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        handleSendMessage(null, audioBlob);
        // Stop all audio tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (e) {
      alert(language === 'es' ? 'No se pudo acceder al micrófono.' : 'Could not access the microphone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 4rem)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem' }}>{t.ai_assistant_page}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{t.chatbot_title}</p>
        </div>
        <button 
          onClick={() => setKeyInputVisible(!keyInputVisible)}
          className="btn-secondary" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
        >
          <Key size={16} />
          {geminiKey ? 'API Key OK' : 'Configure API Key'}
        </button>
      </div>

      {/* API Key Modal/Input panel */}
      {keyInputVisible && (
        <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Google Gemini API Key</label>
            <input 
              type="password" 
              placeholder="AIzaSy..." 
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="input-field" 
              style={{ marginTop: '0.25rem' }}
            />
          </div>
          <button 
            onClick={() => saveGeminiKey(geminiKey)} 
            className="btn-primary" 
            style={{ marginTop: '1.25rem', padding: '0.6rem 1.2rem', borderRadius: '8px' }}
          >
            Guardar
          </button>
        </div>
      )}

      {/* Chat Messages Log */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        border: '1px solid var(--border-color)', 
        borderRadius: '16px', 
        padding: '1.5rem', 
        background: 'var(--bg-secondary)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div 
              key={idx} 
              style={{ 
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '75%',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem'
              }}
            >
              <div style={{ 
                padding: '0.85rem 1.25rem', 
                borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                background: isUser ? 'var(--accent-gradient)' : 'var(--bg-primary)',
                color: isUser ? '#ffffff' : 'var(--text-primary)',
                border: isUser ? 'none' : '1px solid var(--border-color)',
                boxShadow: isUser ? '0 4px 12px var(--accent-glow)' : 'none',
                lineHeight: 1.5,
                fontSize: '0.95rem',
                whiteSpace: 'pre-line'
              }}>
                {msg.content}
              </div>
              <span style={{ 
                fontSize: '0.75rem', 
                color: 'var(--text-muted)', 
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                padding: '0 0.25rem'
              }}>
                {isUser ? user.username : 'AI Assistant'}
              </span>
            </div>
          );
        })}
        {loading && (
          <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '1.2rem', animation: 'spin 1.5s linear infinite' }}>💬</span>
            <span>{language === 'es' ? 'Pensando...' : 'Thinking...'}</span>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Input Bar */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.5rem' }}>
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={t.chatbot_placeholder}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          className="input-field"
          style={{ flex: 1, padding: '0.9rem 1.25rem', borderRadius: '12px' }}
        />
        
        {/* Voice recording button */}
        {recording ? (
          <button 
            onClick={stopRecording} 
            className="btn-primary" 
            style={{ padding: '0.9rem', borderRadius: '12px', background: 'var(--danger-color)', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }}
            title={t.stop_voice_button}
          >
            <Square size={20} />
          </button>
        ) : (
          <button 
            onClick={startRecording} 
            className="btn-secondary" 
            style={{ padding: '0.9rem', borderRadius: '12px' }}
            title={t.voice_button}
          >
            <Mic size={20} />
          </button>
        )}

        <button 
          onClick={() => handleSendMessage()} 
          className="btn-primary" 
          style={{ padding: '0.9rem 1.25rem', borderRadius: '12px' }}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
