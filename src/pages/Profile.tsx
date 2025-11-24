import ProfileManagement from "@/components/auth/ProfileManagement";

const ProfilePage = () => {
  return (
    <div className="layout-wide py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Perfil</h1>
        <p className="text-muted-foreground">Gerencie seus dados e permissões.</p>
      </div>
      <ProfileManagement />
    </div>
  );
};

export default ProfilePage;
