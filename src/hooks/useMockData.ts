// src/hooks/useMockData.ts
import { useEffect, useState } from "react";

export const useMockData = () => {
  const [mockSchools] = useState([
    {
      id: "1",
      name: "Escola Maple Bear São Paulo",
      city: "São Paulo",
      cluster: "SP",
      totalLicenses: 50,
      usedLicenses: 35,
      status: "active",
      users: [
        {
          id: "1",
          name: "Maria Silva",
          email: "maria@mbcentral.com.br",
          role: "teacher",
          isCompliant: true,
        },
        {
          id: "2",
          name: "João Santos",
          email: "joao@mbcentral.com.br",
          role: "teacher",
          isCompliant: true,
        },
        {
          id: "3",
          name: "Ana Costa",
          email: "ana@gmail.com",
          role: "teacher",
          isCompliant: false,
        },
      ],
      hasRecentJustifications: false,
    },
    {
      id: "2",
      name: "Escola Maple Bear Rio de Janeiro",
      city: "Rio de Janeiro",
      cluster: "RJ",
      totalLicenses: 40,
      usedLicenses: 25,
      status: "active",
      users: [
        {
          id: "4",
          name: "Carlos Oliveira",
          email: "carlos@mbcentral.com.br",
          role: "admin",
          isCompliant: true,
        },
        {
          id: "5",
          name: "Beatriz Lima",
          email: "beatriz@mbcentral.com.br",
          role: "teacher",
          isCompliant: true,
        },
      ],
      hasRecentJustifications: false,
    },
  ]);

  const [mockVouchers] = useState([
    {
      id: "1",
      code: "VOUCHER001",
      school: "São Paulo",
      status: "active",
      expiryDate: "2025-12-31",
      users: 25,
    },
    {
      id: "2",
      code: "VOUCHER002",
      school: "Rio de Janeiro",
      status: "active",
      expiryDate: "2025-12-31",
      users: 20,
    },
    {
      id: "3",
      code: "VOUCHER003",
      school: "Brasília",
      status: "expired",
      expiryDate: "2024-11-30",
      users: 15,
    },
  ]);

  return { mockSchools, mockVouchers };
};
