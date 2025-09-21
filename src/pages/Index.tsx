import { useState } from "react";
import Header from "@/components/layout/Header";
import Dashboard from "@/components/dashboard/Dashboard";
import RankingDashboard from "@/components/ranking/RankingDashboard";
import SchoolManagement from "@/components/schools/SchoolManagement";
import UserAnalytics from "@/components/analytics/UserAnalytics";
import MonitoringPortal from "@/components/monitoring/MonitoringPortal";
import AIAssistant from "@/components/ai/AIAssistant";
import UserManagement from "@/components/users/UserManagement";
import VoucherManagement from "@/components/saf/VoucherManagement";
import AIKnowledgeBase from "@/components/saf/AIKnowledgeBase";

const Index = () => {
  const [activeSection, setActiveSection] = useState("dashboard");

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <Dashboard />;
      case "management":
        return <SchoolManagement />;
      case "users":
        return <UserManagement />;
      case "analytics":
        return <UserAnalytics />;
      case "monitoring":
        return <MonitoringPortal />;
      case "ai":
        return <AIAssistant />;
      case "vouchers":
        return <VoucherManagement />;
      case "knowledge":
        return <AIKnowledgeBase />;
      case "history":
        return <RankingDashboard />;
      case "settings":
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Configurações do Portal SAF</h1>
            <p className="text-muted-foreground">Configurações avançadas e integração com sistemas externos em desenvolvimento...</p>
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
