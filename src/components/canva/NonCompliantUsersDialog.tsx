import { useMemo, useState } from 'react';
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
import { Mail, School, ShieldAlert, Search, Filter } from 'lucide-react';
import { useSchoolLicenseStore } from '@/stores/schoolLicenseStore';
import { getMaxLicensesPerSchool } from '@/config/licenseLimits';

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
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const schools = useSchoolLicenseStore((state) => state.schools);

  const domainStats = useMemo(() => {
    return users.reduce<Record<string, number>>((acc, user) => {
      if (!user.domain) return acc;
      acc[user.domain] = (acc[user.domain] || 0) + 1;
      return acc;
    }, {});
  }, [users]);

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

  const schoolEmailMap = useMemo(() => {
    const map: Record<string, string | undefined> = {};
    schools.forEach((s) => {
      map[s.id] = s.contactEmail;
    });
    return map;
  }, [schools]);

  const schoolsSummary = useMemo(() => {
    return users.reduce<Record<string, { id: string; name: string; users: NonCompliantUserDetail[]; contactEmail?: string }>>(
      (acc, user) => {
        const key = user.schoolId || 'sem-escola';
        if (!acc[key]) {
          acc[key] = {
            id: key,
            name: user.schoolName || 'Usuários sem escola',
            users: [],
            contactEmail: schoolEmailMap[key],
          };
        }
        acc[key].users.push(user);
        return acc;
      },
      {}
    );
  }, [users, schoolEmailMap]);

  const impactedSchools = useMemo(() => {
    return Object.keys(schoolsSummary).length;
  }, [schoolsSummary]);

  const schoolOptions = useMemo(() => Object.values(schoolsSummary), [schoolsSummary]);

  const selectedSchool = useMemo(() => {
    if (!selectedSchoolId && schoolOptions.length) {
      return schoolOptions[0];
    }
    return schoolOptions.find((s) => s.id === selectedSchoolId) || schoolOptions[0];
  }, [selectedSchoolId, schoolOptions]);

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
  const buildEmailLink = () => {
    if (!selectedSchool) return '#';
    const to = selectedSchool.contactEmail || selectedSchool.users[0]?.email || '';
    const subject = `Regulariza\u00e7\u00e3o de licen\u00e7as - ${selectedSchool.name}`;
    const licenseLimit = getMaxLicensesPerSchool();
    const hasMultipleUsers = selectedSchool.users.length > 1;
    const accessIntro = hasMultipleUsers
      ? 'Atualmente, identificamos os seguintes acessos ativos:'
      : 'Atualmente, identificamos o seguinte acesso ativo:';
    const activeUserLines =
      selectedSchool.users.length > 0
        ? selectedSchool.users.map((u) => `- ${u.email}`)
        : ['- Nenhum usu\u00e1rio listado'];

    const bodyLines = [
      `Prezada equipe da ${selectedSchool.name},`,
      '',
      'Durante a auditoria peri\u00f3dica de acessos realizada pela Maple Bear Central, identificamos que a unidade encontra-se acima do limite permitido de licen\u00e7as do Canva Pro, utilizadas para acesso \u00e0 plataforma oficial de marketing:',
      '',
      '\ud83d\udd17 https://plataformademarketing.maplebear.com.br/',
      '',
      '(incluindo o banco oficial de imagens, templates e materiais institucionais)',
      '',
      'Refor\u00e7amos que o limite de licen\u00e7as \u00e9 uma diretriz corporativa aplic\u00e1vel a todas as escolas da rede, estabelecida pela Maple Bear Central para garantir padroniza\u00e7\u00e3o, seguran\u00e7a e conformidade no uso das ferramentas institucionais.',
      '',
      `Para esta unidade, o limite \u00e9 de ${licenseLimit} licen\u00e7as ativas.`,
      '',
      accessIntro,
      '',
      ...activeUserLines,
      '',
      'Para prosseguirmos com a regulariza\u00e7\u00e3o, solicitamos que a unidade nos informe:',
      '',
      `- Quais usu\u00e1rios devem permanecer com acesso ao Canva Pro (at\u00e9 o limite de ${licenseLimit} licen\u00e7as);`,
      '- Quais usu\u00e1rios devem ser removidos ou substitu\u00eddos;',
      '- O e-mail institucional oficial da unidade, para atualiza\u00e7\u00e3o dos registros e adequado direcionamento das comunica\u00e7\u00f5es.',
      '',
      'Aguardamos o retorno para concluirmos o ajuste conforme as normas estabelecidas pela Maple Bear Central.',
      '',
      'Atenciosamente,',
      'Equipe Maple Bear Central',
    ];
    const body = encodeURIComponent(bodyLines.join('\n'));
    return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${body}`;
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[960px] max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            Usuários Não Conformes
          </DialogTitle>
          <DialogDescription>
            Lista detalhada dos usuários com domínios fora da política corporativa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto pr-1">
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

          <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="space-y-1">
                <p className="text-sm font-semibold">Contato ativo com escolas</p>
                <p className="text-xs text-muted-foreground">
                  Envie um e-mail pedindo ajuste para manter apenas 2 licenças.
                </p>
              </div>
              {schoolOptions.length > 0 && (
                <select
                  className="border rounded-md px-2 py-1 text-sm"
                  value={selectedSchool?.id || ''}
                  onChange={(e) => setSelectedSchoolId(e.target.value)}
                >
                  {schoolOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.users.length})
                    </option>
                  ))}
                </select>
              )}
            </div>
            {selectedSchool ? (
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>Usuários envolvidos:</span>
                {selectedSchool.users.map((u) => (
                  <Badge key={u.email} variant="outline" className="bg-background">
                    {u.email}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Nenhuma escola com usuários listados.</p>
            )}
            <div className="flex justify-end">
              <Button
                size="sm"
                disabled={!selectedSchool}
                onClick={() => window.open(buildEmailLink(), '_blank')}
              >
                Disparar e-mail para a escola
              </Button>
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
