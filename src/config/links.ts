// src/config/links.ts

interface LinkItem {
  label: string;
  href: string;
}

export const SPREADSHEET_LINKS: LinkItem[] = [
  { label: "N2 Digital", href: "https://app.clickup.com/31013946/v/fm/xjf1u-92033" },
  { label: "Reembolsos 2024/2025", href: "https://sistemaseb.sharepoint.com/teams/MAPLEBEAR-PLANEJAMENTOFINANCEIRO/_layouts/15/doc2.aspx?sourcedoc=%7BF1CF36E3-2BDB-4B0D-A84C-324E2D3348FC%7D&file=REEMBOLSOS%202024_2025.xlsx&action=default&mobileredirect=true" },
  { label: "N2 Martech", href: "https://forms.clickup.com/31013946/f/xjf1u-144533/4KQQDYMO5O52A0ML3X" },
  { label: "Erratas Academico", href: "https://forms.clickup.com/31013946/f/xjf1u-84573/A02DYSNI2OQP8XBAKX" },
  { label: "Voucher Campanha 2026", href: "https://sistemaseb-my.sharepoint.com/:x:/r/personal/anapa_andrade_sebsa_com_br/_layouts/15/doc2.aspx?sourcedoc=%7B8D8F5BAE-4DC5-479C-BFA3-72FFCA05C59B%7D&file=Voucher%20de%20Campanha%202026.xlsx&action=default&mobileredirect=true&DefaultItemOpen=1" },
];

export const CRM_LINKS: LinkItem[] = [
  { label: "Resetar senha CRM", href: "https://passwordreset.microsoftonline.com/" },
  { label: "Alterar senha CRM (TOPdesk)", href: "https://sebsa.topdesk.net/tas/public/ssp/content/serviceflow?unid=c6ad3cbd8a2c4608ad4df32d1711f986" },
  { label: "Alterar autenticador CRM (TOPdesk)", href: "https://sebsa.topdesk.net/tas/public/ssp/content/serviceflow?unid=71a30b844ae54002b70c00e21dd4d29e" },
];
