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
