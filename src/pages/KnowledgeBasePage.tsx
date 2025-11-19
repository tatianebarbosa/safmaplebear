import Header from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import AIKnowledgeBase from "@/components/saf/AIKnowledgeBase";

const KnowledgeBasePage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-6 py-8 w-full">
        <AIKnowledgeBase />
      </main>
      <Footer />
    </div>
  );
};

export default KnowledgeBasePage;
