// Elenco degli strumenti: categoria, colore, icona. Testi in i18n (tools.<id>.title / desc / badge).
const i = (body) =>
  `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const TOOLS = [
  { id: 'reader', category: 'read', popular: true, color: 'linear-gradient(135deg,#f97316,#db2777)', icon: i('<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>') },
  { id: 'readAloud', category: 'read', popular: true, color: 'linear-gradient(135deg,#22c55e,#0ea5e9)', icon: i('<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1v-6h3zM3 19a2 2 0 0 0 2 2h1v-6H3z"/>') },
  { id: 'scanner', category: 'scan', popular: true, color: 'linear-gradient(135deg,#10b981,#059669)', icon: i('<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/>') },
  { id: 'ocr', category: 'scan', popular: true, color: 'linear-gradient(135deg,#0ea5e9,#2563eb)', icon: i('<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M8 9h8M12 9v7"/>') },
  { id: 'merge', category: 'organize', popular: true, color: 'linear-gradient(135deg,#ec4899,#f43f5e)', icon: i('<path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3"/><path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3"/><path d="M12 8v8M8 12h8"/>') },
  { id: 'split', category: 'organize', popular: true, color: 'linear-gradient(135deg,#f59e0b,#d97706)', icon: i('<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>') },
  { id: 'compress', category: 'organize', popular: true, color: 'linear-gradient(135deg,#06b6d4,#0891b2)', icon: i('<polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/>') },
  { id: 'edit', category: 'edit', popular: true, color: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', icon: i('<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>') },
  { id: 'sign', category: 'edit', popular: true, color: 'linear-gradient(135deg,#3b82f6,#2563eb)', icon: i('<path d="M3 17c3-1 4-6 6-6s1 5 3 5 2-3 4-3 3 2 5 2"/><line x1="3" y1="21" x2="21" y2="21"/>') },
  { id: 'fillForm', category: 'edit', popular: true, color: 'linear-gradient(135deg,#0284c7,#0369a1)', icon: i('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="9 15 11 17 15 13"/>') },
  { id: 'pdfToWord', category: 'convert', popular: true, color: 'linear-gradient(135deg,#2563eb,#1d4ed8)', icon: i('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M8 12l1.5 6L12 13l2.5 5L16 12"/>') },
  { id: 'pdfToImg', category: 'convert', popular: false, color: 'linear-gradient(135deg,#a855f7,#9333ea)', icon: i('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>') },
  { id: 'imgToPdf', category: 'convert', popular: true, color: 'linear-gradient(135deg,#10b981,#047857)', icon: i('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>') },
  { id: 'pdfToText', category: 'convert', popular: false, color: 'linear-gradient(135deg,#64748b,#475569)', icon: i('<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>') },
  { id: 'organize', category: 'organize', popular: false, color: 'linear-gradient(135deg,#14b8a6,#0d9488)', icon: i('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>') },
  { id: 'rotate', category: 'organize', popular: false, color: 'linear-gradient(135deg,#f97316,#ea580c)', icon: i('<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><polyline points="21 3 21 8 16 8"/>') },
  { id: 'watermark', category: 'edit', popular: false, color: 'linear-gradient(135deg,#0ea5e9,#0284c7)', icon: i('<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>') },
  { id: 'pageNumbers', category: 'edit', popular: false, color: 'linear-gradient(135deg,#6366f1,#4338ca)', icon: i('<line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>') },
  { id: 'protect', category: 'security', popular: false, color: 'linear-gradient(135deg,#ef4444,#dc2626)', icon: i('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>') },
  { id: 'unlock', category: 'security', popular: false, color: 'linear-gradient(135deg,#84cc16,#65a30d)', icon: i('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>') },
  { id: 'redact', category: 'security', popular: false, color: 'linear-gradient(135deg,#334155,#0f172a)', icon: i('<rect x="3" y="5" width="18" height="4" rx="1"/><line x1="3" y1="13" x2="13" y2="13"/><rect x="3" y="16" width="12" height="4" rx="1"/>') },
  { id: 'metadata', category: 'security', popular: false, color: 'linear-gradient(135deg,#f43f5e,#be123c)', icon: i('<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>') },
  { id: 'flatten', category: 'security', popular: false, color: 'linear-gradient(135deg,#d946ef,#c026d3)', icon: i('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 12 2 2 4-4"/>') },
  { id: 'analytics', category: 'analytics', popular: false, color: 'linear-gradient(135deg,#6366f1,#8b5cf6)', icon: i('<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>') },
];

export const CATEGORIES = ['all', 'popular', 'read', 'scan', 'edit', 'organize', 'convert', 'security', 'analytics'];

/** Strumenti che possono ricevere un PDF già pronto (per "Continua con un altro strumento"). */
export const PDF_TOOLS = TOOLS.filter((tool) => tool.id !== 'scanner' && tool.id !== 'imgToPdf').map((tool) => tool.id);

export function getTool(id) {
  return TOOLS.find((tool) => tool.id === id);
}
