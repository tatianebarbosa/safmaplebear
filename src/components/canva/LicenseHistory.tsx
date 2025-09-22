import React, { useState, useEffect } from 'react';
import { History, Filter, Download, Calendar, School, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getLicenseHistory, filterLicenseHistory } from '@/lib/canvaDataProcessor';

interface LicenseHistoryProps {
  schoolsData: any[];
}

export const LicenseHistory = ({ schoolsData }: LicenseHistoryProps) => {
  const [history, setHistory] = useState<any[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<any[]>([]);
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [history, schoolFilter, actionFilter, dateRange]);

  const loadHistory = () => {
    const allHistory = getLicenseHistory();
    setHistory(allHistory);
  };

  const applyFilters = () => {
    let filtered = [...history];

    if (schoolFilter !== 'all') {
      filtered = filtered.filter(h => h.schoolId === schoolFilter);
    }

    if (actionFilter !== 'all') {
      filtered = filtered.filter(h => h.action === actionFilter);
    }

    if (dateRange.start && dateRange.end) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      filtered = filtered.filter(h => {
        const actionDate = new Date(h.timestamp);
        return actionDate >= startDate && actionDate <= endDate;
      });
    }

    setFilteredHistory(filtered);
  };

  const getActionLabel = (action: string) => {
    const labels = {
      add: 'Licença Adicionada',
      remove: 'Licença Removida',
      transfer: 'Usuário Transferido',
      delete: 'Usuário Excluído'
    };
    return labels[action as keyof typeof labels] || action;
  };

  const getActionVariant = (action: string) => {
    const variants = {
      add: 'default',
      remove: 'secondary',
      transfer: 'outline',
      delete: 'destructive'
    };
    return variants[action as keyof typeof variants] || 'outline';
  };

  const exportHistory = () => {
    const headers = [
      'Data/Hora', 'Escola', 'Ação', 'Usuário', 'Email', 'Escola Destino', 'Justificativa', 'Executado por'
    ];

    const rows = filteredHistory.map(action => [
      new Date(action.timestamp).toLocaleString('pt-BR'),
      action.schoolName,
      getActionLabel(action.action),
      action.userName || '-',
      action.userEmail || '-',
      action.targetSchoolName || '-',
      action.justification,
      action.performedBy
    ]);

    const csvContent = [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historico-licencas-canva-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Escola</label>
              <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as escolas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as escolas</SelectItem>
                  {schoolsData.map((school) => (
                    <SelectItem key={school.schoolId} value={school.schoolId}>
                      {school.schoolName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Ação</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as ações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as ações</SelectItem>
                  <SelectItem value="add">Licença Adicionada</SelectItem>
                  <SelectItem value="remove">Licença Removida</SelectItem>
                  <SelectItem value="transfer">Usuário Transferido</SelectItem>
                  <SelectItem value="delete">Usuário Excluído</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Data Início</label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Data Fim</label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => {
              setSchoolFilter('all');
              setActionFilter('all');
              setDateRange({ start: '', end: '' });
            }}>
              Limpar Filtros
            </Button>
            <Button variant="outline" onClick={exportHistory}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Ações ({filteredHistory.length})
          </CardTitle>
          <CardDescription>
            Registro de todas as alterações realizadas no sistema de licenças Canva
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredHistory.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum histórico encontrado com os filtros aplicados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Escola</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Justificativa</TableHead>
                    <TableHead>Executado por</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.map((action) => (
                    <TableRow key={action.id}>
                      <TableCell className="font-mono text-xs">
                        {new Date(action.timestamp).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <School className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate max-w-[150px]">{action.schoolName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionVariant(action.action) as any}>
                          {getActionLabel(action.action)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {action.userName && (
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <div>
                              <div className="font-medium text-xs">{action.userName}</div>
                              <div className="text-xs text-muted-foreground">{action.userEmail}</div>
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {action.targetSchoolName && (
                          <span className="text-xs">{action.targetSchoolName}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs truncate max-w-[200px] block" title={action.justification}>
                          {action.justification}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">
                        {action.performedBy}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};