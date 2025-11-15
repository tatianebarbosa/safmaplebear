// import { useState } from "react"; // Removido para simplificar
import Header from "@/components/layout/Header";
import CanvaManagement from "@/components/canva/CanvaDashboard";
import { Footer } from "@/components/layout/Footer";
import FloatingAIChat from "@/components/ai/FloatingAIChat";

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      <main className="flex-grow px-6 py-8 max-w-7xl mx-auto w-full">
        <CanvaManagement />
      </main>
      
      <FloatingAIChat />
      <Footer />
    </div>
  );
};

export default Index;
