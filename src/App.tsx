/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import ChatPage from "./components/ChatPage";
import StorePage from "./components/StorePage";
import DrugDetailPage from "./components/DrugDetailPage";
import MaternalPage from "./components/MaternalPage";
import SideNav from "./components/SideNav";

export default function App() {
  const [activeTab, setActiveTab] = useState<"chat" | "store" | "maternal">("chat");
  const [selectedDrug, setSelectedDrug] = useState<any>(null);
  const [language, setLanguage] = useState<"EN" | "AM">("EN");

  return (
    <div className="fixed inset-0 bg-[#0A0A0A] overflow-hidden flex flex-row font-sans">
      <SideNav activeTab={activeTab} onTabChange={(tab) => {
        setActiveTab(tab);
        if (tab !== "store") setSelectedDrug(null);
      }} language={language} />

      <main className="flex-1 relative overflow-hidden">
        <div className={`absolute inset-0 transition-all duration-500 ease-in-out ${
          activeTab === "chat" ? "translate-x-0 opacity-100 z-10" : "-translate-x-full opacity-0 pointer-events-none z-0"
        }`}>
          <ChatPage language={language} setLanguage={setLanguage} />
        </div>

        <div className={`absolute inset-0 transition-all duration-500 ease-in-out ${
          activeTab === "maternal" ? "translate-x-0 opacity-100 z-10" : (activeTab === "chat" ? "translate-x-full" : "-translate-x-full") + " opacity-0 pointer-events-none z-0"
        }`}>
          <MaternalPage language={language} setLanguage={setLanguage} />
        </div>
        
        <div className={`absolute inset-0 transition-all duration-500 ease-in-out ${
          activeTab === "store" ? "translate-x-0 opacity-100 z-10" : "translate-x-full opacity-0 pointer-events-none z-0"
        }`}>
          {selectedDrug ? (
            <DrugDetailPage drug={selectedDrug} onBack={() => setSelectedDrug(null)} language={language} />
          ) : (
            <StorePage onShowMore={setSelectedDrug} language={language} />
          )}
        </div>
      </main>
    </div>
  );
}

