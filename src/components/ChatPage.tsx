import { useState, useRef, useEffect } from "react";
import { Mic, Send, User, Bot, Loader2, HeartPulse, Stethoscope, Languages, Plus, Apple, Sparkles, Pill, Pause, Volume2, VolumeX, RotateCcw, X, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { getChatResponse } from "../services/gemini";

interface Message {
  role: "user" | "model";
  text: string;
}

interface ChatPageProps {
  language: "EN" | "AM";
  setLanguage: React.Dispatch<React.SetStateAction<"EN" | "AM">>;
}

const Typewriter = ({ text, onScroll, onComplete, isTyping }: { text: string; onScroll?: () => void; onComplete?: () => void; isTyping: boolean }) => {
  const [displayText, setDisplayText] = useState("");
  
  useEffect(() => {
    if (!isTyping) {
      setDisplayText(text);
      return;
    }

    let i = 0;
    const speed = 15;
    const charsPerTick = 12; // Fast typing
    
    const timer = setInterval(() => {
      i += charsPerTick;
      if (i >= text.length) {
        setDisplayText(text);
        clearInterval(timer);
        onComplete?.();
      } else {
        setDisplayText(text.slice(0, i));
      }
      onScroll?.();
    }, speed);
    
    return () => clearInterval(timer);
  }, [text, onScroll, onComplete, isTyping]);

  return <ReactMarkdown>{displayText}</ReactMarkdown>;
};

export default function ChatPage({ language, setLanguage }: ChatPageProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [activeMessageIndex, setActiveMessageIndex] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Pre-load voices
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      const handleVoicesChanged = () => window.speechSynthesis.getVoices();
      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        window.speechSynthesis.cancel();
      };
    }
  }, []);

  const handleSend = async (text?: string) => {
    if (isLoading || isTyping) {
      setIsLoading(false);
      setIsTyping(false);
      return;
    }
    const messageToSend = text || input.trim();
    if (!messageToSend) return;

    setInput("");
      
    setMessages(prev => [...prev, { role: "user", text: messageToSend }]);
    setIsLoading(true);

    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const response = await getChatResponse(messageToSend, history, language);
    setMessages(prev => [...prev, { role: "model", text: response }]);
    setIsLoading(false);
    setIsTyping(true);
  };

  const handleResend = (index: number) => {
    const msg = messages[index];
    if (msg.role === "user") {
      handleSend(msg.text);
    } else {
      // It's a model message, find the most recent user message before it
      for (let j = index - 1; j >= 0; j--) {
        if (messages[j].role === "user") {
          handleSend(messages[j].text);
          break;
        }
      }
    }
    setActiveMessageIndex(null);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(language === "AM" ? "የድምጽ ፍለጋ በዚህ ብሮውዘር ላይ አይሰራም" : "Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false; 
    recognition.interimResults = true;
    recognition.lang = language === "AM" ? 'am-ET' : 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setInput("");
    };
    
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      
      let errorMsg = language === "AM" ? "የድምጽ ስህተት፡ " : "Speech error: ";
      if (event.error === 'network') {
        errorMsg += language === "AM" 
          ? "የኔትወርክ ግንኙነት ክፍተት ተፈጥሯል። የድምጽ መለያ አገልግሎቱ የኢንተርኔት ግንኙነት ይፈልጋል። እባክዎ ኢንተርኔትዎን ያረጋግጡ ወይም በጽሑፍ ግብዓት ይጠቀሙ።" 
          : "Network connection error. Speech recognition requires an active internet connection to communicate with Google's translation servers. Please check your internet or type your message manually.";
      } else if (event.error === 'not-allowed') {
        errorMsg += language === "AM" 
          ? "የማይክሮፎን ፈቃድ ተከልክሏል። እባክዎን በብሮውዘርዎ አድራሻ ባር ላይ ያለውን የማይክሮፎን ምልክት በመጫን ፈቃድ ይስጡ።" 
          : "Microphone permission denied. Please allow microphone access in your browser settings (usually by clicking the lock icon in the address bar).";
      } else if (event.error === 'no-speech') {
        return;
      } else {
        errorMsg += event.error;
      }
      setError(errorMsg);
      setTimeout(() => setError(""), 5000);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        const text = finalTranscript.trim();
        if (text) {
          setInput(text);
          recognition.stop();
          handleSend(text);
        }
      } else if (interimTranscript) {
        setInput(interimTranscript);
      }
    };

    recognition.start();
  };

  const t = {
    EN: {
      assistant: "ASSISTANT",
      help: "What can I help with?",
      tips: "Healthy Tips",
      wellness: "Wellness Advice",
      meds: "Medication Info",
      placeholder: "Ask about symptoms, health tips...",
      footer: "HEALTHCARE AI ASSISTANT • SECURE & PRIVATE",
      loading: "Retrieving medical data...",
      clearHistory: "Clear History",
      clearConfirm: "Clear chat history?",
      cancel: "Cancel",
    },
    AM: {
      assistant: "ረዳት",
      help: "በምን ልርዳዎት?",
      tips: "ጤናማ ምክሮች",
      wellness: "የደህንነት ምክር",
      meds: "የመድኃኒት መረጃ",
      placeholder: "ስለ ምልክቶች፣ የጤና ምክሮች ይጠይቁ...",
      footer: "የጤና እንክብካቤ AI ረዳት • ደህንነቱ የተጠበቀ እና የግል",
      loading: "የሕክምና መረጃ በማምጣት ላይ...",
      clearHistory: "ውይይት አጽዳ",
      clearConfirm: "ውይይቱን ላጽዳው?",
      cancel: "ተው",
    }
  }[language];

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    window.speechSynthesis.cancel();
    setSpeakingIndex(null);
    setActiveMessageIndex(null);
    setShowClearConfirm(false);
  };

  const toggleSpeak = (text: string, index: number) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    
    // Clean text for better speech (remove markdown symbols)
    const cleanText = text.replace(/[#*`_~]/g, '').replace(/\[|\]/g, '');
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Detect language of the specific text (Ethiopic characters range for Amharic)
    const hasAmharic = /[\u1200-\u137F\u1380-\u139F\u2D80-\u2DDF]/.test(cleanText);
    
    // Try to find a high-quality professional AI voice
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = null;
    
    if (hasAmharic) {
      utterance.lang = 'am-ET';
      // Amharic usually has limited voices, we look for any available Amharic voice
      // We look for lang starting with 'am' or voice names containing 'amharic' or 'አማርኛ'
      selectedVoice = voices.find(v => v.lang.startsWith('am-') || v.lang === 'am')
                      || voices.find(v => v.name.toLowerCase().includes('amharic'))
                      || voices.find(v => v.name.includes('አማርኛ'));
    } else {
      utterance.lang = 'en-US';
      selectedVoice = voices.find(v => (v.name.includes('Male') || v.name.includes('David') || v.name.includes('Guy') || v.name.includes('Mark') || v.name.includes('George') || v.name.includes('Microsoft David')) && v.lang.startsWith('en'))
                      || voices.find(v => v.name.includes('Google US English') || v.name.includes('Natural'))
                      || voices.find(v => v.lang.startsWith('en-US'));
    }
    
    if (selectedVoice) utterance.voice = selectedVoice;
    
    // AI Voice Tuning
    if (hasAmharic) {
      utterance.pitch = 1.0;
      utterance.rate = 0.85; // Natural Amharic speed
    } else {
      utterance.pitch = 0.92; // Solid, professional male pitch
      utterance.rate = 0.94;  // Smooth pacing
    }
    utterance.volume = 1.0;
    
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);
    
    window.speechSynthesis.speak(utterance);
    setSpeakingIndex(index);
  };

  const suggestions = [
    { icon: <Apple size={20} className="text-blue-400" />, text: t.tips },
    { icon: <Sparkles size={20} className="text-blue-400" />, text: t.wellness },
    { icon: <Pill size={20} className="text-blue-400" />, text: t.meds },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-[#0A0A0A] text-white font-sans overflow-hidden">
      {/* Header */}
      <div className="p-4 px-6 flex items-center justify-between border-b border-white/5 bg-[#0A0A0A]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/20 flex items-center justify-center text-blue-500">
            <HeartPulse size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight leading-none">IHS AI</h1>
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1">{t.assistant}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-white/70">
          <button 
            onClick={() => {
              if (window.speechSynthesis) window.speechSynthesis.cancel();
              setSpeakingIndex(null);
              setLanguage(prev => prev === "EN" ? "AM" : "EN");
            }}
            className={`hover:text-white transition-colors flex items-center gap-1.5 ${language === "AM" ? "text-blue-500" : ""}`}
            title={language === "AM" ? "ቋንቋ ለመቀየር" : "Change Language"}
          >
            <Languages size={20} />
            <span className="text-xs font-bold">{language}</span>
          </button>

          <button 
            onClick={handleNewChat}
            className="hover:text-white transition-colors"
            title={language === "AM" ? "አዲስ ውይይት" : "New Chat"}
          >
            <Plus size={20} />
          </button>

          {messages.length > 0 && (
            <button 
              onClick={() => setShowClearConfirm(true)}
              className="text-white/40 hover:text-red-400 transition-colors"
              title={t.clearHistory}
            >
              <Trash2 size={19} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto relative"
      >
        <div className="max-w-2xl mx-auto w-full h-full">
          <AnimatePresence mode="wait">
            {messages.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center min-h-full p-6 space-y-12"
              >
                {/* Center Icon */}
                <div className="w-24 h-24 rounded-[32px] bg-blue-600 flex items-center justify-center text-white shadow-[0_0_50px_rgba(37,99,235,0.3)]">
                  <HeartPulse size={48} />
                </div>

                <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight">
                  {t.help}
                </h2>

                {/* Suggestions */}
                <div className="w-full max-w-md space-y-3">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(s.text)}
                      className="w-full flex items-center gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all group text-left"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center group-hover:bg-blue-600/20 transition-colors">
                        {s.icon}
                      </div>
                      <span className="font-medium text-white/90">{s.text}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="p-6 space-y-8 pb-12">
                {messages.map((msg, i) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`flex gap-4 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                      <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${
                        msg.role === "user" ? "bg-white/10" : "bg-blue-600 text-white"
                      }`}>
                        {msg.role === "user" ? <User size={16} /> : <HeartPulse size={16} />}
                      </div>
                      <div 
                        onClick={() => {
                          if (!isTyping) {
                            setActiveMessageIndex(activeMessageIndex === i ? null : i);
                          }
                        }}
                        className={`p-4 rounded-2xl text-sm leading-relaxed transition-all cursor-pointer ${
                          msg.role === "user" 
                            ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/10 active:scale-[0.98]" 
                            : "bg-white/[0.03] text-white/90 border border-white/5 hover:bg-white/[0.05]"
                        }`}
                      >
                        <div className="markdown-body prose prose-invert prose-sm max-w-none">
                          {msg.role === "model" && i === messages.length - 1 ? (
                            <Typewriter 
                              text={msg.text} 
                              isTyping={isTyping}
                              onComplete={() => {
                                setIsTyping(false);
                                if (language === "AM") {
                                  toggleSpeak(msg.text, i);
                                }
                              }}
                              onScroll={() => {
                                if (scrollRef.current) {
                                  scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                                }
                              }} 
                            />
                          ) : (
                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                          )}
                        </div>
                        
                        {!isTyping && (msg.role === "model" || activeMessageIndex === i) && (
                          <motion.div 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-3 flex justify-end gap-2"
                          >
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSpeak(msg.text, i);
                              }}
                              className={`p-2 rounded-xl border transition-all flex items-center justify-center ${
                                msg.role === "user" 
                                  ? "bg-white/10 border-white/10 text-white/70 hover:text-white" 
                                  : "bg-white/5 border-white/10 text-white/40 hover:text-blue-400 hover:bg-blue-600/10"
                              } ${speakingIndex === i ? (msg.role === "user" ? "bg-white/20 text-blue-300" : "text-blue-500 bg-blue-500/10 border-blue-500/20") : ""}`}
                              title="Listen"
                            >
                              {speakingIndex === i ? <VolumeX size={14} /> : <Volume2 size={14} />}
                            </button>
                            {(msg.role === "user" || activeMessageIndex === i) && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleResend(i);
                                }}
                                className={`p-2 rounded-xl border transition-all flex items-center justify-center ${
                                  msg.role === "user" 
                                    ? "bg-white/10 border-white/10 text-white/70 hover:text-white" 
                                    : "bg-white/5 border-white/10 text-white/40 hover:text-blue-400 hover:bg-blue-600/10"
                                }`}
                                title={msg.role === "user" ? "Resend" : "Regenerate"}
                              >
                                <RotateCcw size={14} />
                              </button>
                            )}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                        <HeartPulse size={16} />
                      </div>
                      <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                        <Loader2 size={18} className="animate-spin text-blue-500" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-6 pb-6 max-w-2xl mx-auto w-full space-y-4">
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-bold text-center uppercase tracking-wider overflow-hidden"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative flex items-center gap-1 bg-white/[0.03] border border-white/10 rounded-[24px] p-2 px-3 focus-within:border-blue-500/50 transition-all">
          <button
            onClick={toggleListening}
            className={`p-2 transition-colors ${
              isListening ? "text-red-500 animate-pulse" : "text-white/40 hover:text-white"
            }`}
            title="Voice input"
          >
            <Mic size={20} />
          </button>
          {isListening ? (
            <div className="flex-1 flex items-center justify-between px-2 gap-3 md:gap-5">
              <span className="text-xs text-blue-400 font-bold tracking-wide animate-pulse shrink-0">
                {language === "AM" ? "እያዳመጠ ነው..." : "LISTENING"}
              </span>
              <div className="flex items-center gap-1 pb-1 justify-center flex-1 max-w-[200px]">
                {Array.from({ length: 15 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-[3px] bg-blue-500 rounded-full"
                    animate={{
                      height: [
                        "6px",
                        `${Math.max(6, Math.sin(i * 0.45) * 22 + 14)}px`,
                        `${Math.max(6, Math.cos(i * 0.65) * 18 + 10)}px`,
                        "6px"
                      ],
                    }}
                    transition={{
                      duration: 0.7 + (i % 4) * 0.12,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
              <span className="text-xs text-white/40 truncate italic flex-grow text-right max-w-[150px] md:max-w-[220px]">
                {input || (language === "AM" ? "ድምጽዎን ይናገሩ..." : "Speak now...")}
              </span>
            </div>
          ) : (
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder={t.placeholder}
              className="flex-1 bg-transparent border-none focus:outline-none text-sm py-3 text-white placeholder:text-white/30"
            />
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSend()}
            disabled={(!input.trim() && !isLoading && !isTyping)}
            className={`p-2.5 rounded-xl transition-all duration-300 flex items-center justify-center ${
              (!input.trim() && !isLoading && !isTyping)
                ? "text-white/10 bg-white/5 cursor-not-allowed"
                : "text-white bg-blue-600 shadow-[0_4px_12px_rgba(37,99,235,0.25)] hover:shadow-[0_4px_20px_rgba(37,99,235,0.45)] hover:bg-blue-500 active:shadow-inner"
            }`}
          >
            <AnimatePresence mode="wait">
              {(isLoading || isTyping) ? (
                <motion.div
                  key="pause"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Pause size={18} fill="currentColor" />
                </motion.div>
              ) : (
                <motion.div
                  key="send"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Send size={18} className={input.trim() ? "rotate-45 -translate-y-0.5" : ""} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
        
        <p className="text-[10px] text-center font-bold text-white/20 uppercase tracking-[0.2em]">
          {t.footer}
        </p>
      </div>

      {/* Centered Clear Chat Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowClearConfirm(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-sm rounded-2xl bg-[#141414] border border-white/10 p-6 shadow-2xl z-10 text-center"
            >
              <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-4 animate-bounce">
                <Trash2 size={24} />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                {language === "AM" ? "ውይይቱን ማጽዳት ይፈልጋሉ?" : "Clear Chat History?"}
              </h3>
              <p className="text-xs text-white/50 mb-6 leading-relaxed">
                {language === "AM" 
                  ? "ይህንን ውይይት ካጠፉት በኋላ መልሰው ማግኘት አይችሉም።" 
                  : "Are you sure you want to delete all messages? This action cannot be undone."}
              </p>
              <div className="flex items-center gap-3 justify-center">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 text-xs font-semibold tracking-wide transition active:scale-95 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={() => {
                    handleNewChat();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold tracking-wide transition active:scale-95 shadow-lg shadow-red-600/10 cursor-pointer"
                >
                  {language === "AM" ? "አዎ አጽዳ" : "Yes, Clear"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
