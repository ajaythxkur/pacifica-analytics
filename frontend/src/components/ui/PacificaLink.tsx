"use client";

import { ExternalLink } from "lucide-react";

interface PacificaLinkProps {
  address: string;
}

const PACIFICA_BASE = "https://app.pacifica.fi/portfolio";

export default function PacificaLink({ address }: PacificaLinkProps) {
  return (
    <a
      href={`${PACIFICA_BASE}/${address}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1 text-[9px] text-text-muted hover:text-accent font-bold tracking-wider transition-colors"
      title="View on Pacifica"
    >
      PACIFICA <ExternalLink size={8} />
    </a>
  );
}
