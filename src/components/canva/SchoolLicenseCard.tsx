import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, AlertTriangle, Paperclip, Settings } from 'lucide-react';
import { School, type LicenseStatus } from '@/types/schoolLicense';
import { SchoolDetailsDialog } from './SchoolDetailsDialog';
import { useSchoolLicenseStore } from '@/stores/schoolLicenseStore';
import { getNonComplianceReason } from '@/lib/validators';

interface SchoolLicenseCardProps {
  school: School;
  onViewDetails: (school: School) => void;
  onManage: (school: School) => void;
}

export const SchoolLicenseCard = ({ school, onViewDetails, onManage }: SchoolLicenseCardProps) => {
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const { getLicenseStatus } = useSchoolLicenseStore();

  const licenseStatus = getLicenseStatus(school) as LicenseStatus;
  const AVAILABLE_STATUS: LicenseStatus = 'Disponível';
  const utilizationPercent = Math.min(100, (school.usedLicenses / school.totalLicenses) * 100);
  const nonCompliantUsers = school.users.filter((u) => !u.isCompliant);


  const getLicensesBadgeColor = () => {
    switch (licenseStatus) {
      case AVAILABLE_STATUS:
        return 'bg-success-bg text-success border-success/20';
      case 'Completo':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Excedido':
        return 'bg-destructive-bg text-destructive border-destructive/20';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

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

  return (
    <>
      {/* Borda igual ao container de Filtros (Card padrão = rounded-lg) */}
      <Card className="w-full rounded-lg overflow-hidden shadow-lg border border-border/30 h-full min-h-[420px] flex flex-col bg-white pt-2">
        <CardHeader className="px-6 sm:px-7 pt-6 pb-2">
          <CardTitle className="text-lg font-bold leading-snug text-slate-900 break-words max-w-full">
            {school.name}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-3 flex-1 pt-1 pb-4">
          <div className="space-y-3 rounded-lg border border-border/40 bg-white/90 p-3 shadow-sm ring-1 ring-border/30">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getLicensesBadgeColor()}`}>
                  {school.usedLicenses}/{school.totalLicenses} Licenças
                </span>
                {licenseStatus === 'Excedido' && (
                  <Badge variant="destructive" size="sm">
                    Excesso
                  </Badge>
                )}
              </div>
              <span className="text-[11px] text-muted-foreground font-semibold">
                {utilizationPercent.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-muted/50 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${getProgressColor()}`}
                style={{ width: `${Math.min(100, utilizationPercent)}%` }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="bg-background">
                <Users className="h-3 w-3 mr-1" />
                {school.users.length} usuarios
              </Badge>
              {nonCompliantUsers.length > 0 && (
                <Badge variant="destructive" className="text-[11px]">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {nonCompliantUsers.length} fora da politica
                </Badge>
              )}
              {school.hasRecentJustifications && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-background border text-primary text-[11px]">
                  <Paperclip className="h-3 w-3" />
                  Referencias
                </span>
              )}
            </div>
          </div>

          {/* Users List */}
          <div className="space-y-1.5 max-h-40 overflow-y-auto rounded-lg border border-border/30 bg-slate-50/80 px-3 py-2 flex-1 shadow-inner">
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
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={user.isCompliant ? "muted" : "destructive"}
                      size="sm"
                      className="whitespace-nowrap"
                    >
                      {user.role}
                    </Badge>
                    {!user.isCompliant && (
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
                    )}
                  </div>
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
              <Button
                size="sm"
                variant="outline"
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
    </>
  );
};
