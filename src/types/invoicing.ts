export interface CanvaInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  currency: string;
  description: string;
  team?: string;
  email?: string;
  status: 'paid' | 'pending' | 'overdue';
  period: {
    start: string;
    end: string;
  };
}

export interface CostAnalytics {
  totalYearCost: number;
  averageMonthly: number;
  totalInvoices: number;
  costPerLicense: number;
  costTrend: Array<{
    month: string;
    amount: number;
  }>;
  teamBreakdown: Array<{
    team: string;
    amount: number;
    percentage: number;
  }>;
}

export interface BudgetAlert {
  id: string;
  type: 'over_budget' | 'approaching_limit' | 'unusual_spending';
  message: string;
  severity: 'low' | 'medium' | 'high';
  amount?: number;
  threshold?: number;
}