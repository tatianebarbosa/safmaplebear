import Header from "@/components/layout/Header";
import CanvaManagement from "@/components/canva/CanvaDashboard";
import SEO from "@/components/common/SEO";

const Index = () => {
  return (
    <>
      <SEO 
        title="Dashboard"
        description="Dashboard principal do sistema de gerenciamento de licenças Canva MapleBear"
        keywords="dashboard, maplebear, canva, gestão, licenças"
      />
      <div className="min-h-screen bg-background">
        <Header />
      
      <main className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
        <CanvaManagement />
      </main>
      </div>
    </>
  );
};

export default Index;
