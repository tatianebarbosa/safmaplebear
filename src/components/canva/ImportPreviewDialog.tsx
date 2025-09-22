import React from 'react';
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
      schoolName: school?.name || 'Escola não encontrada',
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
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Prévia da Importação
          </DialogTitle>
          <DialogDescription>
            Verifique os dados antes de confirmar a importação
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
                <CardTitle className="text-sm text-green-600">Válidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{validItems.length}</div>
                <div className="text-xs text-muted-foreground">serão importados</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-red-600">Inválidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{invalidItems.length}</div>
                <div className="text-xs text-muted-foreground">serão ignorados</div>
              </CardContent>
            </Card>
          </div>

          {/* Schools Distribution */}
          {Object.keys(schoolCounts).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Distribuição por Escola</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(schoolCounts).map(([schoolName, count]) => (
                    <div key={schoolName} className="flex justify-between items-center">
                      <span className="text-sm">{schoolName}</span>
                      <Badge variant="outline">{count} usuários</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview Data */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Prévia dos Dados</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {processedData.map((item, index) => (
                    <div
                      key={index}
                      className={`p-3 border rounded-lg ${
                        item.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            {item.valid ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                            )}
                            <span className="font-medium text-sm">{item.name}</span>
                            <Badge variant={item.validRole ? "default" : "destructive"} className="text-xs">
                              {item.role}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.email}
                          </div>
                          <div className="text-xs">
                            <span className={item.schoolFound ? 'text-green-600' : 'text-red-600'}>
                              {item.schoolName}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          {!item.schoolFound && (
                            <Badge variant="destructive" className="text-xs">
                              Escola não encontrada
                            </Badge>
                          )}
                          {!item.isCompliant && (
                            <Badge variant="destructive" className="text-xs">
                              E-mail fora da política
                            </Badge>
                          )}
                          {!item.validRole && (
                            <Badge variant="destructive" className="text-xs">
                              Função inválida
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
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-sm text-yellow-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Atenção
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-yellow-800">
                  {invalidItems.length} registro(s) contém(têm) erros e não será(ão) importado(s). 
                  Apenas {validItems.length} registro(s) válido(s) será(ão) processado(s).
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
            Confirmar Importação ({validItems.length} registros)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};