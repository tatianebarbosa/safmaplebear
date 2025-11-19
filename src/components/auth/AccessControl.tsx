import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserCheck, Clock, Shield, AlertCircle } from "lucide-react";

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'coordinator' | 'consultant' | 'admin';
  status: 'pending' | 'approved' | 'rejected' | 'active';
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

const AccessControl = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isFirstAccess, setIsFirstAccess] = useState(true);
  const [requestData, setRequestData] = useState({
    name: '',
    email: '',
    role: '',
    justification: ''
  });

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = () => {
    // Simular verificação de usuário
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setIsFirstAccess(user.status === 'pending');
    }
  };

  const handleAccessRequest = () => {
    if (!requestData.name || !requestData.email || !requestData.role) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const newUser: User = {
      id: Date.now().toString(),
      name: requestData.name,
      email: requestData.email,
      role: requestData.role as 'coordinator' | 'consultant' | 'admin',
      status: 'pending',
      requestedAt: new Date().toISOString()
    };

    localStorage.setItem('currentUser', JSON.stringify(newUser));
    setCurrentUser(newUser);
    toast.success("Solicitação de acesso enviada! Aguarde a aprovação.");
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'coordinator': return 'Coordenadora';
      case 'consultant': return 'Consultor SAF';
      case 'admin': return 'Administrador';
      default: return role;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'approved':
        return <Badge variant="success"><UserCheck className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case 'active':
        return <Badge variant="success"><Shield className="w-3 h-3 mr-1" />Ativo</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (currentUser && currentUser.status === 'active') {
    return null; // Usuário aprovado, não mostrar este componente
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Controle de Acesso
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Sistema de gerenciamento Maple Bear
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {!currentUser ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={requestData.name}
                  onChange={(e) => setRequestData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Seu nome completo"
                />
              </div>

              <div>
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={requestData.email}
                  onChange={(e) => setRequestData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <Label htmlFor="role">Função *</Label>
                <select
                  id="role"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  value={requestData.role}
                  onChange={(e) => setRequestData(prev => ({ ...prev, role: e.target.value }))}
                >
                  <option value="">Selecione sua função</option>
                  <option value="coordinator">Coordenadora</option>
                  <option value="consultant">Consultor SAF</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div>
                <Label htmlFor="justification">
                  Referencia (Titulo do e-mail ou numero do ticket)
                </Label>
                <Textarea
                  id="justification"
                  value={requestData.justification}
                  onChange={(e) => setRequestData(prev => ({ ...prev, justification: e.target.value }))}
                  placeholder="Titulo do e-mail ou numero do ticket que motiva a solicitacao"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use exatamente o assunto do e-mail recebido ou o ID do ticket para justificar o pedido.
                </p>
              </div>

              <Button onClick={handleAccessRequest} className="w-full">
                Solicitar Acesso
              </Button>
            </div>
          ) : (
            <div className="space-y-4 text-center">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold">{currentUser.name}</h3>
                <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                <p className="text-sm">{getRoleName(currentUser.role)}</p>
              </div>

              <div className="flex justify-center">
                {getStatusBadge(currentUser.status)}
              </div>

              {currentUser.status === 'pending' && (
                <div className="p-4 bg-warning-bg rounded-lg">
                  <p className="text-sm text-warning-foreground">
                    Sua solicitação foi enviada e está aguardando aprovação da coordenação.
                    Você receberá uma notificação quando for aprovado.
                  </p>
                </div>
              )}

              {currentUser.status === 'rejected' && (
                <div className="space-y-3">
                  <div className="p-4 bg-destructive-bg rounded-lg">
                    <p className="text-sm text-destructive-foreground">
                      Sua solicitação foi rejeitada. Entre em contato com a coordenação para mais informações.
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      localStorage.removeItem('currentUser');
                      setCurrentUser(null);
                    }}
                  >
                    Nova Solicitação
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessControl;
