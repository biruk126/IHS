import { MessageSquare, ShoppingBag, HeartPulse, Baby } from "lucide-react";
import { motion } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SideNavProps {
  activeTab: "chat" | "store" | "maternal";
  onTabChange: (tab: "chat" | "store" | "maternal") => void;
  language: "EN" | "AM";
}

export default function SideNav({ activeTab, onTabChange, language }: SideNavProps) {
  const t = {
    EN: { home: "Home", store: "Store", maternal: "Mama" },
    AM: { home: "መነሻ", store: "መደብር", maternal: "እናት" }
  }[language];

  return (
    <div className="h-full w-24 bg-[#0F0F0F] border-r border-white/5 flex flex-col items-center py-8 gap-8 z-50">
      <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] mb-4">
        <HeartPulse size={24} className="animate-pulse" />
      </div>

      <nav className="flex flex-col gap-4">
        <button
          onClick={() => onTabChange("chat")}
          className={cn(
            "relative w-16 h-16 flex flex-col items-center justify-center gap-1 rounded-2xl transition-all duration-300 group",
            activeTab === "chat" ? "text-white bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.4)]" : "text-white/20 hover:text-white hover:bg-white/5"
          )}
        >
          <MessageSquare size={20} />
          <span className="text-[10px] font-bold uppercase tracking-wider">{t.home}</span>
        </button>

        <button
          onClick={() => onTabChange("maternal")}
          className={cn(
            "relative w-16 h-16 flex flex-col items-center justify-center gap-1 rounded-2xl transition-all duration-300 group",
            activeTab === "maternal" ? "text-white bg-pink-600 shadow-[0_0_15px_rgba(236,72,153,0.4)]" : "text-white/20 hover:text-white hover:bg-white/5"
          )}
        >
          <Baby size={20} />
          <span className="text-[10px] font-bold uppercase tracking-wider">{t.maternal}</span>
        </button>

        <button
          onClick={() => onTabChange("store")}
          className={cn(
            "relative w-16 h-16 flex flex-col items-center justify-center gap-1 rounded-2xl transition-all duration-300 group",
            activeTab === "store" ? "text-white bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "text-white/20 hover:text-white hover:bg-white/5"
          )}
        >
          <ShoppingBag size={20} />
          <span className="text-[10px] font-bold uppercase tracking-wider">{t.store}</span>
        </button>
      </nav>
    </div>
  );
}
