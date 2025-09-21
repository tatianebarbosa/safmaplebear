import { useState } from "react";
import Header from "@/components/layout/Header";
import Dashboard from "@/components/dashboard/Dashboard";
import RankingDashboard from "@/components/ranking/RankingDashboard";
import SchoolManagement from "@/components/schools/SchoolManagement";
import UserAnalytics from "@/components/analytics/UserAnalytics";
import MonitoringPortal from "@/components/monitoring/MonitoringPortal";
import AIAssistant from "@/components/ai/AIAssistant";

const Index = () => {
  const [activeSection, setActiveSection] = useState("dashboard");

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <Dashboard />;
      case "management":
        return <SchoolManagement />;
      case "history":
        return <RankingDashboard />;
      case "analytics":
        return <UserAnalytics />;
      case "monitoring":
        return <MonitoringPortal />;
      case "ai":
        return <AIAssistant />;
      case "settings":
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Configurações</h1>
            <p className="text-muted-foreground">Funcionalidade em desenvolvimento...</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      
      <main className="container mx-auto px-6 py-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
