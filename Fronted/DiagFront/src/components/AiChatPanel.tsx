import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Bot, Send, Mic, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { sendAiCommand, importAiImage } from '../api/aiApi';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import type { AiCommandResult } from '../types/models';
import './AiChatPanel.css';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

interface Props {
  projectId: string;
  onResult: (result: AiCommandResult) => void;
}

export default function AiChatPanel({ projectId, onResult }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', text: 'Decime qué querés cambiar en el diagrama (por texto o por voz).' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { supported: voiceSupported, listening, transcript, start, stop } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const runCommand = async (text: string, source: 'TEXT' | 'VOICE') => {
    if (!text.trim()) return;
    setMessages(m => [...m, { role: 'user', text }]);
    setInput('');
    setLoading(true);
    try {
      const result = await sendAiCommand(projectId, text, source);
      setMessages(m => [...m, { role: 'assistant', text: result.reply }]);
      onResult(result);
    } catch {
      setMessages(m => [...m, { role: 'assistant', text: 'No pude procesar el comando. Revisá que la clave de Gemini esté configurada en el backend.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => runCommand(input, 'TEXT');

  const handleMicClick = () => {
    if (listening) {
      stop();
      if (transcript) runCommand(transcript, 'VOICE');
    } else {
      start();
    }
  };

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessages(m => [...m, { role: 'user', text: `📷 ${file.name}` }]);
    setLoading(true);
    try {
      const result = await importAiImage(projectId, file);
      setMessages(m => [...m, { role: 'assistant', text: result.reply }]);
      onResult(result);
    } catch {
      setMessages(m => [...m, { role: 'assistant', text: 'No pude leer el diagrama de la imagen.' }]);
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  if (!open) {
    return (
      <button className="ai-chat-fab" onClick={() => setOpen(true)} title="Asistente IA">
        <Bot size={22} />
      </button>
    );
  }

  return (
    <div className="ai-chat-panel">
      <div className="ai-chat-header">
        <span><Bot size={15} /> Asistente del diagrama</span>
        <button className="ai-chat-close" onClick={() => setOpen(false)}><X size={16} /></button>
      </div>

      <div className="ai-chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`ai-chat-msg ai-chat-msg--${m.role}`}>{m.text}</div>
        ))}
        {loading && <div className="ai-chat-msg ai-chat-msg--assistant"><Loader2 size={14} className="ai-chat-spin" /> Pensando...</div>}
        <div ref={bottomRef} />
      </div>

      <div className="ai-chat-input-row">
        <button
          className={`ai-chat-icon-btn ${listening ? 'ai-chat-icon-btn--active' : ''}`}
          title={voiceSupported ? 'Hablar' : 'Voz no soportada en este navegador'}
          disabled={!voiceSupported}
          onClick={handleMicClick}
        >
          <Mic size={16} />
        </button>
        <button className="ai-chat-icon-btn" title="Importar por foto" onClick={() => imageInputRef.current?.click()}>
          <ImageIcon size={16} />
        </button>
        <input
          type="file"
          accept="image/*"
          ref={imageInputRef}
          style={{ display: 'none' }}
          onChange={handleImageChange}
        />
        <input
          className="ai-chat-text-input"
          placeholder={listening ? 'Escuchando...' : 'Ej: agregá una tabla Cliente'}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
        />
        <button className="ai-chat-icon-btn ai-chat-icon-btn--send" onClick={handleSend}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}