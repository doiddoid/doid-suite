import { useState, useEffect } from "react";

// ─── ICONE SVG ──────────────────────────────────────────────
const Icons = {
  Search: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  ChevronRight: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
  ChevronLeft: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  X: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,
  Calendar: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>,
  Building: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>,
  Key: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.3 9.3"/><path d="m18 5 3-3"/></svg>,
  Users: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  UserPlus: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>,
  Mail: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
  Phone: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  Edit: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>,
  Save: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/></svg>,
  Trash: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
  Link: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  Unlink: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18.84 12.25 1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71"/><path d="m5.17 11.75-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71"/><line x1="8" x2="8" y1="2" y2="5"/><line x1="2" x2="5" y1="8" y2="8"/><line x1="16" x2="16" y1="19" y2="22"/><line x1="19" x2="22" y1="16" y2="16"/></svg>,
  RefreshCw: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>,
  AlertTriangle: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>,
  Clock: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Zap: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Dashboard: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>,
  Star: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Settings: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
  HelpCircle: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>,
  Shield: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>,
  Activity: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/></svg>,
  ExternalLink: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>,
  Bell: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
};

// ─── DATI ───────────────────────────────────────────────────
const SERVICES_META = {
  review: { name: "Review", emoji: "⭐", color: "#f59e0b" },
  page: { name: "Page", emoji: "📄", color: "#3b82f6" },
  menu: { name: "Menu", emoji: "🍽️", color: "#10b981" },
  display: { name: "Display", emoji: "🖥️", color: "#8b5cf6" },
  agent: { name: "Agent AI", emoji: "🤖", color: "#ec4899" },
  connect: { name: "Connect", emoji: "🔗", color: "#06b6d4" },
};

const ORGANIZATIONS = [
  { id: "org1", name: "Publiphoto" },
  { id: "org2", name: "DOID Test Account" },
];

const clientsData = [
  {
    id: 1, name: "DOID Test Account", email: "test@doid.biz", phone: "3517813950",
    piva: "IT12345678901", type: "agency", orgId: "org2", orgName: null, status: "Attivo",
    activities: 3, maxActivities: 10,
    members: [
      { name: "Admin Test", email: "test@doid.biz", role: "owner", lastAccess: "2026-02-20" },
      { name: "Dev Account", email: "dev@doid.biz", role: "admin", lastAccess: "2026-02-19" },
    ],
    services: [
      { key: "review", status: "PRO", plan: "Pro", renewDate: "2026-06-01", payMethod: "stripe", daysLeft: 101 },
      { key: "page", status: "PRO", plan: "Pro", renewDate: "2026-06-01", payMethod: "stripe", daysLeft: 101 },
      { key: "menu", status: "TRIAL", plan: "Pro", renewDate: null, payMethod: null, daysLeft: 22, trialEnd: "2026-03-14" },
      { key: "display", status: "INACTIVE" }, { key: "agent", status: "INACTIVE" }, { key: "connect", status: "INACTIVE" },
    ],
    managedClients: [],
  },
  {
    id: 2, name: "Publiphoto", email: "grandinmirco@gmail.com", phone: "3511234567",
    piva: "IT99887766554", type: "agency", orgId: "org1", orgName: null, status: "Attivo",
    activities: 1, maxActivities: 10,
    members: [
      { name: "Mirco Grandin", email: "grandinmirco@gmail.com", role: "owner", lastAccess: "2026-02-20" },
    ],
    services: [
      { key: "review", status: "PRO", plan: "Pro", renewDate: "2026-05-01", payMethod: "stripe", daysLeft: 70 },
      { key: "page", status: "PRO", plan: "Pro", renewDate: "2026-05-01", payMethod: "stripe", daysLeft: 70 },
      { key: "menu", status: "INACTIVE" }, { key: "display", status: "INACTIVE" },
      { key: "agent", status: "INACTIVE" }, { key: "connect", status: "INACTIVE" },
    ],
    managedClients: [3, 5, 6],
  },
  {
    id: 3, name: "Enotria", email: "mircograndin@tiscali.it", phone: "3517813950",
    piva: "-", type: "single", orgId: null, orgName: null, status: "Attivo",
    activities: 1, maxActivities: 1,
    members: [{ name: "Mirco Grandin", email: "mircograndin@tiscali.it", role: "owner", lastAccess: "2026-02-18" }],
    services: [
      { key: "review", status: "INACTIVE" }, { key: "page", status: "INACTIVE" },
      { key: "menu", status: "EXPIRED", plan: "Pro", renewDate: "2026-01-15", payMethod: "bonifico", daysLeft: -36 },
      { key: "display", status: "INACTIVE" }, { key: "agent", status: "INACTIVE" }, { key: "connect", status: "INACTIVE" },
    ],
  },
  {
    id: 4, name: "UNICO SEAVIEW HOTEL", email: "info@unicohotelcaorle.it", phone: "3401234567",
    piva: "IT01234567890", type: "single", orgId: null, orgName: null, status: "Attivo",
    activities: 1, maxActivities: 1,
    members: [{ name: "Hotel Manager", email: "info@unicohotelcaorle.it", role: "owner", lastAccess: "2026-02-20" }],
    services: [
      { key: "review", status: "PRO", plan: "Pro", renewDate: "2026-04-15", payMethod: "bonifico", daysLeft: 54 },
      { key: "page", status: "FREE", plan: "Free" },
      { key: "menu", status: "INACTIVE" }, { key: "display", status: "INACTIVE" },
      { key: "agent", status: "INACTIVE" }, { key: "connect", status: "INACTIVE" },
    ],
  },
  {
    id: 5, name: "La Brace", email: "pizzerialabrace@gmail.com", phone: "3476543210",
    piva: "IT11223344556", type: "single", orgId: "org1", orgName: "Publiphoto", status: "Attivo",
    activities: 1, maxActivities: 1,
    members: [{ name: "Giuseppe Rossi", email: "pizzerialabrace@gmail.com", role: "owner", lastAccess: "2026-02-20" }],
    services: [
      { key: "review", status: "PRO", plan: "Pro", renewDate: "2026-03-15", payMethod: "stripe", daysLeft: 23 },
      { key: "page", status: "TRIAL", plan: "Pro", daysLeft: 5, trialEnd: "2026-02-25" },
      { key: "menu", status: "INACTIVE" }, { key: "display", status: "INACTIVE" },
      { key: "agent", status: "INACTIVE" }, { key: "connect", status: "INACTIVE" },
    ],
  },
  {
    id: 6, name: "AL VELIERO", email: "alveliero.caorle@gmail.com", phone: "3489012345",
    piva: "IT09876543210", type: "single", orgId: "org1", orgName: "Publiphoto", status: "Attivo",
    activities: 1, maxActivities: 1,
    members: [{ name: "Marco Bianchi", email: "alveliero.caorle@gmail.com", role: "owner", lastAccess: "2026-02-19" }],
    services: [
      { key: "review", status: "PRO", plan: "Pro", renewDate: "2026-04-01", payMethod: "bonifico", daysLeft: 40 },
      { key: "page", status: "PRO", plan: "Pro", renewDate: "2026-04-01", payMethod: "bonifico", daysLeft: 40 },
      { key: "menu", status: "FREE", plan: "Free" },
      { key: "display", status: "INACTIVE" }, { key: "agent", status: "INACTIVE" }, { key: "connect", status: "INACTIVE" },
    ],
  },
  {
    id: 7, name: "CARAVELS", email: "info@columbus.it", phone: "3334567890",
    piva: "-", type: "single", orgId: null, orgName: null, status: "Attivo",
    activities: 1, maxActivities: 1,
    members: [{ name: "Luca Verdi", email: "info@columbus.it", role: "owner", lastAccess: "2026-02-15" }],
    services: [
      { key: "review", status: "TRIAL", plan: "Pro", daysLeft: 5, trialEnd: "2026-02-25" },
      { key: "page", status: "INACTIVE" }, { key: "menu", status: "INACTIVE" },
      { key: "display", status: "INACTIVE" }, { key: "agent", status: "INACTIVE" }, { key: "connect", status: "INACTIVE" },
    ],
  },
  {
    id: 8, name: "Cinganotto", email: "tania.vio.73@gmail.com", phone: "3287654321",
    piva: "-", type: "single", orgId: null, orgName: null, status: "Attivo",
    activities: 1, maxActivities: 1,
    members: [{ name: "Tania Vio", email: "tania.vio.73@gmail.com", role: "owner", lastAccess: "2026-01-30" }],
    services: [
      { key: "review", status: "TRIAL", plan: "Pro", daysLeft: 12, trialEnd: "2026-03-04" },
      { key: "page", status: "INACTIVE" }, { key: "menu", status: "INACTIVE" },
      { key: "display", status: "INACTIVE" }, { key: "agent", status: "INACTIVE" }, { key: "connect", status: "INACTIVE" },
    ],
  },
  {
    id: 9, name: "casa francesco", email: "casafrancescocaorle@gmail.com", phone: "3409876543",
    piva: "IT44556677889", type: "single", orgId: null, orgName: null, status: "Attivo",
    activities: 1, maxActivities: 1,
    members: [{ name: "Francesco Conte", email: "casafrancescocaorle@gmail.com", role: "owner", lastAccess: "2026-02-17" }],
    services: [
      { key: "review", status: "PRO", plan: "Pro", renewDate: "2026-06-01", payMethod: "bonifico", daysLeft: 101 },
      { key: "page", status: "FREE", plan: "Free" },
      { key: "menu", status: "INACTIVE" }, { key: "display", status: "INACTIVE" },
      { key: "agent", status: "INACTIVE" }, { key: "connect", status: "INACTIVE" },
    ],
  },
  {
    id: 10, name: "nettuno-caorle", email: "info@hotelnettunocaorle.com", phone: "3401112233",
    piva: "IT55667788990", type: "single", orgId: null, orgName: null, status: "Attivo",
    activities: 1, maxActivities: 1,
    members: [{ name: "Hotel Nettuno", email: "info@hotelnettunocaorle.com", role: "owner", lastAccess: "2026-02-16" }],
    services: [
      { key: "review", status: "FREE", plan: "Free" },
      { key: "page", status: "INACTIVE" }, { key: "menu", status: "INACTIVE" },
      { key: "display", status: "INACTIVE" }, { key: "agent", status: "INACTIVE" }, { key: "connect", status: "INACTIVE" },
    ],
  },
];

// ─── BADGE ──────────────────────────────────────────────────
const StatusBadge = ({ status, small }) => {
  const map = {
    PRO: { bg: "#dcfce7", c: "#166534", b: "#bbf7d0", l: "PRO" },
    TRIAL: { bg: "#fef3c7", c: "#92400e", b: "#fde68a", l: "TRIAL" },
    FREE: { bg: "#eff6ff", c: "#1d4ed8", b: "#bfdbfe", l: "FREE" },
    INACTIVE: { bg: "#f3f4f6", c: "#6b7280", b: "#e5e7eb", l: "INATTIVO" },
    EXPIRED: { bg: "#fef2f2", c: "#991b1b", b: "#fecaca", l: "SCADUTO" },
  };
  const s = map[status] || map.INACTIVE;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "3px",
      padding: small ? "1px 6px" : "2px 8px", borderRadius: "5px",
      fontSize: small ? "9px" : "10px", fontWeight: 700,
      background: s.bg, color: s.c, border: `1px solid ${s.b}`,
      letterSpacing: "0.03em",
    }}>
      {status === "PRO" && <Icons.Zap />}
      {status === "TRIAL" && <Icons.Clock />}
      {status === "EXPIRED" && <Icons.AlertTriangle />}
      {s.l}
    </span>
  );
};

// ─── MODALE: CAMBIO STATO SERVIZIO ─────────────────────────
const ServiceModal = ({ service, client, onClose, onSave }) => {
  const meta = SERVICES_META[service.key];
  const [newStatus, setNewStatus] = useState(service.status);
  const [renewDate, setRenewDate] = useState(service.renewDate || "");
  const [payMethod, setPayMethod] = useState(service.payMethod || "stripe");

  const statuses = [
    { v: "INACTIVE", l: "Non Attivo", i: "⭘" },
    { v: "TRIAL", l: "TRIAL", i: "⏳" },
    { v: "PRO", l: "PRO", i: "⚡" },
    { v: "FREE", l: "FREE", i: "○" },
    { v: "EXPIRED", l: "Scaduto", i: "⚠" },
  ];

  const showRenew = ["PRO","TRIAL"].includes(newStatus);

  return (
    <div style={{ position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.45)",backdropFilter:"blur(3px)" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#fff",borderRadius:"14px",width:"440px",boxShadow:"0 20px 60px rgba(0,0,0,0.18)",animation:"fadeUp .2s ease" }}>
        <div style={{ padding:"18px 22px",borderBottom:"1px solid #f0f0f0",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div style={{ display:"flex",alignItems:"center",gap:"10px" }}>
            <span style={{ fontSize:"22px" }}>{meta.emoji}</span>
            <div>
              <div style={{ fontWeight:700,fontSize:"14px",color:"#111" }}>{meta.name}</div>
              <div style={{ fontSize:"12px",color:"#888" }}>{client.name}</div>
            </div>
          </div>
          <StatusBadge status={service.status} />
        </div>

        <div style={{ padding:"18px 22px" }}>
          <div style={{ fontSize:"11px",fontWeight:700,color:"#888",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:"10px" }}>Nuovo stato</div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"6px" }}>
            {statuses.map(s=>(
              <button key={s.v} onClick={()=>setNewStatus(s.v)} style={{
                padding:"8px",borderRadius:"8px",border:`2px solid ${newStatus===s.v?meta.color:"#e5e7eb"}`,
                background:newStatus===s.v?meta.color+"0a":"#fff",cursor:"pointer",
                display:"flex",flexDirection:"column",alignItems:"center",gap:"2px",transition:"all .12s",
              }}>
                <span style={{ fontSize:"16px" }}>{s.i}</span>
                <span style={{ fontSize:"11px",fontWeight:600,color:newStatus===s.v?meta.color:"#555" }}>{s.l}</span>
              </button>
            ))}
          </div>

          {showRenew && (
            <div style={{ marginTop:"18px",padding:"14px",borderRadius:"10px",background:"#f8fafc",border:"1px solid #e2e8f0" }}>
              <div style={{ fontSize:"11px",fontWeight:700,color:"#475569",marginBottom:"10px",display:"flex",alignItems:"center",gap:"5px" }}>
                <Icons.Calendar /> Rinnovo e Pagamento
              </div>
              <div style={{ marginBottom:"10px" }}>
                <label style={{ fontSize:"11px",color:"#64748b",display:"block",marginBottom:"4px" }}>Data prossimo rinnovo</label>
                <input type="date" value={renewDate} onChange={e=>setRenewDate(e.target.value)}
                  style={{ width:"100%",padding:"7px 10px",borderRadius:"7px",border:"1px solid #d1d5db",fontSize:"12px",outline:"none",boxSizing:"border-box" }}/>
              </div>
              <div>
                <label style={{ fontSize:"11px",color:"#64748b",display:"block",marginBottom:"6px" }}>Metodo pagamento</label>
                <div style={{ display:"flex",gap:"6px" }}>
                  {[{v:"stripe",l:"💳 Stripe",d:"Automatico"},{v:"bonifico",l:"🏦 Bonifico",d:"Manuale"}].map(m=>(
                    <button key={m.v} onClick={()=>setPayMethod(m.v)} style={{
                      flex:1,padding:"8px",borderRadius:"8px",border:`2px solid ${payMethod===m.v?meta.color:"#e5e7eb"}`,
                      background:payMethod===m.v?meta.color+"08":"#fff",cursor:"pointer",textAlign:"left",transition:"all .12s",
                    }}>
                      <div style={{ fontSize:"12px",fontWeight:600 }}>{m.l}</div>
                      <div style={{ fontSize:"10px",color:"#888",marginTop:"1px" }}>{m.d}</div>
                    </button>
                  ))}
                </div>
              </div>
              {payMethod==="bonifico"&&!renewDate&&(
                <div style={{ marginTop:"8px",padding:"6px 10px",borderRadius:"6px",background:"#fef3c7",border:"1px solid #fde68a",fontSize:"11px",color:"#92400e",display:"flex",alignItems:"center",gap:"5px" }}>
                  <Icons.AlertTriangle /> Imposta una data di scadenza per bonifico
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ padding:"14px 22px",borderTop:"1px solid #f0f0f0",display:"flex",justifyContent:"flex-end",gap:"8px",background:"#fafafa",borderRadius:"0 0 14px 14px" }}>
          <button onClick={onClose} style={{ padding:"7px 18px",borderRadius:"7px",border:"1px solid #d1d5db",background:"#fff",cursor:"pointer",fontSize:"12px",fontWeight:500,color:"#555" }}>Annulla</button>
          <button onClick={()=>{onSave({...service,status:newStatus,renewDate,payMethod});onClose();}} style={{ padding:"7px 18px",borderRadius:"7px",border:"none",background:"#0d9488",color:"#fff",cursor:"pointer",fontSize:"12px",fontWeight:600 }}>
            Salva Modifiche
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── MODALE: ASSEGNA ORG ────────────────────────────────────
const AssignOrgModal = ({ client, onClose }) => {
  const [sel, setSel] = useState(client.orgId || "");
  const [search, setSearch] = useState("");
  const filtered = ORGANIZATIONS.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.45)",backdropFilter:"blur(3px)" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#fff",borderRadius:"14px",width:"400px",boxShadow:"0 20px 60px rgba(0,0,0,0.18)",animation:"fadeUp .2s ease" }}>
        <div style={{ padding:"18px 22px",borderBottom:"1px solid #f0f0f0",display:"flex",alignItems:"center",gap:"10px" }}>
          <div style={{ width:"34px",height:"34px",borderRadius:"8px",background:"#ede9fe",display:"flex",alignItems:"center",justifyContent:"center",color:"#7c3aed" }}><Icons.Building /></div>
          <div>
            <div style={{ fontWeight:700,fontSize:"14px" }}>Assegna a Organizzazione</div>
            <div style={{ fontSize:"12px",color:"#888" }}>{client.name}</div>
          </div>
        </div>
        <div style={{ padding:"16px 22px" }}>
          {client.orgName&&(
            <div style={{ padding:"10px 14px",borderRadius:"8px",marginBottom:"12px",background:"#f0fdf4",border:"1px solid #bbf7d0",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
              <div><div style={{ fontSize:"10px",color:"#166534",fontWeight:600 }}>Assegnato a</div><div style={{ fontSize:"13px",fontWeight:700,color:"#166534" }}>{client.orgName}</div></div>
              <button onClick={()=>setSel("")} style={{ padding:"3px 8px",borderRadius:"5px",border:"1px solid #fca5a5",background:"#fef2f2",color:"#dc2626",fontSize:"10px",fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:"3px" }}><Icons.Unlink /> Dissocia</button>
            </div>
          )}
          <div style={{ position:"relative",marginBottom:"10px" }}>
            <div style={{ position:"absolute",left:"10px",top:"50%",transform:"translateY(-50%)",color:"#aaa" }}><Icons.Search /></div>
            <input type="text" placeholder="Cerca..." value={search} onChange={e=>setSearch(e.target.value)} style={{ width:"100%",padding:"8px 10px 8px 34px",borderRadius:"8px",border:"1px solid #d1d5db",fontSize:"12px",outline:"none",boxSizing:"border-box" }}/>
          </div>
          <div style={{ maxHeight:"180px",overflowY:"auto" }}>
            <button onClick={()=>setSel("")} style={{ width:"100%",padding:"10px 12px",borderRadius:"8px",marginBottom:"4px",border:`2px solid ${sel===""?"#0d9488":"#e5e7eb"}`,background:sel===""?"#f0fdfa":"#fff",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:"8px" }}>
              <div style={{ width:"28px",height:"28px",borderRadius:"6px",background:"#f3f4f6",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px" }}>—</div>
              <div style={{ fontSize:"12px",fontWeight:600,color:"#555" }}>Nessuna</div>
              {sel===""&&<div style={{ marginLeft:"auto",color:"#0d9488" }}><Icons.Check /></div>}
            </button>
            {filtered.map(o=>(
              <button key={o.id} onClick={()=>setSel(o.id)} style={{ width:"100%",padding:"10px 12px",borderRadius:"8px",marginBottom:"4px",border:`2px solid ${sel===o.id?"#0d9488":"#e5e7eb"}`,background:sel===o.id?"#f0fdfa":"#fff",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:"8px" }}>
                <div style={{ width:"28px",height:"28px",borderRadius:"6px",background:"#ede9fe",display:"flex",alignItems:"center",justifyContent:"center",color:"#7c3aed",fontWeight:700,fontSize:"11px" }}>{o.name[0]}</div>
                <div style={{ fontSize:"12px",fontWeight:600,color:"#555" }}>{o.name}</div>
                {sel===o.id&&<div style={{ marginLeft:"auto",color:"#0d9488" }}><Icons.Check /></div>}
              </button>
            ))}
          </div>
        </div>
        <div style={{ padding:"14px 22px",borderTop:"1px solid #f0f0f0",display:"flex",justifyContent:"flex-end",gap:"8px",background:"#fafafa",borderRadius:"0 0 14px 14px" }}>
          <button onClick={onClose} style={{ padding:"7px 18px",borderRadius:"7px",border:"1px solid #d1d5db",background:"#fff",cursor:"pointer",fontSize:"12px",fontWeight:500,color:"#555" }}>Annulla</button>
          <button onClick={onClose} style={{ padding:"7px 18px",borderRadius:"7px",border:"none",background:"#0d9488",color:"#fff",cursor:"pointer",fontSize:"12px",fontWeight:600 }}>Conferma</button>
        </div>
      </div>
    </div>
  );
};

// ─── MODALE: RESET CREDENZIALI ──────────────────────────────
const ResetModal = ({ client, onClose }) => {
  const [sent, setSent] = useState(null);
  const handle = (type) => { setSent("loading"); setTimeout(()=>setSent(type),700); };

  return (
    <div style={{ position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.45)",backdropFilter:"blur(3px)" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#fff",borderRadius:"14px",width:"400px",boxShadow:"0 20px 60px rgba(0,0,0,0.18)",animation:"fadeUp .2s ease" }}>
        <div style={{ padding:"18px 22px",borderBottom:"1px solid #f0f0f0",display:"flex",alignItems:"center",gap:"10px" }}>
          <div style={{ width:"34px",height:"34px",borderRadius:"8px",background:"#fef3c7",display:"flex",alignItems:"center",justifyContent:"center",color:"#d97706" }}><Icons.Key /></div>
          <div><div style={{ fontWeight:700,fontSize:"14px" }}>Credenziali di Accesso</div><div style={{ fontSize:"12px",color:"#888" }}>{client.email}</div></div>
        </div>
        <div style={{ padding:"18px 22px" }}>
          {sent==="loading"?(
            <div style={{ textAlign:"center",padding:"24px",color:"#888" }}>
              <div style={{ fontSize:"24px",marginBottom:"8px",animation:"spin 1s linear infinite" }}>⏳</div>
              <div style={{ fontSize:"13px" }}>Invio in corso...</div>
            </div>
          ):sent?(
            <div style={{ textAlign:"center",padding:"20px",borderRadius:"10px",background:"#f0fdf4",border:"1px solid #bbf7d0" }}>
              <div style={{ fontSize:"28px",marginBottom:"6px" }}>✅</div>
              <div style={{ fontWeight:700,color:"#166534",fontSize:"14px" }}>{sent==="reset"?"Email di reset inviata!":"Nuove credenziali generate!"}</div>
              <div style={{ fontSize:"12px",color:"#16a34a",marginTop:"3px" }}>Inviata a {client.email}</div>
            </div>
          ):(
            <div style={{ display:"flex",flexDirection:"column",gap:"8px" }}>
              {[
                { type:"reset", icon:<Icons.Mail />, bg:"#f0fdfa", c:"#0d9488", title:"Invia email reset password", desc:"Link per reimpostare la password" },
                { type:"regen", icon:<Icons.RefreshCw />, bg:"#fffbeb", c:"#d97706", title:"Genera nuove credenziali", desc:"Nuova password inviata via email" },
              ].map(a=>(
                <button key={a.type} onClick={()=>handle(a.type)} style={{
                  padding:"14px",borderRadius:"10px",border:"1px solid #e5e7eb",background:"#fff",cursor:"pointer",textAlign:"left",
                  display:"flex",alignItems:"center",gap:"12px",transition:"all .12s",
                }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor="#0d9488"}
                  onMouseLeave={e=>e.currentTarget.style.borderColor="#e5e7eb"}
                >
                  <div style={{ width:"36px",height:"36px",borderRadius:"8px",background:a.bg,display:"flex",alignItems:"center",justifyContent:"center",color:a.c }}>{a.icon}</div>
                  <div><div style={{ fontWeight:600,fontSize:"13px",color:"#111" }}>{a.title}</div><div style={{ fontSize:"11px",color:"#888",marginTop:"1px" }}>{a.desc}</div></div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ padding:"14px 22px",borderTop:"1px solid #f0f0f0",display:"flex",justifyContent:"flex-end",background:"#fafafa",borderRadius:"0 0 14px 14px" }}>
          <button onClick={onClose} style={{ padding:"7px 18px",borderRadius:"7px",border:"1px solid #d1d5db",background:"#fff",cursor:"pointer",fontSize:"12px",fontWeight:500,color:"#555" }}>Chiudi</button>
        </div>
      </div>
    </div>
  );
};

// ─── MODALE: AGGIUNGI MEMBRO ────────────────────────────────
const AddMemberModal = ({ client, onClose }) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("manager");

  return (
    <div style={{ position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.45)",backdropFilter:"blur(3px)" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#fff",borderRadius:"14px",width:"400px",boxShadow:"0 20px 60px rgba(0,0,0,0.18)",animation:"fadeUp .2s ease" }}>
        <div style={{ padding:"18px 22px",borderBottom:"1px solid #f0f0f0",display:"flex",alignItems:"center",gap:"10px" }}>
          <div style={{ width:"34px",height:"34px",borderRadius:"8px",background:"#ede9fe",display:"flex",alignItems:"center",justifyContent:"center",color:"#7c3aed" }}><Icons.UserPlus /></div>
          <div><div style={{ fontWeight:700,fontSize:"14px" }}>Aggiungi Membro</div><div style={{ fontSize:"12px",color:"#888" }}>{client.name}</div></div>
        </div>
        <div style={{ padding:"18px 22px" }}>
          <div style={{ marginBottom:"14px" }}>
            <label style={{ fontSize:"11px",fontWeight:600,color:"#555",display:"block",marginBottom:"5px" }}>Email</label>
            <input type="email" placeholder="email@esempio.it" value={email} onChange={e=>setEmail(e.target.value)} style={{ width:"100%",padding:"8px 12px",borderRadius:"8px",border:"1px solid #d1d5db",fontSize:"12px",outline:"none",boxSizing:"border-box" }}/>
          </div>
          <div>
            <label style={{ fontSize:"11px",fontWeight:600,color:"#555",display:"block",marginBottom:"6px" }}>Ruolo</label>
            <div style={{ display:"flex",gap:"6px" }}>
              {[{v:"admin",l:"Admin",d:"Accesso completo"},{v:"manager",l:"Manager",d:"Gestione contenuti"},{v:"user",l:"Utente",d:"Solo lettura"}].map(r=>(
                <button key={r.v} onClick={()=>setRole(r.v)} style={{
                  flex:1,padding:"8px",borderRadius:"8px",border:`2px solid ${role===r.v?"#7c3aed":"#e5e7eb"}`,
                  background:role===r.v?"#faf5ff":"#fff",cursor:"pointer",textAlign:"center",transition:"all .12s",
                }}>
                  <div style={{ fontSize:"12px",fontWeight:600,color:role===r.v?"#7c3aed":"#555" }}>{r.l}</div>
                  <div style={{ fontSize:"9px",color:"#999",marginTop:"1px" }}>{r.d}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ padding:"14px 22px",borderTop:"1px solid #f0f0f0",display:"flex",justifyContent:"flex-end",gap:"8px",background:"#fafafa",borderRadius:"0 0 14px 14px" }}>
          <button onClick={onClose} style={{ padding:"7px 18px",borderRadius:"7px",border:"1px solid #d1d5db",background:"#fff",cursor:"pointer",fontSize:"12px",fontWeight:500,color:"#555" }}>Annulla</button>
          <button onClick={onClose} style={{ padding:"7px 18px",borderRadius:"7px",border:"none",background:"#7c3aed",color:"#fff",cursor:"pointer",fontSize:"12px",fontWeight:600,opacity:email?1:0.5 }}>Invia Invito</button>
        </div>
      </div>
    </div>
  );
};

// ─── DETTAGLIO CLIENTE ──────────────────────────────────────
const ClientDetail = ({ client, onClose }) => {
  const [tab, setTab] = useState("servizi");
  const [editInfo, setEditInfo] = useState(false);
  const [editData, setEditData] = useState({});
  const [svcModal, setSvcModal] = useState(null);
  const [orgModal, setOrgModal] = useState(false);
  const [resetModal, setResetModal] = useState(false);
  const [memberModal, setMemberModal] = useState(false);

  useEffect(() => {
    if (client) {
      setEditData({ name:client.name, email:client.email, phone:client.phone, piva:client.piva });
      setTab("servizi"); setEditInfo(false);
    }
  }, [client?.id]);

  if (!client) return null;

  const activeSvcs = client.services.filter(s=>s.status!=="INACTIVE");
  const expiredSvcs = client.services.filter(s=>s.status==="EXPIRED");
  const urgentTrials = client.services.filter(s=>s.status==="TRIAL"&&s.daysLeft<=7);
  const isAgency = client.type==="agency";

  const tabs = [
    { k:"servizi", l:"Servizi", c:activeSvcs.length },
    { k:"info", l:"Dati" },
    { k:"membri", l:"Membri", c:client.members.length },
    ...(isAgency?[{ k:"clienti", l:"Clienti gestiti", c:client.managedClients?.length||0 }]:[]),
  ];

  return (
    <div style={{ width:"100%",height:"100%",display:"flex",flexDirection:"column",background:"#fff",borderLeft:"1px solid #e5e7eb",overflow:"hidden" }}>
      {/* Header cliente */}
      <div style={{ padding:"16px 20px",borderBottom:"1px solid #e5e7eb",background:"#fafbfc",flexShrink:0 }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"12px" }}>
          <div style={{ display:"flex",alignItems:"center",gap:"10px" }}>
            <div style={{
              width:"42px",height:"42px",borderRadius:"10px",
              background:isAgency?"linear-gradient(135deg,#7c3aed,#6d28d9)":"linear-gradient(135deg,#0d9488,#0f766e)",
              display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:"16px",
            }}>{client.name[0]}</div>
            <div>
              <div style={{ display:"flex",alignItems:"center",gap:"6px" }}>
                <span style={{ fontWeight:700,fontSize:"16px",color:"#111" }}>{client.name}</span>
                {isAgency&&<span style={{ padding:"1px 6px",borderRadius:"4px",fontSize:"9px",fontWeight:700,background:"#ede9fe",color:"#7c3aed" }}>AGENZIA</span>}
              </div>
              <div style={{ display:"flex",alignItems:"center",gap:"12px",marginTop:"2px" }}>
                <span style={{ fontSize:"12px",color:"#888",display:"flex",alignItems:"center",gap:"3px" }}><Icons.Mail /> {client.email}</span>
                <span style={{ fontSize:"12px",color:"#888",display:"flex",alignItems:"center",gap:"3px" }}><Icons.Phone /> {client.phone}</span>
              </div>
              {client.orgName&&(
                <div style={{ display:"inline-flex",alignItems:"center",gap:"4px",marginTop:"4px",padding:"2px 8px",borderRadius:"4px",background:"#ede9fe",fontSize:"10px",fontWeight:600,color:"#7c3aed" }}>
                  <Icons.Building /> Gestito da {client.orgName}
                </div>
              )}
            </div>
          </div>
          <div style={{ display:"flex",gap:"5px",alignItems:"center" }}>
            <button onClick={()=>setOrgModal(true)} title="Organizzazione" style={{ width:"32px",height:"32px",borderRadius:"7px",border:"1px solid #e5e7eb",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#888",transition:"all .12s" }}>
              <Icons.Building />
            </button>
            <button onClick={()=>setResetModal(true)} title="Reset credenziali" style={{ width:"32px",height:"32px",borderRadius:"7px",border:"1px solid #e5e7eb",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#888" }}>
              <Icons.Key />
            </button>
            <button onClick={onClose} title="Chiudi" style={{ width:"32px",height:"32px",borderRadius:"7px",border:"1px solid #e5e7eb",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#888" }}>
              <Icons.X />
            </button>
          </div>
        </div>

        {(expiredSvcs.length>0||urgentTrials.length>0)&&(
          <div style={{ padding:"8px 12px",borderRadius:"8px",background:expiredSvcs.length>0?"#fef2f2":"#fefce8",border:`1px solid ${expiredSvcs.length>0?"#fecaca":"#fde68a"}`,fontSize:"11px",fontWeight:500,color:expiredSvcs.length>0?"#991b1b":"#854d0e",display:"flex",alignItems:"center",gap:"6px" }}>
            <Icons.AlertTriangle />
            {expiredSvcs.length>0
              ? `${expiredSvcs.map(s=>SERVICES_META[s.key].name).join(", ")} scadut${expiredSvcs.length>1?"i":"o"}`
              : `Trial in scadenza: ${urgentTrials.map(s=>SERVICES_META[s.key].name).join(", ")}`}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex",borderBottom:"1px solid #e5e7eb",padding:"0 20px",flexShrink:0 }}>
        {tabs.map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} style={{
            padding:"10px 14px",border:"none",background:"none",cursor:"pointer",
            fontSize:"12px",fontWeight:600,color:tab===t.k?"#0d9488":"#888",
            borderBottom:`2px solid ${tab===t.k?"#0d9488":"transparent"}`,marginBottom:"-1px",
            display:"flex",alignItems:"center",gap:"5px",transition:"all .12s",
          }}>
            {t.l}
            {t.c!==undefined&&<span style={{ padding:"0 5px",borderRadius:"8px",fontSize:"9px",fontWeight:700,background:tab===t.k?"#ccfbf1":"#f3f4f6",color:tab===t.k?"#0d9488":"#aaa" }}>{t.c}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex:1,overflow:"auto",padding:"18px 20px" }}>

        {tab==="servizi"&&(
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px" }}>
            {client.services.map(svc=>{
              const m=SERVICES_META[svc.key];
              const active=svc.status!=="INACTIVE";
              const expired=svc.status==="EXPIRED";
              const trial=svc.status==="TRIAL";
              const urgent=trial&&svc.daysLeft<=7;
              return (
                <div key={svc.key} onClick={()=>setSvcModal(svc)} style={{
                  padding:"14px",borderRadius:"10px",
                  border:`1px solid ${expired?"#fecaca":urgent?"#fde68a":active?"#e5e7eb":"#f0f0f0"}`,
                  background:active||expired?"#fff":"#fafafa",cursor:"pointer",transition:"all .15s",
                  opacity:active||expired?1:0.5,position:"relative",overflow:"hidden",
                }}
                  onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.06)";e.currentTarget.style.borderColor=m.color;}}
                  onMouseLeave={e=>{e.currentTarget.style.boxShadow="none";e.currentTarget.style.borderColor=expired?"#fecaca":urgent?"#fde68a":active?"#e5e7eb":"#f0f0f0";}}
                >
                  {(urgent||expired)&&<div style={{ position:"absolute",top:0,left:0,right:0,height:"2px",background:expired?"#ef4444":"#f59e0b" }}/>}
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"8px" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:"8px" }}>
                      <span style={{ fontSize:"18px" }}>{m.emoji}</span>
                      <span style={{ fontWeight:700,fontSize:"13px",color:"#111" }}>{m.name}</span>
                    </div>
                    <StatusBadge status={svc.status} small />
                  </div>
                  {(active||expired)&&svc.renewDate&&(
                    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"4px" }}>
                      <span style={{ fontSize:"10px",color:"#888",display:"flex",alignItems:"center",gap:"3px" }}><Icons.Calendar /> {expired?"Scaduto":"Rinnovo"}</span>
                      <span style={{ fontSize:"11px",fontWeight:600,color:expired?"#dc2626":"#333" }}>{new Date(svc.renewDate).toLocaleDateString("it-IT")}</span>
                    </div>
                  )}
                  {svc.payMethod&&(
                    <span style={{ display:"inline-flex",alignItems:"center",gap:"2px",padding:"1px 6px",borderRadius:"3px",fontSize:"9px",fontWeight:600,background:svc.payMethod==="stripe"?"#ede9fe":"#fef3c7",color:svc.payMethod==="stripe"?"#5b21b6":"#92400e" }}>
                      {svc.payMethod==="stripe"?"💳 Stripe":"🏦 Bonifico"}
                    </span>
                  )}
                  {trial&&(
                    <div style={{ marginTop:"6px" }}>
                      <div style={{ height:"4px",background:"#e5e7eb",borderRadius:"2px",overflow:"hidden" }}>
                        <div style={{ height:"100%",borderRadius:"2px",width:`${Math.max(5,Math.min(100,(svc.daysLeft/30)*100))}%`,background:urgent?"#f59e0b":"#10b981" }}/>
                      </div>
                      <div style={{ fontSize:"9px",color:urgent?"#d97706":"#888",marginTop:"2px" }}>{svc.daysLeft}gg rimanenti</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab==="info"&&(
          <div>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px" }}>
              <span style={{ fontSize:"13px",fontWeight:700,color:"#111" }}>Informazioni</span>
              <button onClick={()=>setEditInfo(!editInfo)} style={{ padding:"5px 12px",borderRadius:"6px",border:"1px solid #d1d5db",background:"#fff",cursor:"pointer",fontSize:"11px",fontWeight:600,color:editInfo?"#dc2626":"#555",display:"flex",alignItems:"center",gap:"4px" }}>
                {editInfo?<><Icons.X /> Annulla</>:<><Icons.Edit /> Modifica</>}
              </button>
            </div>
            <div style={{ padding:"14px",borderRadius:"10px",background:"#fff",border:"1px solid #e5e7eb" }}>
              {[{l:"Nome",f:"name",i:"🏪"},{l:"Email",f:"email",i:"📧"},{l:"Telefono",f:"phone",i:"📱"},{l:"P.IVA",f:"piva",i:"🧾"}].map(({l,f,i})=>(
                <div key={f} style={{ display:"flex",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #f5f5f5" }}>
                  <span style={{ width:"26px",fontSize:"14px" }}>{i}</span>
                  <span style={{ width:"90px",fontSize:"11px",fontWeight:600,color:"#888" }}>{l}</span>
                  {editInfo?(
                    <input value={editData[f]||""} onChange={e=>setEditData({...editData,[f]:e.target.value})} style={{ flex:1,padding:"5px 8px",borderRadius:"5px",border:"1px solid #d1d5db",fontSize:"12px",outline:"none" }}/>
                  ):(
                    <span style={{ fontSize:"13px",color:"#111",fontWeight:500 }}>{client[f]||"—"}</span>
                  )}
                </div>
              ))}
            </div>
            {editInfo&&(
              <div style={{ marginTop:"12px",display:"flex",justifyContent:"flex-end" }}>
                <button onClick={()=>setEditInfo(false)} style={{ padding:"7px 16px",borderRadius:"7px",border:"none",background:"#0d9488",color:"#fff",cursor:"pointer",fontSize:"12px",fontWeight:600 }}>Salva</button>
              </div>
            )}
            <div style={{ marginTop:"20px" }}>
              <span style={{ fontSize:"13px",fontWeight:700,color:"#111",marginBottom:"10px",display:"block" }}>Organizzazione</span>
              <div style={{ padding:"12px 14px",borderRadius:"10px",border:"1px solid #e5e7eb",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                {client.orgName?(
                  <div style={{ display:"flex",alignItems:"center",gap:"8px" }}>
                    <div style={{ width:"30px",height:"30px",borderRadius:"7px",background:"#ede9fe",display:"flex",alignItems:"center",justifyContent:"center",color:"#7c3aed",fontWeight:700,fontSize:"12px" }}>{client.orgName[0]}</div>
                    <span style={{ fontWeight:600,fontSize:"13px" }}>{client.orgName}</span>
                  </div>
                ):(
                  <span style={{ fontSize:"12px",color:"#aaa" }}>Nessuna organizzazione</span>
                )}
                <button onClick={()=>setOrgModal(true)} style={{ padding:"5px 10px",borderRadius:"6px",border:"1px solid #d1d5db",background:"#fff",cursor:"pointer",fontSize:"11px",fontWeight:600,color:"#555" }}>
                  {client.orgName?"Cambia":"Assegna"}
                </button>
              </div>
            </div>
          </div>
        )}

        {tab==="membri"&&(
          <div>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px" }}>
              <span style={{ fontSize:"13px",fontWeight:700,color:"#111" }}>Membri ({client.members.length})</span>
              <button onClick={()=>setMemberModal(true)} style={{ padding:"6px 12px",borderRadius:"7px",border:"none",background:"#0d9488",color:"#fff",cursor:"pointer",fontSize:"11px",fontWeight:600,display:"flex",alignItems:"center",gap:"4px" }}>
                <Icons.UserPlus /> Aggiungi
              </button>
            </div>
            {client.members.map((m,i)=>(
              <div key={i} style={{ padding:"12px 14px",borderRadius:"10px",border:"1px solid #e5e7eb",marginBottom:"6px",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                <div style={{ display:"flex",alignItems:"center",gap:"10px" }}>
                  <div style={{ width:"34px",height:"34px",borderRadius:"8px",background:m.role==="owner"?"#fef3c7":"#f3f4f6",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:"13px",color:m.role==="owner"?"#92400e":"#888" }}>{m.name[0]}</div>
                  <div>
                    <div style={{ fontWeight:600,fontSize:"13px",color:"#111" }}>{m.name}</div>
                    <div style={{ fontSize:"11px",color:"#888" }}>{m.email}</div>
                  </div>
                </div>
                <div style={{ display:"flex",alignItems:"center",gap:"8px" }}>
                  <span style={{ padding:"2px 8px",borderRadius:"5px",fontSize:"10px",fontWeight:700,textTransform:"uppercase",background:m.role==="owner"?"#fef3c7":m.role==="admin"?"#dbeafe":"#f3f4f6",color:m.role==="owner"?"#92400e":m.role==="admin"?"#1e40af":"#888" }}>{m.role}</span>
                  {m.role!=="owner"&&(
                    <button style={{ width:"26px",height:"26px",borderRadius:"5px",border:"1px solid #fecaca",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#ef4444" }}><Icons.Trash /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab==="clienti"&&isAgency&&(
          <div>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px" }}>
              <span style={{ fontSize:"13px",fontWeight:700,color:"#111" }}>Clienti gestiti ({client.managedClients?.length||0})</span>
              <button style={{ padding:"6px 12px",borderRadius:"7px",border:"none",background:"#7c3aed",color:"#fff",cursor:"pointer",fontSize:"11px",fontWeight:600,display:"flex",alignItems:"center",gap:"4px" }}>
                <Icons.Link /> Associa
              </button>
            </div>
            {(client.managedClients||[]).map(cId=>{
              const c=clientsData.find(x=>x.id===cId);
              if(!c)return null;
              const ca=c.services.filter(s=>s.status!=="INACTIVE");
              return (
                <div key={cId} style={{ padding:"12px 14px",borderRadius:"10px",border:"1px solid #e5e7eb",marginBottom:"6px",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:"10px" }}>
                    <div style={{ width:"34px",height:"34px",borderRadius:"8px",background:"linear-gradient(135deg,#0d9488,#0f766e)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:"12px" }}>{c.name[0]}</div>
                    <div>
                      <div style={{ fontWeight:600,fontSize:"13px",color:"#111" }}>{c.name}</div>
                      <div style={{ fontSize:"11px",color:"#888" }}>{c.email}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex",alignItems:"center",gap:"6px" }}>
                    {ca.map(s=><StatusBadge key={s.key} status={s.status} small />)}
                    <button style={{ width:"26px",height:"26px",borderRadius:"5px",border:"1px solid #e5e7eb",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#ef4444" }} title="Dissocia"><Icons.Unlink /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modali */}
      {svcModal&&<ServiceModal service={svcModal} client={client} onClose={()=>setSvcModal(null)} onSave={()=>{}} />}
      {orgModal&&<AssignOrgModal client={client} onClose={()=>setOrgModal(false)} />}
      {resetModal&&<ResetModal client={client} onClose={()=>setResetModal(false)} />}
      {memberModal&&<AddMemberModal client={client} onClose={()=>setMemberModal(false)} />}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPALE — Layout fedele a DOID Suite attuale
// ═══════════════════════════════════════════════════════════════
export default function AdminPanel() {
  const [selectedClient, setSelectedClient] = useState(null);
  const [filter, setFilter] = useState("tutti");
  const [search, setSearch] = useState("");
  const [adminTab, setAdminTab] = useState("clienti");

  const filtered = clientsData.filter(c => {
    const ms = c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    if (filter === "agenzie") return ms && c.type === "agency";
    if (filter === "singoli") return ms && c.type === "single";
    return ms;
  });

  const agencyCount = clientsData.filter(c => c.type === "agency").length;
  const singleCount = clientsData.filter(c => c.type === "single").length;

  return (
    <div style={{ width:"100%",height:"100vh",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",display:"flex",flexDirection:"column",background:"#f5f5f5",overflow:"hidden" }}>

      {/* ═══ TOP BAR ═══ */}
      <div style={{ height:"52px",background:"#fff",borderBottom:"1px solid #e5e7eb",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",flexShrink:0,zIndex:10 }}>
        <div style={{ display:"flex",alignItems:"center",gap:"8px" }}>
          <div style={{ width:"26px",height:"26px",borderRadius:"7px",background:"linear-gradient(135deg,#0d9488,#14b8a6)",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <span style={{ color:"#fff",fontWeight:900,fontSize:"12px" }}>D</span>
          </div>
          <span style={{ fontWeight:800,fontSize:"14px",color:"#111" }}>DOID</span>
          <span style={{ fontWeight:400,fontSize:"14px",color:"#999" }}>Suite</span>
        </div>
        <div style={{ flex:1,maxWidth:"340px",margin:"0 40px" }}>
          <div style={{ position:"relative" }}>
            <div style={{ position:"absolute",left:"10px",top:"50%",transform:"translateY(-50%)",color:"#ccc" }}><Icons.Search /></div>
            <input placeholder="Cerca..." style={{ width:"100%",padding:"7px 10px 7px 34px",borderRadius:"8px",border:"1px solid #e5e7eb",fontSize:"12px",outline:"none",background:"#f9fafb",boxSizing:"border-box" }}/>
          </div>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:"16px" }}>
          <div style={{ position:"relative",cursor:"pointer",color:"#888" }}><Icons.Bell /><div style={{ position:"absolute",top:"-2px",right:"-4px",width:"8px",height:"8px",borderRadius:"50%",background:"#ef4444",border:"2px solid #fff" }}/></div>
          <div style={{ display:"flex",alignItems:"center",gap:"8px",cursor:"pointer" }}>
            <div style={{ width:"30px",height:"30px",borderRadius:"50%",background:"linear-gradient(135deg,#7c3aed,#6d28d9)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:"11px" }}>U</div>
            <div><div style={{ fontSize:"12px",fontWeight:600,color:"#111" }}>Utente</div><div style={{ fontSize:"10px",color:"#888" }}>Super Admin</div></div>
          </div>
        </div>
      </div>

      <div style={{ flex:1,display:"flex",overflow:"hidden" }}>

        {/* ═══ SIDEBAR ═══ */}
        <div style={{ width:"190px",background:"#fff",borderRight:"1px solid #e5e7eb",display:"flex",flexDirection:"column",flexShrink:0 }}>
          <div style={{ padding:"14px 14px 8px" }}>
            <div style={{ fontSize:"9px",fontWeight:600,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"4px" }}>Attività corrente</div>
            <div style={{ padding:"6px 10px",borderRadius:"6px",border:"1px solid #e5e7eb",fontSize:"12px",color:"#555",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
              attività admin <span style={{ fontSize:"10px" }}>▾</span>
            </div>
          </div>
          <div style={{ padding:"8px 10px" }}>
            <div style={{ fontSize:"9px",fontWeight:600,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.08em",padding:"0 6px",marginBottom:"4px" }}>Principale</div>
            {[
              { icon:<Icons.Dashboard />, label:"Dashboard" },
              { icon:<Icons.Star />, label:"I Miei Servizi" },
              { icon:<Icons.Activity />, label:"Attività" },
            ].map(item=>(
              <div key={item.label} style={{ display:"flex",alignItems:"center",gap:"8px",padding:"8px 10px",borderRadius:"7px",cursor:"pointer",fontSize:"12px",color:"#555",fontWeight:500 }}
                onMouseEnter={e=>e.currentTarget.style.background="#f5f5f5"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}
              >
                <span style={{ color:"#999" }}>{item.icon}</span>{item.label}
              </div>
            ))}
          </div>
          <div style={{ padding:"8px 10px" }}>
            {[
              { icon:<Icons.Settings />, label:"Impostazioni" },
              { icon:<Icons.HelpCircle />, label:"Supporto" },
            ].map(item=>(
              <div key={item.label} style={{ display:"flex",alignItems:"center",gap:"8px",padding:"8px 10px",borderRadius:"7px",cursor:"pointer",fontSize:"12px",color:"#555",fontWeight:500 }}
                onMouseEnter={e=>e.currentTarget.style.background="#f5f5f5"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}
              >
                <span style={{ color:"#999" }}>{item.icon}</span>{item.label}
              </div>
            ))}
          </div>
          <div style={{ marginTop:"auto",padding:"8px 10px",borderTop:"1px solid #f0f0f0" }}>
            <div style={{ fontSize:"9px",fontWeight:600,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.08em",padding:"0 6px",marginBottom:"4px" }}>Amministrazione</div>
            <div style={{ display:"flex",alignItems:"center",gap:"8px",padding:"8px 10px",borderRadius:"7px",cursor:"pointer",fontSize:"12px",fontWeight:600,color:"#0d9488",background:"#f0fdfa" }}>
              <span><Icons.Shield /></span>Pannello Admin
            </div>
          </div>
        </div>

        {/* ═══ AREA PRINCIPALE ═══ */}
        <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>

          {/* Header Pannello Amministrazione */}
          <div style={{ background:"linear-gradient(135deg,#1e1b4b 0%,#312e81 40%,#4338ca 100%)",padding:"24px 32px",flexShrink:0 }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
              <div style={{ display:"flex",alignItems:"center",gap:"14px" }}>
                <div style={{ width:"42px",height:"42px",borderRadius:"10px",background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                  <Icons.Shield />
                </div>
                <div>
                  <div style={{ color:"#fff",fontWeight:700,fontSize:"18px" }}>Pannello Amministrazione</div>
                  <div style={{ color:"rgba(255,255,255,0.6)",fontSize:"12px" }}>Gestione completa del sistema doID Suite</div>
                </div>
              </div>
              <button style={{ padding:"7px 16px",borderRadius:"8px",border:"1px solid rgba(255,255,255,0.25)",background:"rgba(255,255,255,0.1)",color:"#fff",cursor:"pointer",fontSize:"12px",fontWeight:600,display:"flex",alignItems:"center",gap:"5px",backdropFilter:"blur(4px)" }}>
                <Icons.RefreshCw /> Aggiorna
              </button>
            </div>
          </div>

          {/* Admin tabs */}
          <div style={{ display:"flex",gap:"0",padding:"0 32px",background:"#fff",borderBottom:"1px solid #e5e7eb",flexShrink:0 }}>
            {["Statistiche","Clienti","Riepilogo Piani","Eliminati","Piani Servizi","Pacchetti Agency","Comunicazioni"].map(t=>(
              <button key={t} onClick={()=>setAdminTab(t.toLowerCase())} style={{
                padding:"12px 16px",border:"none",background:"none",cursor:"pointer",
                fontSize:"12px",fontWeight:t==="Clienti"?700:500,
                color:t==="Clienti"?"#0d9488":"#888",
                borderBottom:`2px solid ${t==="Clienti"?"#0d9488":"transparent"}`,marginBottom:"-1px",
                transition:"all .12s",
              }}>{t}</button>
            ))}
          </div>

          {/* Contenuto Clienti */}
          <div style={{ flex:1,display:"flex",overflow:"hidden",background:"#f8f9fa" }}>

            {/* Lista clienti */}
            <div style={{ flex:selectedClient?0:1,width:selectedClient?"45%":"100%",maxWidth:selectedClient?"520px":"none",transition:"all .3s ease",overflow:"hidden",display:"flex",flexDirection:"column",background:"#fff" }}>
              <div style={{ padding:"18px 24px 10px",flexShrink:0 }}>
                <div style={{ display:"flex",alignItems:"center",gap:"10px",marginBottom:"14px" }}>
                  <div style={{ flex:1,position:"relative" }}>
                    <div style={{ position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",color:"#ccc" }}><Icons.Search /></div>
                    <input type="text" placeholder="Cerca clienti..." value={search} onChange={e=>setSearch(e.target.value)} style={{ width:"100%",padding:"9px 12px 9px 36px",borderRadius:"10px",border:"1px solid #e5e7eb",fontSize:"12px",outline:"none",background:"#f9fafb",boxSizing:"border-box" }}/>
                  </div>
                  <button style={{ padding:"8px 14px",borderRadius:"8px",border:"none",background:"#0d9488",color:"#fff",cursor:"pointer",fontSize:"11px",fontWeight:600,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:"4px" }}>
                    <Icons.Zap /> Assegna Servizio
                  </button>
                  <button style={{ padding:"8px 14px",borderRadius:"8px",border:"1px solid #111",background:"#111",color:"#fff",cursor:"pointer",fontSize:"11px",fontWeight:600,whiteSpace:"nowrap" }}>
                    + Nuovo Cliente
                  </button>
                </div>
                <div style={{ display:"flex",gap:"6px" }}>
                  {[
                    { k:"tutti", l:`Tutti (${clientsData.length})` },
                    { k:"agenzie", l:`Agenzie (${agencyCount})` },
                    { k:"singoli", l:`Singoli (${singleCount})` },
                  ].map(f=>(
                    <button key={f.k} onClick={()=>setFilter(f.k)} style={{
                      padding:"5px 12px",borderRadius:"18px",fontSize:"11px",fontWeight:600,cursor:"pointer",transition:"all .12s",
                      background:filter===f.k?"#f0f0f0":"#fff",color:filter===f.k?"#111":"#888",
                      border:`1px solid ${filter===f.k?"#ccc":"#e5e7eb"}`,
                    }}>{f.l}</button>
                  ))}
                </div>
              </div>

              <div style={{ flex:1,overflow:"auto",padding:"0 16px 16px" }}>
                {filtered.map(c=>{
                  const active=c.services.filter(s=>s.status!=="INACTIVE");
                  const hasIssue=c.services.some(s=>s.status==="EXPIRED"||( s.status==="TRIAL"&&s.daysLeft<=7));
                  const selected=selectedClient?.id===c.id;
                  return (
                    <div key={c.id} onClick={()=>setSelectedClient(c)} style={{
                      display:"flex",alignItems:"center",padding:"12px 14px",borderRadius:"10px",marginBottom:"2px",
                      cursor:"pointer",transition:"all .12s",
                      background:selected?"#f0fdfa":"transparent",
                      border:`1px solid ${selected?"#99f6e4":"transparent"}`,
                    }}
                      onMouseEnter={e=>{if(!selected)e.currentTarget.style.background="#fafafa";}}
                      onMouseLeave={e=>{if(!selected)e.currentTarget.style.background="transparent";}}
                    >
                      {/* Chevron expand per agenzie */}
                      <span style={{ width:"20px",color:"#ccc",flexShrink:0 }}>
                        {c.type==="agency"&&<Icons.ChevronRight />}
                      </span>
                      <div style={{
                        width:"34px",height:"34px",borderRadius:"8px",flexShrink:0,marginRight:"10px",
                        background:c.type==="agency"?"linear-gradient(135deg,#7c3aed,#6d28d9)":"linear-gradient(135deg,#0d9488,#0f766e)",
                        display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:"12px",
                      }}>{c.type==="agency"?<Icons.Building />:c.name[0]}</div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ display:"flex",alignItems:"center",gap:"6px" }}>
                          <span style={{ fontWeight:600,fontSize:"13px",color:"#111",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{c.name}</span>
                          {c.type==="agency"&&<span style={{ padding:"1px 5px",borderRadius:"3px",fontSize:"9px",fontWeight:700,background:"#ede9fe",color:"#7c3aed" }}>Agenzia</span>}
                        </div>
                        <div style={{ fontSize:"11px",color:"#aaa",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{c.email}</div>
                      </div>
                      <div style={{ display:"flex",alignItems:"center",gap:"8px",flexShrink:0 }}>
                        <span style={{ padding:"2px 8px",borderRadius:"10px",fontSize:"10px",fontWeight:600,background:"#dcfce7",color:"#166534",display:"flex",alignItems:"center",gap:"3px" }}>
                          <Icons.Check /> Attivo
                        </span>
                        <span style={{ fontSize:"10px",color:"#aaa" }}>
                          {c.activities} attività
                        </span>
                        {hasIssue&&<span style={{ color:"#ef4444" }}><Icons.AlertTriangle /></span>}
                        <span style={{ color:"#ccc" }}><Icons.ExternalLink /></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dettaglio cliente */}
            {selectedClient && (
              <div style={{ flex:1,minWidth:0,overflow:"hidden" }}>
                <ClientDetail client={selectedClient} onClose={()=>setSelectedClient(null)} />
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)scale(.98)} to{opacity:1;transform:translateY(0)scale(1)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#ddd;border-radius:3px}
        input:focus{border-color:#0d9488!important;box-shadow:0 0 0 2px rgba(13,148,136,0.08)}
        button:active{transform:scale(.97)}
      `}</style>
    </div>
  );
}
