import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import API from '../services/api';
import GlassCard from '../components/GlassCard';

const CareerChatbot = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I am Nexora AI Career Mentor. I can help you review interview questions, draft cover letters, critique projects, or discuss career paths. Ask me anything!"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Build chat history for Gemini (exclude first default assistant greeting)
      const chatHistory = messages
        .slice(1)
        .map(msg => ({ role: msg.role, content: msg.content }));

      const response = await API.post('/ai/chat', {
        message: userMessage,
        history: chatHistory
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (error) {
      console.error('Chat failed:', error.message);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: error.response?.data?.message || 'AI service failed to respond. Please try again.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto space-y-4">
      <div>
        <h2 className="text-2xl font-extrabold page-heading-white">AI Career Coach</h2>
        <p className="text-xs page-subtitle-white mt-1">AI Chat Mentor</p>
      </div>

      <GlassCard className="flex-1 flex flex-col justify-between overflow-hidden p-0 relative" hover={false}>
        {/* Chat History Panel */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[calc(100vh-280px)]">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 items-start max-w-[85%] ${
                msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white' 
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-indigo-500" />}
              </div>

              <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-indigo-500 to-indigo-650 text-white font-medium rounded-tr-none'
                  : 'glass-effect border border-slate-200/50 dark:border-slate-800/40 text-slate-800 dark:text-slate-250 rounded-tl-none'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-start max-w-[85%]">
              <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="p-4 rounded-2xl glass-effect border border-slate-200/50 dark:border-slate-800/40 text-slate-400 text-xs rounded-tl-none flex items-center gap-1.5 font-bold">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200/50 dark:border-slate-800/40 bg-slate-50/20 dark:bg-slate-900/10 flex gap-3">
          <input
            type="text"
            required
            disabled={loading}
            placeholder="Type your career or interview question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-slate-100"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 active:scale-[0.98] transition flex items-center gap-1.5 shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </GlassCard>
    </div>
  );
};

export default CareerChatbot;
