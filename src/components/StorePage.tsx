import { Star, Search, Loader2, Heart, Menu, X, Info, Image as ImageIcon, HeartPulse, Mic, Send } from "lucide-react";
import { motion } from "motion/react";
import { useState, useRef } from "react";
import { findMedications } from "../services/gemini";

interface Product {
  id: string | number;
  name: string;
  price: number;
  rating: number;
  image: string;
  category: string;
  description?: string;
  dosage?: string;
  commonUsage?: string;
  sideEffects?: string;
  imagePrompt?: string;
}

interface StorePageProps {
  onShowMore: (drug: any) => void;
  language: "EN" | "AM";
}

export default function StorePage({ onShowMore, language }: StorePageProps) {
  const [query, setQuery] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const t = {
    EN: {
      home: "Home",
      pharmacy: "Pharmacy",
      consultation: "Consultation",
      support: "Contact Support",
      heroBadge: "AI-Powered Guidance",
      heroTitle: "Find the Right Medication Fast",
      heroText: "Enter symptoms or a disease name to discover appropriate medications and their usage details.",
      placeholder: "e.g., Headache, Fever, Hypertension...",
      search: "Search",
      popular: "Popular:",
      noResults: "No results yet",
      noResultsText: "Enter a disease name or symptoms above to find information about appropriate medications.",
      recommended: "Recommended Medications",
      queryLabel: "Based on your query:",
      resultsFound: "Results found",
      analyzing: "Analyzing symptoms and finding medications...",
      usageLabel: "Common Usage",
      sideEffectsLabel: "Side Effects",
      priceLabel: "Price",
      showMore: "Show More",
      showImage: "Show Image",
      searchAgain: "Search for another symptom...",
      about: "About Us",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      help: "Help Center",
      contact: "Contact Us",
      sitemap: "Sitemap",
      footerText: "Empowering individuals with instant access to medication information through advanced AI technology. Your health, our priority.",
    },
    AM: {
      home: "መነሻ",
      pharmacy: "ፋርማሲ",
      consultation: "ምክክር",
      support: "ድጋፍ ያግኙ",
      heroBadge: "በAI የታገዘ መመሪያ",
      heroTitle: "ትክክለኛውን መድሃኒት በፍጥነት ያግኙ",
      heroText: "ተገቢ የሆኑ መድሃኒቶችን እና የአጠቃቀም ዝርዝሮቻቸውን ለማግኘት ምልክቶችን ወይም የበሽታ ስም ያስገቡ።",
      placeholder: "ምሳሌ፡ ራስ ምታት፣ ትኩሳት፣ የደም ግፊት...",
      search: "ፈልግ",
      popular: "ታዋቂ፡",
      noResults: "ምንም ውጤት የለም",
      noResultsText: "ስለ ተገቢ መድሃኒቶች መረጃ ለማግኘት የበሽታ ስም ወይም ምልክቶችን ከላይ ያስገቡ።",
      recommended: "የሚመከሩ መድሃኒቶች",
      queryLabel: "በጥያቄዎ መሠረት፡",
      resultsFound: "ውጤቶች ተገኝተዋል",
      analyzing: "ምልክቶችን በመተንተን እና መድሃኒቶችን በመፈለግ ላይ...",
      usageLabel: "የተለመደ አጠቃቀም",
      sideEffectsLabel: "የጎንዮሽ ጉዳቶች",
      priceLabel: "ዋጋ",
      showMore: "ተጨማሪ አሳይ",
      showImage: "ምስል አሳይ",
      searchAgain: "ሌላ ምልክት ይፈልጉ...",
      about: "ስለ እኛ",
      privacy: "የግላዊነት ፖሊሲ",
      terms: "የአገልግሎት ውሎች",
      help: "የእርዳታ ማዕከል",
      contact: "ያግኙን",
      sitemap: "የጣቢያ ካርታ",
      footerText: "በላቁ የAI ቴክኖሎጂ አማካኝነት ግለሰቦች የመድኃኒት መረጃን በፍጥነት እንዲያገኙ ማብቃት። ጤናዎ ቅድሚያ የምንሰጠው ጉዳይ ነው።",
    }
  }[language];

  const handleSearch = async (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (!finalQuery.trim()) return;
    
    setQuery(finalQuery);
    setLastQuery(finalQuery);
    setIsLoading(true);
    setError("");
    setProducts([]);

    try {
      const response = await findMedications(finalQuery, language);
      
      if (response) {
        try {
          const data = JSON.parse(response);
          if (data.recommendations && data.recommendations.length > 0) {
            const initialProducts = data.recommendations.map((item: any, index: number) => ({
              id: `${finalQuery}-${index}`,
              name: item.name,
              price: item.price || 19.99,
              rating: item.rating || 4.5,
              category: item.category || "General",
              description: item.description,
              dosage: item.dosage,
              commonUsage: item.commonUsage,
              sideEffects: item.sideEffects,
              image: "",
            }));
            
            setProducts(initialProducts);
          } else {
            setError(language === "AM" ? "ምንም ውጤት አልተገኘም። እባክዎ ሌላ ምልክት ይሞክሩ።" : "No recommendations found. Please try more specific symptoms.");
          }
        } catch (e) {
          throw new Error("Invalid response format");
        }
      } else {
        setError(language === "AM" ? "ለዚያ የተለየ ምክር ማግኘት አልቻልኩም። እባክዎ ሌላ ምልክት ይሞክሩ።" : "I couldn't find specific recommendations for that. Please try another symptom.");
      }
    } catch (err) {
      console.error(err);
      setError(language === "AM" ? "ችግር ተፈጥሯል። እባክዎ እንደገና ይሞክሩ።" : "Failed to retrieve medications. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
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
      setQuery("");
    };
    
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      
      let errorMsg = language === "AM" ? "የድምጽ ስህተት፡ " : "Speech error: ";
      if (event.error === 'network') {
        errorMsg += language === "AM" 
          ? "የኔትወርክ ግንኙነት ክፍተት ተፈጥሯል። የድምጽ መለያ አገልግሎቱ የኢንተርኔት ግንኙነት ይፈልጋል። እባክዎ ኢንተርኔትዎን ያረጋግጡ ወይም በጽሑፍ ግብዓት ይጠቀሙ።" 
          : "Network connection error. Speech recognition requires an active internet connection to communicate with Google's translation servers. Please check your internet or type your search query manually.";
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
          setQuery(text);
          recognition.stop();
          handleSearch(text);
        }
      } else if (interimTranscript) {
        setQuery(interimTranscript);
      }
    };

    recognition.start();
  };

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] text-white font-sans overflow-hidden">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg tracking-tight text-white uppercase">IHS Store</span>
        </div>

        <div className="flex-1 max-w-md mx-6 hidden md:block">
          <div className="relative flex items-center bg-white/[0.03] border border-white/10 rounded-xl px-4 group focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50 transition-all">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              placeholder={t.placeholder} 
              className="w-full bg-transparent border-none outline-none focus:ring-0 text-sm py-2 text-white placeholder:text-white/20"
            />
            <button
              onClick={toggleListening}
              className={`p-1.5 transition-colors ${
                isListening ? "text-red-500 animate-pulse" : "text-white/30 hover:text-white"
              }`}
              title="Voice search"
            >
              <Mic size={16} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="hidden md:block px-4 py-2 bg-white/5 border border-white/10 text-white/70 text-xs font-semibold rounded-full hover:bg-white/10 transition-colors">
            {t.support}
          </button>
        </div>
      </nav>

      <div className="flex-1 overflow-y-auto">
        {products.length === 0 && !isLoading ? (
          /* Hero Section (Only show when no results) */
          <div className="max-w-4xl mx-auto px-6 pt-12 pb-20 text-center space-y-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-wider"
            >
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              {t.heroBadge}
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.05]"
            >
              {t.heroTitle.split("Medication").map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && <span className="text-blue-500">{language === "AM" ? "መድሃኒት" : "Medication"}</span>}
                </span>
              ))}
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white/40 text-sm md:text-base max-w-lg mx-auto leading-relaxed"
            >
              {t.heroText}
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative max-w-xl mx-auto mt-12"
            >
              <div className="flex items-center bg-white/[0.03] rounded-3xl border border-white/10 p-2 focus-within:border-blue-500/50 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                <div className="flex-1 flex items-center px-6 gap-3">
                  <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    placeholder={t.placeholder} 
                    className="w-full bg-transparent border-none outline-none focus:ring-0 focus:outline-none text-sm py-4 text-white placeholder:text-white/20"
                  />
                  <button
                    onClick={toggleListening}
                    className={`p-2 transition-colors ${
                      isListening ? "text-red-500 animate-pulse" : "text-white/20 hover:text-white"
                    }`}
                    title="Voice search"
                  >
                    <Mic size={20} />
                  </button>
                </div>
                <button 
                  onClick={() => handleSearch()}
                  disabled={isLoading || !query.trim()}
                  className={`p-3.5 rounded-2xl transition-all duration-300 flex items-center justify-center ${
                    (isLoading || !query.trim())
                      ? "text-white/10 bg-white/5 cursor-not-allowed"
                      : "text-white bg-blue-600 shadow-[0_4px_12px_rgba(37,99,235,0.25)] hover:shadow-[0_4px_20px_rgba(37,99,235,0.45)] hover:bg-blue-500 active:shadow-inner active:scale-95 cursor-pointer"
                  }`}
                >
                  {isLoading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-[10px] font-bold tracking-wider uppercase">
                <span className="text-white/20 mr-1">{t.popular}</span>
                {(language === "AM" ? ["ጉንፋን", "የጀርባ ህመም", "አለርጂ", "እንቅልፍ ማጣት"] : ["Common Cold", "Back Pain", "Allergies", "Insomnia"]).map((tag) => (
                  <button 
                    key={tag}
                    onClick={() => handleSearch(tag)}
                    className="px-4 py-2 bg-white/[0.03] border border-white/5 rounded-full text-white/50 hover:border-blue-500/50 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 space-y-6"
            >
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white/80">{t.noResults}</h3>
                <p className="text-white/20 text-xs max-w-xs mx-auto">
                  {t.noResultsText}
                </p>
              </div>
            </motion.div>
          </div>
        ) : (
          /* Results View */
          <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/5">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-white tracking-tight">{t.recommended}</h2>
                <p className="text-sm text-white/40">{t.queryLabel} <span className="font-bold text-blue-500">"{lastQuery}"</span></p>
              </div>
              <div className="flex items-center gap-3 text-white/30 text-[10px] font-bold uppercase tracking-widest bg-white/[0.02] px-4 py-2 rounded-full border border-white/5">
                <span>{products.length} {t.resultsFound}</span>
              </div>
            </div>

            {isLoading && products.length === 0 && (
              <div className="flex flex-col items-center justify-center py-60">
                <div className="flex items-center gap-4">
                  {[0, 1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0.4, scale: 0.8 }}
                      animate={{ 
                        opacity: [0.4, 1, 0.4],
                        scale: [0.8, 1.2, 0.8]
                      }}
                      transition={{ 
                        duration: 1, 
                        repeat: Infinity, 
                        delay: i * 0.2,
                        ease: "easeInOut"
                      }}
                      className="w-4 h-4 bg-cyan-400 rounded-full shadow-[0_0_20px_rgba(34,211,238,0.6)]"
                    />
                  ))}
                </div>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="mt-12 text-cyan-400 text-[10px] font-black tracking-[0.5em] uppercase drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]"
                >
                  {t.analyzing}
                </motion.p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-6 rounded-3xl text-sm max-w-md mx-auto text-center font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white/[0.03] hover:bg-white/[0.05] rounded-[40px] overflow-hidden border border-white/5 transition-all group p-8 flex flex-col space-y-8"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-3">
                      <h3 className="text-2xl font-bold text-white leading-tight">{product.name}</h3>
                      {product.dosage && (
                        <div className="inline-block px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded-lg">
                          {product.dosage}
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-white/50 leading-relaxed">
                    {product.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                    {product.commonUsage && (
                      <div className="space-y-2">
                        <div className="text-blue-500 text-[10px] font-bold uppercase tracking-widest">
                          {t.usageLabel}
                        </div>
                        <p className="text-xs text-white/30 leading-relaxed">{product.commonUsage}</p>
                      </div>
                    )}
                    
                    {product.sideEffects && (
                      <div className="space-y-2">
                        <div className="text-yellow-500/70 text-[10px] font-bold uppercase tracking-widest">
                          {t.sideEffectsLabel}
                        </div>
                        <p className="text-xs text-white/30 leading-relaxed">{product.sideEffects}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-8 mt-auto flex items-center justify-between border-t border-white/5">
                    <button 
                      onClick={() => window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(product.name + " medication packaging")}`, '_blank')}
                      className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-2 group/img"
                    >
                      <ImageIcon size={14} className="group-hover/img:scale-110 transition-transform" />
                      {t.showImage}
                    </button>
                    
                    <button 
                      onClick={() => onShowMore(product)}
                      className="bg-blue-600 text-white px-8 py-3 rounded-2xl text-xs font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-[0_10px_20px_rgba(37,99,235,0.2)]"
                    >
                      {t.showMore}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Search Again Bar */}
            <div className="max-w-2xl mx-auto pt-24 pb-12">
              <div className="flex items-center bg-white/[0.03] backdrop-blur-sm rounded-3xl border border-white/10 p-2 focus-within:border-blue-500/50 transition-all shadow-[0_15px_40px_rgba(0,0,0,0.2)]">
                <div className="flex-1 flex items-center px-6 gap-3">
                  <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    placeholder={t.searchAgain} 
                    className="w-full bg-transparent border-none outline-none focus:ring-0 focus:outline-none text-sm py-4 text-white placeholder:text-white/20"
                  />
                  <button
                    onClick={toggleListening}
                    className={`p-2 transition-colors ${
                      isListening ? "text-red-500 animate-pulse" : "text-white/20 hover:text-white"
                    }`}
                    title="Voice search"
                  >
                    <Mic size={20} />
                  </button>
                </div>
                <button 
                  onClick={() => handleSearch()}
                  disabled={isLoading || !query.trim()}
                  className={`p-3.5 rounded-2xl transition-all duration-300 flex items-center justify-center ${
                    (isLoading || !query.trim())
                      ? "text-white/10 bg-white/5 cursor-not-allowed"
                      : "text-white bg-blue-600 shadow-[0_4px_12px_rgba(37,99,235,0.25)] hover:shadow-[0_4px_20px_rgba(37,99,235,0.45)] hover:bg-blue-500 active:shadow-inner active:scale-95 cursor-pointer"
                  }`}
                >
                  {isLoading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


