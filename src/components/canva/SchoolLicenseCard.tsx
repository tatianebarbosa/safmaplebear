import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, AlertTriangle, Paperclip, Settings, Plus } from 'lucide-react';
import { School, type LicenseStatus } from '@/types/schoolLicense';
import { SchoolDetailsDialog } from './SchoolDetailsDialog';
import { useSchoolLicenseStore } from '@/stores/schoolLicenseStore';
import { getNonComplianceReason } from '@/lib/validators';
import { UserDialog } from './UserDialog';
import { useAuthStore } from '@/stores/authStore';
import { toast } from "@/components/ui/sonner";
import { showCanvaSyncReminder } from '@/lib/canvaReminder';

interface SchoolLicenseCardProps {
  school: School;
  onViewDetails: (school: School) => void;
  onManage: (school: School) => void;
}

export const SchoolLicenseCard = ({ school, onViewDetails, onManage }: SchoolLicenseCardProps) => {
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const { getLicenseStatus, addUser } = useSchoolLicenseStore();
  const currentUser = useAuthStore((s) => s.currentUser);

  const licenseStatus = getLicenseStatus(school) as LicenseStatus;
  const isCentral =
    school.id === '0' ||
    (school.name || '').toLowerCase().includes('central');
  const isNoSchool =
    school.id === 'no-school' ||
    (school.name || '').toLowerCase().includes('sem escola');
  const utilizationPercent =
    isCentral || isNoSchool
      ? 0
      : Math.min(100, (school.usedLicenses / school.totalLicenses) * 100);
  const nonCompliantUsers = school.users.filter((u) => !u.isCompliant);
  const availableLicenses = isCentral
    ? Number.POSITIVE_INFINITY
    : Math.max(0, school.totalLicenses - school.usedLicenses);
  const actorName =
    currentUser?.email ||
    currentUser?.name ||
    localStorage.getItem('userEmail') ||
    'Portal SAF';
  const getProgressColor = () => {
    if (school.usedLicenses > school.totalLicenses) return 'bg-destructive';
    if (school.usedLicenses === school.totalLicenses) return 'bg-warning';
    return 'bg-success';
  };

  const handleManageSchool = () => {
    onViewDetails(school);
    onManage(school);
    setShowDetailsDialog(true);
  };

  const handleAddNewUser = (payload: any) => {
    if (!school || !('user' in payload)) return;

    const newUserId = addUser(school.id, payload.user, {
      ...payload.meta,
      performedBy: actorName,
    });

    if (!newUserId) {
      toast.error('Não foi possível adicionar a licença. Tente novamente.');
      return;
    }

    toast.success(`${payload.user.name} adicionado(a) com licença desta escola.`);
    showCanvaSyncReminder();
    setShowAddUserDialog(false);
  };

  return (
    <>
      {/* Borda igual ao container de Filtros (Card padrao = rounded-lg) */}
      <Card className="w-full rounded-xl overflow-hidden shadow border border-border/30 h-full min-h-[400px] flex flex-col bg-white">
        <CardHeader className="px-4 pt-4 pb-2 space-y-2 border-b border-border/50 bg-gradient-to-br from-white via-white to-slate-50/80">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-lg font-black leading-snug text-slate-900 break-words max-w-full">
              {school.name}
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-3 flex-1 pt-3 pb-4 px-4">
          <div className="space-y-2 rounded-xl border border-border/60 bg-white/90 p-3 shadow-sm ring-1 ring-border/30 min-h-[96px]">
            {isCentral ? (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-slate-900 leading-none">
                    {school.users.length} usuários
                  </span>
                  <Badge variant="outline" size="sm" className="text-[10px]">
                    Licenças ilimitadas
                  </Badge>
                </div>
              </div>
            ) : (
              <>
                {isNoSchool ? (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-slate-900 leading-none">
                        {school.totalLicenses || school.usedLicenses} Licenças
                      </span>
                      {licenseStatus === 'Excedido' && (
                        <Badge variant="destructive" size="sm" className="!text-[9px] !px-2 !py-1 leading-none rounded-full">
                          Excesso
                        </Badge>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-900 leading-none">
                          {school.usedLicenses}/{school.totalLicenses} Licenças
                        </span>
                        {licenseStatus === 'Excedido' && (
                          <Badge variant="destructive" size="sm" className="!text-[9px] !px-2 !py-1 leading-none rounded-full">
                            Excesso
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-slate-700 font-bold leading-none px-2 py-1 rounded-full bg-muted/60">
                        {utilizationPercent.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted/60 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${getProgressColor()}`}
                        style={{ width: `${Math.min(100, utilizationPercent)}%` }}
                      />
                    </div>
                  </>
                )}
              </>
            )}
            {school.hasRecentJustifications && (
              <div className="flex items-center gap-1 text-[7px] text-muted-foreground max-w-full overflow-hidden">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-background border text-primary text-[9px] leading-none">
                  <Paperclip className="h-3 w-3" />
                  Referências
                </span>
              </div>
            )}
          </div>

          {/* Users List */}
          <div className="space-y-1.5 max-h-44 overflow-y-auto rounded-lg border border-border/30 bg-slate-50/80 px-3 py-2 flex-1 shadow-inner">
            {school.users.slice(0, 3).map((user) => (
              <button
                key={user.id}
                className="w-full text-left"
                onClick={handleManageSchool}
              >
                <div className="flex items-center justify-between gap-3 py-1.5 px-2.5 rounded-[14px] hover:bg-white/80 transition border border-transparent hover:border-border/50">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{user.name}</div>
                    <div className="text-xs text-muted-foreground truncate leading-snug">
                      {user.email}
                    </div>
                  </div>
                  {!user.isCompliant && (
                    <div className="flex items-center gap-2 shrink-0">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="w-2 h-2 bg-destructive rounded-full" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{getNonComplianceReason(user.email)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>
              </button>
            ))}
            {school.users.length > 3 && (
              <button
                className="w-full text-center text-xs text-primary hover:underline py-1"
                onClick={handleManageSchool}
              >
                +{school.users.length - 3} usuários adicionais
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col space-y-2 pt-1 mt-auto">
            <div className="grid grid-cols-1 gap-2">
              {(availableLicenses > 0 || isCentral) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddUserDialog(true)}
                  className="w-full justify-center rounded-full border-border/60 shadow-sm font-semibold text-foreground bg-muted hover:bg-muted/80"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar licen?a
                </Button>
              )}
              <Button
                size="sm"
                variant="default"
                onClick={handleManageSchool}
                className="w-full justify-center rounded-full border-border/60 shadow-sm font-semibold hover:border-foreground/40 hover:bg-foreground/5"
              >
                <Settings className="h-4 w-4 mr-2" />
                Gerenciar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog */}
      <SchoolDetailsDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        school={school}
      />
      <UserDialog
        open={showAddUserDialog}
        onOpenChange={setShowAddUserDialog}
        onSave={handleAddNewUser}
        title="Adicionar licen?a"
      />
    </>
  );
};
