import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CanvaInvoice, CostAnalytics, BudgetAlert } from '@/types/invoicing';

interface InvoiceState {
  invoices: CanvaInvoice[];
  annualBudget: number;
  
  // Actions
  addInvoice: (invoice: Omit<CanvaInvoice, 'id'>) => void;
  updateInvoice: (id: string, updates: Partial<CanvaInvoice>) => void;
  removeInvoice: (id: string) => void;
  setAnnualBudget: (budget: number) => void;
  
  // Analytics
  getCostAnalytics: (year?: number) => CostAnalytics;
  getBudgetAlerts: () => BudgetAlert[];
  getMonthlySpending: (year?: number) => Array<{ month: string; amount: number }>;
}

// Seed data baseado na fatura fornecida
const seedInvoices: CanvaInvoice[] = [
  {
    id: '1',
    invoiceNumber: '03398-32532777',
    date: '2022-04-22',
    amount: 289.90,
    currency: 'BRL',
    description: 'Canva Pro',
    team: 'Maple Bear | Comunicação',
    email: 'comunicacao@maplebear.com.br',
    status: 'paid',
    period: {
      start: '2022-04-22',
      end: '2022-05-22'
    }
  },
  // Adicionar mais faturas para simular o gasto de R$ 815 em 2024
  {
    id: '2',
    invoiceNumber: '04521-33445566',
    date: '2024-01-15',
    amount: 289.90,
    currency: 'BRL',
    description: 'Canva Pro - Equipe Marketing',
    team: 'Marketing',
    email: 'marketing@maplebear.com.br',
    status: 'paid',
    period: {
      start: '2024-01-15',
      end: '2024-02-15'
    }
  },
  {
    id: '3',
    invoiceNumber: '04522-33445567',
    date: '2024-03-10',
    amount: 525.10,
    currency: 'BRL',
    description: 'Canva for Teams - Expansão',
    team: 'Educacional',
    email: 'educacional@maplebear.com.br',
    status: 'paid',
    period: {
      start: '2024-03-10',
      end: '2024-04-10'
    }
  }
];

export const useInvoiceStore = create<InvoiceState>()(
  persist(
    (set, get) => ({
      invoices: seedInvoices,
      annualBudget: 10000, // R$ 10.000 de orçamento anual

      addInvoice: (invoice) => set(state => ({
        invoices: [...state.invoices, { ...invoice, id: Date.now().toString() }]
      })),

      updateInvoice: (id, updates) => set(state => ({
        invoices: state.invoices.map(invoice => 
          invoice.id === id ? { ...invoice, ...updates } : invoice
        )
      })),

      removeInvoice: (id) => set(state => ({
        invoices: state.invoices.filter(invoice => invoice.id !== id)
      })),

      setAnnualBudget: (budget) => set({ annualBudget: budget }),

      getCostAnalytics: (year = new Date().getFullYear()) => {
        const { invoices } = get();
        const yearInvoices = invoices.filter(inv => 
          new Date(inv.date).getFullYear() === year && inv.status === 'paid'
        );

        const totalYearCost = yearInvoices.reduce((sum, inv) => sum + inv.amount, 0);
        const averageMonthly = totalYearCost / 12;
        const totalInvoices = yearInvoices.length;
        
        // Calcular custo por licença (assumindo dados do sistema de licenças)
        const estimatedLicenses = 50; // Seria obtido do store de licenças
        const costPerLicense = totalYearCost / estimatedLicenses;

        // Tendência mensal
        const monthlyData: { [key: string]: number } = {};
        yearInvoices.forEach(inv => {
          const month = new Date(inv.date).toLocaleDateString('pt-BR', { 
            month: 'short', 
            year: '2-digit' 
          });
          monthlyData[month] = (monthlyData[month] || 0) + inv.amount;
        });

        const costTrend = Object.entries(monthlyData).map(([month, amount]) => ({
          month,
          amount
        }));

        // Breakdown por equipe
        const teamData: { [key: string]: number } = {};
        yearInvoices.forEach(inv => {
          const team = inv.team || 'Sem equipe';
          teamData[team] = (teamData[team] || 0) + inv.amount;
        });

        const teamBreakdown = Object.entries(teamData).map(([team, amount]) => ({
          team,
          amount,
          percentage: (amount / totalYearCost) * 100
        }));

        return {
          totalYearCost,
          averageMonthly,
          totalInvoices,
          costPerLicense,
          costTrend,
          teamBreakdown
        };
      },

      getBudgetAlerts: () => {
        const { invoices, annualBudget } = get();
        const currentYear = new Date().getFullYear();
        const yearSpending = invoices
          .filter(inv => new Date(inv.date).getFullYear() === currentYear && inv.status === 'paid')
          .reduce((sum, inv) => sum + inv.amount, 0);

        const alerts: BudgetAlert[] = [];

        // Alerta de orçamento ultrapassado
        if (yearSpending > annualBudget) {
          alerts.push({
            id: 'over_budget',
            type: 'over_budget',
            message: `Orçamento anual ultrapassado em R$ ${(yearSpending - annualBudget).toFixed(2)}`,
            severity: 'high',
            amount: yearSpending,
            threshold: annualBudget
          });
        }
        // Alerta de aproximação do limite
        else if (yearSpending > annualBudget * 0.8) {
          alerts.push({
            id: 'approaching_limit',
            type: 'approaching_limit',
            message: `Usando ${((yearSpending / annualBudget) * 100).toFixed(1)}% do orçamento anual`,
            severity: 'medium',
            amount: yearSpending,
            threshold: annualBudget
          });
        }

        return alerts;
      },

      getMonthlySpending: (year = new Date().getFullYear()) => {
        const { invoices } = get();
        const yearInvoices = invoices.filter(inv => 
          new Date(inv.date).getFullYear() === year && inv.status === 'paid'
        );

        const monthlyData: { [key: string]: number } = {};
        yearInvoices.forEach(inv => {
          const month = new Date(inv.date).toLocaleDateString('pt-BR', { 
            month: 'long' 
          });
          monthlyData[month] = (monthlyData[month] || 0) + inv.amount;
        });

        return Object.entries(monthlyData).map(([month, amount]) => ({
          month,
          amount
        }));
      },
    }),
    {
      name: 'invoice-storage',
    }
  )
);