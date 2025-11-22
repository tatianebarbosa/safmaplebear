import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Mail,
  School,
  ShieldAlert,
  Search,
  Filter,
  Phone,
  FileText,
  Download,
  Send,
  Building2,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface NonCompliantUserDetail {
  id: string;
  name: string;
  email: string;
  role: string;
  schoolName: string;
  schoolId: string;
  domain: string;
}

interface NonCompliantUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: NonCompliantUserDetail[];
  onSelectUser?: (user: NonCompliantUserDetail) => void;
}

export const NonCompliantUsersDialog = ({
  open,
  onOpenChange,
  users,
  onSelectUser
}: NonCompliantUsersDialogProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [domainFilter, setDomainFilter] = useState<string | null>(null);
  const [contactMailbox, setContactMailbox] = useState('contato@outlook.com');
  const [schoolNotes, setSchoolNotes] = useState<Record<string, string>>({});
  const [activeSchoolId, setActiveSchoolId] = useState<string | null>(null);

  const domainStats = useMemo(() => {
    return users.reduce<Record<string, number>>((acc, user) => {
      if (!user.domain) return acc;
      acc[user.domain] = (acc[user.domain] || 0) + 1;
      return acc;
    }, {});
  }, [users]);

  const schoolsForOutreach = useMemo(() => {
    const grouped = users.reduce<Record<string, { schoolName: string; emails: string[]; domains: Record<string, number> }>>(
      (acc, user) => {
        if (!acc[user.schoolId]) {
          acc[user.schoolId] = { schoolName: user.schoolName, emails: [], domains: {} };
        }

        acc[user.schoolId].emails.push(user.email);

        if (user.domain) {
          acc[user.schoolId].domains[user.domain] = (acc[user.schoolId].domains[user.domain] || 0) + 1;
        }

        return acc;
      },
      {}
    );

    return Object.entries(grouped)
      .map(([schoolId, data]) => ({
        schoolId,
        schoolName: data.schoolName,
        emails: data.emails,
        domains: data.domains,
      }))
      .sort((a, b) => b.emails.length - a.emails.length);
  }, [users]);

  useEffect(() => {
    if (schoolsForOutreach.length === 0) {
      setActiveSchoolId(null);
      return;
    }

    if (!activeSchoolId || !schoolsForOutreach.some((school) => school.schoolId === activeSchoolId)) {
      setActiveSchoolId(schoolsForOutreach[0].schoolId);
    }
  }, [schoolsForOutreach, activeSchoolId]);

  const activeSchool = useMemo(() => {
    if (schoolsForOutreach.length === 0) return null;
    return schoolsForOutreach.find((school) => school.schoolId === activeSchoolId) ?? schoolsForOutreach[0];
  }, [activeSchoolId, schoolsForOutreach]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase().trim();
    return users.filter(user => {
      const matchesDomain = !domainFilter || user.domain === domainFilter;
      if (!matchesDomain) return false;

      if (!normalizedSearch) return true;
      return (
        user.name.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch) ||
        user.schoolName.toLowerCase().includes(normalizedSearch) ||
        user.role.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [users, searchTerm, domainFilter]);

  const impactedSchools = useMemo(() => {
    return new Set(users.map(user => user.schoolId)).size;
  }, [users]);

  const topDomains = useMemo(() => {
    return Object.entries(domainStats)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [domainStats]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setDomainFilter(null);
  };

  const handleCopyToClipboard = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(successMessage);
    } catch (error) {
      toast.error('Não foi possível copiar o conteúdo. Tente novamente.');
    }
  };

  const buildEmailBody = (schoolName: string, emails: string[], extraNote?: string) => {
    const base = `Olá, time ${schoolName}!

Identificamos ${emails.length} acesso(s) ao Canva com domínios fora da política.
Confirme se devemos manter, remover ou transferir essas licenças:

${emails.map(email => `- ${email}`).join('\n')}

Responda com uma das opções para cada email:
- Manter (confirmado pela escola)
- Remover (licença liberada)
- Transferir (informe o novo email institucional)`;

    if (!extraNote?.trim()) return base;

    return `${base}

Observações adicionais / email alternativo informado: ${extraNote.trim()}`;
  };

  const buildEmailTemplate = (schoolName: string, emails: string[]) => {
    return `Assunto: Ajuste de licenças Canva - ${schoolName}

${buildEmailBody(schoolName, emails)}`;
  };

  const buildMailtoLink = (schoolName: string, emails: string[], contact: string, note?: string) => {
    const subject = `Ajuste de licenças Canva - ${schoolName}`;
    const body = `${buildEmailBody(schoolName, emails, note)}

Obrigado!`;

    return `mailto:${encodeURIComponent(contact)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const buildCallScript = (schoolName: string, emails: string[]) => {
    return `Roteiro de ligação - ${schoolName}

1) Apresentação rápida e motivo do contato (ajuste de licenças Canva)
2) Há ${emails.length} email(s) fora da política ativa(s). Podemos revisar agora?
3) Liste os emails e peça a decisão:
${emails.map(email => `- ${email}: manter, remover ou transferir?`).join('\n')}
4) Confirme se precisa de novo email institucional para transferências.
5) Confirme responsável e prazo para retorno.`;
  };

  const handleDownloadCsv = () => {
    if (users.length === 0) return;

    const headers = ['Escola', 'Email', 'Perfil', 'Domínio'];
    const rows = users.map(user => [user.schoolName, user.email, user.role, user.domain]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(value => `"${value || ''}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'usuarios_nao_conformes.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Lista exportada para acompanhamento.');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[960px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            {activeSchool?.schoolName || 'Usuários sem escola'}
          </DialogTitle>
          <DialogDescription>Detalhes completos da escola e histórico de alterações</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 overflow-y-auto pr-1">
            <Card className="border-muted">
              <CardHeader className="flex flex-row items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    Informações da Escola
                  </div>
                  <CardTitle className="text-lg font-semibold">{activeSchool?.schoolName || 'Usuários sem escola'}</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default">Ativa</Badge>
                    <Badge variant="outline">Outros</Badge>
                  </div>
                </div>
                {schoolsForOutreach.length > 1 && (
                  <div className="w-48">
                    <p className="text-xs text-muted-foreground mb-1">Trocar escola</p>
                    <Select
                      value={activeSchool?.schoolId}
                      onValueChange={(value) => setActiveSchoolId(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a escola" />
                      </SelectTrigger>
                      <SelectContent>
                        {schoolsForOutreach.map((school) => (
                          <SelectItem key={school.schoolId} value={school.schoolId}>
                            {school.schoolName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border bg-muted/50 p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Licenças</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-semibold">
                        {activeSchool?.emails.length ?? users.length}
                      </p>
                      <Badge variant="secondary">Em revisão</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Licenças já emitidas para o Canva</p>
                  </div>

                  <div className="rounded-lg border bg-card/70 p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Não Conformes</p>
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                      <p className="text-2xl font-semibold">{activeSchool?.emails.length ?? users.length}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Emails que precisam de decisão da escola</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border bg-card/70 p-3 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Total de Usuários</p>
                <p className="text-3xl font-semibold text-destructive">{users.length}</p>
              </div>
              <div className="rounded-lg border bg-card/70 p-3 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Escolas Impactadas</p>
                <p className="text-3xl font-semibold">{impactedSchools}</p>
              </div>
              <div className="rounded-lg border bg-card/70 p-3 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Domínios Diferentes</p>
                <p className="text-3xl font-semibold">{Object.keys(domainStats).length}</p>
              </div>
            </div>

            <div className="rounded-lg border bg-muted/40 p-4 shadow-sm space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">Ações rápidas para contato</p>
                  <p className="text-xs text-muted-foreground">
                    Use os roteiros abaixo para ligar ou enviar email confirmando se as licenças devem ser mantidas, removidas ou transferidas.
                  </p>
                </div>
                <div className="flex flex-col gap-1 text-right">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="contact-mailbox">
                    Conta Outlook para disparo
                  </label>
                  <Input
                    id="contact-mailbox"
                    value={contactMailbox}
                    onChange={(event) => setContactMailbox(event.target.value)}
                    className="sm:w-64"
                    placeholder="conta@outlook.com"
                    type="email"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={handleDownloadCsv}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar CSV
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {schoolsForOutreach.map((school) => (
                  <div key={school.schoolId} className="rounded-md border bg-card/70 p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{school.schoolName}</p>
                        <p className="text-xs text-muted-foreground">{school.emails.length} email(s) a revisar</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(school.domains)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 2)
                          .map(([domain, count]) => (
                            <Badge key={domain} variant="outline" className="text-xs">
                              {domain} ({count})
                            </Badge>
                          ))}
                      </div>
                    </div>
                    <Textarea
                      placeholder="Observações ou email alternativo da escola"
                      value={schoolNotes[school.schoolId] || ''}
                      onChange={(event) =>
                        setSchoolNotes((prev) => ({ ...prev, [school.schoolId]: event.target.value }))
                      }
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          handleCopyToClipboard(
                            buildCallScript(school.schoolName, school.emails),
                            'Roteiro de ligação copiado'
                          )
                        }
                      >
                        <Phone className="mr-2 h-4 w-4" />
                        Copiar roteiro de ligação
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleCopyToClipboard(
                            buildEmailTemplate(school.schoolName, school.emails),
                            'Modelo de email copiado'
                          )
                        }
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Copiar email pronto
                      </Button>
                      <Button variant="default" size="sm" asChild>
                        <a
                          href={buildMailtoLink(
                            school.schoolName,
                            school.emails,
                            contactMailbox,
                            schoolNotes[school.schoolId]
                          )}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Abrir no Outlook
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}

                {schoolsForOutreach.length === 0 && (
                  <div className="text-sm text-muted-foreground">Nenhuma escola com emails fora da política.</div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4 overflow-y-auto pr-1">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Search className="h-4 w-4" />
                  <span>Buscar por nome, email, escola ou perfil</span>
                </div>
                <Input
                  placeholder="Digite para filtrar rapidamente"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>

              <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Filter className="h-4 w-4" />
                  <span>Filtrar por domínio</span>
                  {(searchTerm || domainFilter) && (
                    <Button size="sm" variant="ghost" onClick={handleClearFilters}>
                      Limpar
                    </Button>
                  )}
                </div>
                <div className="flex max-h-24 flex-wrap gap-2 overflow-y-auto pr-1">
                  {topDomains.length === 0 && (
                    <span className="text-xs text-muted-foreground">Nenhum domínio encontrado</span>
                  )}
                  {topDomains.map((domain) => (
                    <Button
                      key={domain.domain}
                      size="sm"
                      className="rounded-full"
                      variant={domainFilter === domain.domain ? 'destructive' : 'outline'}
                      onClick={() =>
                        setDomainFilter((current) => (current === domain.domain ? null : domain.domain))
                      }
                    >
                      {domain.domain} ({domain.count})
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="hidden rounded-t-lg bg-muted/30 px-4 py-2 text-xs font-medium uppercase text-muted-foreground md:grid md:grid-cols-[minmax(180px,2fr)_120px_minmax(180px,2fr)_150px]">
              <span>Usuário</span>
              <span>Perfil</span>
              <span>Escola</span>
              <span>Domínio</span>
            </div>

            <ScrollArea className="h-[320px] rounded-b-lg border">
              {filteredUsers.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Nenhum usuário corresponde aos filtros atuais.
                </div>
              ) : (
                <div className="divide-y">
                  {filteredUsers.map((user) => (
                    <button
                      key={`${user.id}-${user.email}`}
                      className="grid w-full gap-3 px-4 py-3 text-left text-sm transition hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:grid-cols-[minmax(180px,2fr)_120px_minmax(180px,2fr)_150px]"
                      onClick={() => onSelectUser?.(user)}
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{user.name}</p>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          <span>{user.email}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium">Perfil</p>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline">{user.role}</Badge>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium">Escola</p>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <School className="h-3.5 w-3.5" />
                          <span>{user.schoolName}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium">Domínio</p>
                        <Badge variant="destructive">{user.domain || 'Indefinido'}</Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className="overflow-y-auto pr-1">
            <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
              Nenhum histórico disponível para estes usuários no momento. Use as ações de contato para registrar decisões das escolas.
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
