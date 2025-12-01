import { Logos } from "@/assets/maplebear";
import { cn } from "@/lib/utils";
import { Facebook, Instagram, Youtube } from "lucide-react";
import React from "react";

interface FooterProps extends React.HTMLAttributes<HTMLElement> {}

const ENABLE_ONLY_CANVA = import.meta.env.VITE_ENABLE_ONLY_CANVA === "true";

const navLinks = ENABLE_ONLY_CANVA
  ? [
      { label: "Canva", href: "/dashboard/canva" },
      { label: "Usos", href: "/dashboard/canva/usos" },
      { label: "Custos", href: "/dashboard/canva/custos" },
    ]
  : [
      { label: "Inicio", href: "/dashboard" },
      { label: "Canva", href: "/dashboard/canva" },
      { label: "Vouchers", href: "/dashboard/vouchers" },
      { label: "Ativos", href: "/saf/ativos" },
      { label: "Tickets", href: "/tickets" },
      { label: "Base de Conhecimento", href: "/knowledge-base" },
    ];

const socialLinks = [
  { label: "Facebook", href: "https://www.facebook.com/MapleBearBrasil", Icon: Facebook },
  { label: "Instagram", href: "https://www.instagram.com/maplebearbrasil", Icon: Instagram },
  { label: "YouTube", href: "https://www.youtube.com/@maplebearbrasil", Icon: Youtube },
];

export const Footer = ({ className, ...props }: FooterProps) => {
  return (
    <footer
      className={cn(
        "relative mt-12 bg-[#c1121f] text-white shadow-[0_-24px_60px_-38px_rgba(0,0,0,0.65)]",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        <div className="pointer-events-none absolute -left-24 top-8 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.14),transparent_60%)] blur-[1px]" />
        <div className="pointer-events-none absolute bottom-0 right-10 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.18),transparent_55%)]" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-8 px-6 py-12 sm:px-10 sm:py-14">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 shadow-[0_16px_34px_-18px_rgba(0,0,0,0.7)]">
              <img
                src={Logos.Outline}
                alt="Logo Maple Bear"
                className="h-7 w-7 object-contain"
              />
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold tracking-tight text-white sm:text-[26px]">
                SAF Maple Bear
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-semibold sm:gap-4">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white/80 transition-all duration-200 hover:-translate-y-[1px] hover:border-white/30 hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            {socialLinks.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Abrir ${label} da Maple Bear em nova aba`}
                className="group flex h-12 w-12 items-center justify-center rounded-full bg-[#c1121f] text-white shadow-[0_14px_30px_-12px_rgba(193,18,31,0.75)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-14px_rgba(255,255,255,0.25)]"
              >
                <Icon className="h-5 w-5 transition-transform duration-200 group-hover:scale-105" />
              </a>
            ))}
          </div>
          <p className="text-xs text-white/55">
            Copyright 2025 Maple Bear SAF - Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};
