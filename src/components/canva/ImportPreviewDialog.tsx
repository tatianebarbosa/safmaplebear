import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Upload } from 'lucide-react';
import { useSchoolLicenseStore } from '@/stores/schoolLicenseStore';
import { dialogLayouts } from './dialogLayouts';

interface ImportPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: Array<{
    schoolId: string;
    name: string;
    email: string;
    role: string;
  }>;
  onConfirm: (data: any[]) => void;
}

export const ImportPreviewDialog = ({ 
  open, 
  onOpenChange, 
  data, 
  onConfirm 
}: ImportPreviewDialogProps) => {
  const { schools, isEmailValid } = useSchoolLicenseStore();

  // Process import data
  const processedData = data.map(item => {
    const school = schools.find(s => s.id === item.schoolId || s.name.includes(item.schoolId));
    const compliant = isEmailValid(item.email);
    const validRole = ['Estudante', 'Professor', 'Administrador'].includes(item.role);
    
    return {
      ...item,
      schoolFound: !!school,
      schoolName: school?.name || 'Escola no encontrada',
      isCompliant: compliant,
      validRole,
      valid: !!school && compliant && validRole && item.name && item.email,
    };
  });

  const validItems = processedData.filter(item => item.valid);
  const invalidItems = processedData.filter(item => !item.valid);
  const schoolCounts = processedData.reduce((acc, item) => {
    if (item.schoolFound) {
      acc[item.schoolName] = (acc[item.schoolName] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${dialogLayouts.md} flex flex-col`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Prvia da Importao
          </DialogTitle>
          <DialogDescription>
            Verifique os dados antes de confirmar a importao
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.length}</div>
                <div className="text-xs text-muted-foreground">registros</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-green-600">Vlidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{validItems.length}</div>
                <div className="text-xs text-muted-foreground">sero importados</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-destructive">Invlidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{invalidItems.length}</div>
                <div className="text-xs text-muted-foreground">sero ignorados</div>
              </CardContent>
            </Card>
          </div>

          {/* Schools Distribution */}
          {Object.keys(schoolCounts).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Distribuio por Escola</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(schoolCounts).map(([schoolName, count]) => (
                    <div key={schoolName} className="flex justify-between items-center">
                      <span className="text-sm">{schoolName}</span>
                      <Badge variant="outline">{count} usu?rios</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview Data */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Prvia dos Dados</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {processedData.map((item, index) => (
                    <div
                      key={index}
                      className={`p-3 border rounded-lg ${
                        item.valid ? 'border-success/20 bg-success/5' : 'border-destructive/20 bg-destructive/5'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            {item.valid ? (
                              <CheckCircle className="h-4 w-4 text-success" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                            )}
                            <span className="font-medium text-sm">{item.name}</span>
                            <Badge variant={item.validRole ? "success" : "destructive"} className="text-xs">
                              {item.role}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.email}
                          </div>
                          <div className="text-xs">
                            <span className={item.schoolFound ? 'text-success' : 'text-destructive'}>
                              {item.schoolName}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          {!item.schoolFound && (
                            <Badge variant="destructive" className="text-xs">
                              Escola no encontrada
                            </Badge>
                          )}
                          {!item.isCompliant && (
                            <Badge variant="destructive" className="text-xs">
                              E-mail fora da pol?tica
                            </Badge>
                          )}
                          {!item.validRole && (
                            <Badge variant="destructive" className="text-xs">
                              Funo invlida
                            </Badge>
                          )}
                          {(!item.name || !item.email) && (
                            <Badge variant="destructive" className="text-xs">
                              Dados incompletos
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Warnings */}
          {invalidItems.length > 0 && (
            <Card className="border-warning/20 bg-warning/5">
              <CardHeader>
                <CardTitle className="text-sm text-warning-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Ateno
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-warning-foreground">
                  {invalidItems.length} registro(s) contm(tm) erros e no ser(o) importado(s). 
                  Apenas {validItems.length} registro(s) vlido(s) ser(o) processado(s).
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={() => onConfirm(validItems)}
            disabled={validItems.length === 0}
          >
            Confirmar Importao ({validItems.length} registros)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
