import { useState } from "react";
import Header from "@/components/layout/Header";
import SAFControlCenter from "@/components/saf/SAFControlCenter";
import SchoolManagement from "@/components/schools/SchoolManagement";
import UserAnalytics from "@/components/analytics/UserAnalytics";
import MonitoringPortal from "@/components/monitoring/MonitoringPortal";
import RealAIAssistant from "@/components/ai/RealAIAssistant";
import UserManagement from "@/components/users/UserManagement";
import VoucherManagement from "@/components/saf/VoucherManagement";
import AIKnowledgeBase from "@/components/saf/AIKnowledgeBase";
import ProfileManagement from "@/components/auth/ProfileManagement";

const Index = () => {
  const [activeSection, setActiveSection] = useState("saf-control");

  const renderContent = () => {
    switch (activeSection) {
      case "saf-control":
        return <SAFControlCenter />;
      case "management":
        return <SchoolManagement />;
      case "users":
        return <UserManagement />;
      case "analytics":
        return <UserAnalytics />;
      case "monitoring":
        return <MonitoringPortal />;
      case "ai":
        return <RealAIAssistant />;
      case "vouchers":
        return <VoucherManagement />;
      case "knowledge":
        return <AIKnowledgeBase />;
      case "profile":
        return <ProfileManagement />;
      default:
        return <SAFControlCenter />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      
      <main className="px-6 py-8 max-w-7xl mx-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
