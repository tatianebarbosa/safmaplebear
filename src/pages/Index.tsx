// import { useState } from "react"; // Removido para simplificar
import Header from "@/components/layout/Header";
import VoucherManagement from "@/components/saf/VoucherManagement";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="px-6 py-8 max-w-7xl mx-auto">
        <VoucherManagement />
      </main>
    </div>
  );
};

export default Index;
