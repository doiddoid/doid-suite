/**
 * DOID Suite Sidebar SDK
 * Componente standalone per integrare la sidebar Suite in qualsiasi app DOID
 *
 * Utilizzo:
 *   <script src="https://suite.doid.it/sdk/doid-sidebar.min.js"></script>
 *   <script>
 *     DOIDSidebar.init({
 *       apiUrl: 'https://suite-api.doid.it',
 *       token: 'sso_token_here',
 *       currentService: 'smart_review',
 *       activityId: 'uuid-here'
 *     });
 *   </script>
 */

(function(window, document) {
  'use strict';

  // ============================================
  // CONFIGURAZIONE
  // ============================================

  const DEFAULT_CONFIG = {
    apiUrl: 'https://suite-api.doid.it',
    suiteUrl: 'https://suite.doid.it',
    position: 'right',
    theme: 'light',
    expandedWidth: '320px',
    collapsedWidth: '60px',
    zIndex: 9999,
    autoHide: false,
    showNotifications: true,
    showActivitySwitcher: true,
    showServiceNav: true,
    currentService: null,
    activityId: null,
    token: null,
    onReady: null,
    onError: null,
    onActivityChange: null,
    onServiceChange: null
  };

  // Definizione servizi DOID
  const DOID_SERVICES = {
    smart_review: {
      name: 'Smart Review',
      icon: 'star',
      color: '#F59E0B',
      url: 'https://review.doid.it'
    },
    smart_page: {
      name: 'Smart Page',
      icon: 'user',
      color: '#3B82F6',
      url: 'https://page.doid.it'
    },
    menu_digitale: {
      name: 'Menu Digitale',
      icon: 'utensils',
      color: '#10B981',
      url: 'https://menu.doid.it'
    },
    display_suite: {
      name: 'Display Suite',
      icon: 'tv',
      color: '#8B5CF6',
      url: 'https://display.doid.it'
    }
  };

  // ============================================
  // ICONE SVG
  // ============================================

  const ICONS = {
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    chevronLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15,18 9,12 15,6"/></svg>',
    chevronRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9,18 15,12 9,6"/></svg>',
    chevronDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6,9 12,15 18,9"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    utensils: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>',
    tv: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17,2 12,7 7,2"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
    building: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20,6 9,17 4,12"/></svg>',
    externalLink: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23,4 23,10 17,10"/><polyline points="1,20 1,14 7,14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
    loader: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>'
  };

  // ============================================
  // STILI CSS
  // ============================================

  const STYLES = `
    /* DOID Sidebar Reset & Base */
    .doid-sidebar * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    .doid-sidebar {
      position: fixed;
      top: 0;
      height: 100vh;
      background: var(--doid-bg, #ffffff);
      color: var(--doid-text, #1f2937);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      z-index: var(--doid-z-index, 9999);
      transition: width 0.3s ease, transform 0.3s ease;
      box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
    }

    .doid-sidebar.doid-sidebar--right {
      right: 0;
      border-left: 1px solid var(--doid-border, #e5e7eb);
    }

    .doid-sidebar.doid-sidebar--left {
      left: 0;
      border-right: 1px solid var(--doid-border, #e5e7eb);
    }

    .doid-sidebar.doid-sidebar--collapsed {
      width: var(--doid-collapsed-width, 60px);
    }

    .doid-sidebar.doid-sidebar--expanded {
      width: var(--doid-expanded-width, 320px);
    }

    .doid-sidebar.doid-sidebar--hidden {
      transform: translateX(100%);
    }

    .doid-sidebar.doid-sidebar--left.doid-sidebar--hidden {
      transform: translateX(-100%);
    }

    /* Dark Theme */
    .doid-sidebar.doid-sidebar--dark {
      --doid-bg: #1f2937;
      --doid-bg-hover: #374151;
      --doid-bg-active: #4b5563;
      --doid-text: #f9fafb;
      --doid-text-muted: #9ca3af;
      --doid-border: #374151;
      --doid-primary: #3b82f6;
      --doid-primary-hover: #2563eb;
    }

    /* Light Theme */
    .doid-sidebar.doid-sidebar--light {
      --doid-bg: #ffffff;
      --doid-bg-hover: #f3f4f6;
      --doid-bg-active: #e5e7eb;
      --doid-text: #1f2937;
      --doid-text-muted: #6b7280;
      --doid-border: #e5e7eb;
      --doid-primary: #3b82f6;
      --doid-primary-hover: #2563eb;
    }

    /* Header */
    .doid-sidebar__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-bottom: 1px solid var(--doid-border);
      min-height: 64px;
    }

    .doid-sidebar__logo {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 600;
      font-size: 16px;
      color: var(--doid-text);
      text-decoration: none;
    }

    .doid-sidebar__logo-icon {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: 14px;
    }

    .doid-sidebar__logo-text {
      opacity: 1;
      transition: opacity 0.2s;
    }

    .doid-sidebar--collapsed .doid-sidebar__logo-text {
      opacity: 0;
      width: 0;
      overflow: hidden;
    }

    .doid-sidebar__toggle {
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      border-radius: 6px;
      color: var(--doid-text-muted);
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .doid-sidebar__toggle:hover {
      background: var(--doid-bg-hover);
      color: var(--doid-text);
    }

    .doid-sidebar__toggle svg {
      width: 20px;
      height: 20px;
    }

    /* Content */
    .doid-sidebar__content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }

    /* Section */
    .doid-sidebar__section {
      margin-bottom: 24px;
    }

    .doid-sidebar__section-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--doid-text-muted);
      margin-bottom: 8px;
      padding: 0 8px;
      white-space: nowrap;
      overflow: hidden;
    }

    .doid-sidebar--collapsed .doid-sidebar__section-title {
      text-align: center;
      padding: 0;
    }

    /* Activity Selector */
    .doid-sidebar__activity-selector {
      position: relative;
    }

    .doid-sidebar__activity-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: var(--doid-bg-hover);
      border: 1px solid var(--doid-border);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
    }

    .doid-sidebar__activity-btn:hover {
      border-color: var(--doid-primary);
    }

    .doid-sidebar__activity-avatar {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background: var(--doid-primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 16px;
      flex-shrink: 0;
    }

    .doid-sidebar__activity-info {
      flex: 1;
      min-width: 0;
      overflow: hidden;
    }

    .doid-sidebar__activity-name {
      font-weight: 600;
      color: var(--doid-text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .doid-sidebar__activity-type {
      font-size: 12px;
      color: var(--doid-text-muted);
    }

    .doid-sidebar__activity-chevron {
      color: var(--doid-text-muted);
      transition: transform 0.2s;
    }

    .doid-sidebar__activity-chevron svg {
      width: 16px;
      height: 16px;
    }

    .doid-sidebar__activity-selector.doid-sidebar__activity-selector--open
    .doid-sidebar__activity-chevron {
      transform: rotate(180deg);
    }

    .doid-sidebar--collapsed .doid-sidebar__activity-info,
    .doid-sidebar--collapsed .doid-sidebar__activity-chevron {
      display: none;
    }

    /* Activity Dropdown */
    .doid-sidebar__activity-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      background: var(--doid-bg);
      border: 1px solid var(--doid-border);
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      z-index: 10;
      max-height: 300px;
      overflow-y: auto;
      display: none;
    }

    .doid-sidebar__activity-selector--open .doid-sidebar__activity-dropdown {
      display: block;
    }

    .doid-sidebar__activity-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      cursor: pointer;
      transition: background 0.2s;
      border-bottom: 1px solid var(--doid-border);
    }

    .doid-sidebar__activity-item:last-child {
      border-bottom: none;
    }

    .doid-sidebar__activity-item:hover {
      background: var(--doid-bg-hover);
    }

    .doid-sidebar__activity-item--active {
      background: var(--doid-bg-active);
    }

    .doid-sidebar__activity-item-check {
      width: 20px;
      height: 20px;
      color: var(--doid-primary);
      margin-left: auto;
    }

    .doid-sidebar__activity-item-check svg {
      width: 20px;
      height: 20px;
    }

    /* Service Navigation */
    .doid-sidebar__nav {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .doid-sidebar__nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
      color: var(--doid-text);
      border: none;
      background: none;
      width: 100%;
      text-align: left;
      font-size: 14px;
    }

    .doid-sidebar__nav-item:hover {
      background: var(--doid-bg-hover);
    }

    .doid-sidebar__nav-item--active {
      background: var(--doid-bg-active);
      font-weight: 500;
    }

    .doid-sidebar__nav-icon {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .doid-sidebar__nav-icon svg {
      width: 20px;
      height: 20px;
    }

    .doid-sidebar__nav-icon--colored {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      color: white;
    }

    .doid-sidebar__nav-text {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .doid-sidebar--collapsed .doid-sidebar__nav-text {
      display: none;
    }

    .doid-sidebar__nav-badge {
      background: #ef4444;
      color: white;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 10px;
      min-width: 18px;
      text-align: center;
    }

    .doid-sidebar--collapsed .doid-sidebar__nav-badge {
      position: absolute;
      top: 4px;
      right: 4px;
      padding: 1px 4px;
      font-size: 10px;
    }

    .doid-sidebar__nav-external {
      color: var(--doid-text-muted);
      opacity: 0;
      transition: opacity 0.2s;
    }

    .doid-sidebar__nav-external svg {
      width: 14px;
      height: 14px;
    }

    .doid-sidebar__nav-item:hover .doid-sidebar__nav-external {
      opacity: 1;
    }

    /* Footer */
    .doid-sidebar__footer {
      border-top: 1px solid var(--doid-border);
      padding: 16px;
    }

    .doid-sidebar__user {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .doid-sidebar__user:hover {
      background: var(--doid-bg-hover);
    }

    .doid-sidebar__user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--doid-primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
      flex-shrink: 0;
    }

    .doid-sidebar__user-info {
      flex: 1;
      min-width: 0;
    }

    .doid-sidebar__user-name {
      font-weight: 500;
      color: var(--doid-text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .doid-sidebar__user-email {
      font-size: 12px;
      color: var(--doid-text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .doid-sidebar--collapsed .doid-sidebar__user-info {
      display: none;
    }

    /* User Menu */
    .doid-sidebar__user-menu {
      position: absolute;
      bottom: 80px;
      left: 16px;
      right: 16px;
      background: var(--doid-bg);
      border: 1px solid var(--doid-border);
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      z-index: 10;
      display: none;
    }

    .doid-sidebar__user-menu--open {
      display: block;
    }

    .doid-sidebar__user-menu-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      cursor: pointer;
      transition: background 0.2s;
      color: var(--doid-text);
      text-decoration: none;
      border: none;
      background: none;
      width: 100%;
      text-align: left;
      font-size: 14px;
    }

    .doid-sidebar__user-menu-item:hover {
      background: var(--doid-bg-hover);
    }

    .doid-sidebar__user-menu-item--danger {
      color: #ef4444;
    }

    .doid-sidebar__user-menu-item svg {
      width: 18px;
      height: 18px;
    }

    /* Loading */
    .doid-sidebar__loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      color: var(--doid-text-muted);
    }

    .doid-sidebar__loading svg {
      width: 32px;
      height: 32px;
      animation: doid-spin 1s linear infinite;
    }

    .doid-sidebar__loading-text {
      margin-top: 12px;
      font-size: 13px;
    }

    @keyframes doid-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Error */
    .doid-sidebar__error {
      padding: 20px;
      text-align: center;
      color: #ef4444;
    }

    .doid-sidebar__error-text {
      font-size: 13px;
      margin-bottom: 12px;
    }

    .doid-sidebar__error-btn {
      background: var(--doid-primary);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      transition: background 0.2s;
    }

    .doid-sidebar__error-btn:hover {
      background: var(--doid-primary-hover);
    }

    /* Floating Button (quando sidebar è nascosta) */
    .doid-sidebar-fab {
      position: fixed;
      bottom: 20px;
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      border: none;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      transition: all 0.3s;
      z-index: var(--doid-z-index, 9999);
    }

    .doid-sidebar-fab--right {
      right: 20px;
    }

    .doid-sidebar-fab--left {
      left: 20px;
    }

    .doid-sidebar-fab:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
    }

    .doid-sidebar-fab svg {
      width: 24px;
      height: 24px;
    }

    .doid-sidebar-fab--hidden {
      transform: scale(0);
      opacity: 0;
    }

    /* Tooltip per collapsed state */
    .doid-sidebar__tooltip {
      position: absolute;
      left: calc(100% + 10px);
      background: var(--doid-text);
      color: var(--doid-bg);
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 12px;
      white-space: nowrap;
      opacity: 0;
      visibility: hidden;
      transition: all 0.2s;
      z-index: 100;
    }

    .doid-sidebar--left .doid-sidebar__tooltip {
      left: auto;
      right: calc(100% + 10px);
    }

    .doid-sidebar--collapsed .doid-sidebar__nav-item:hover .doid-sidebar__tooltip {
      opacity: 1;
      visibility: visible;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .doid-sidebar.doid-sidebar--expanded {
        width: 100%;
        max-width: 320px;
      }
    }
  `;

  // ============================================
  // CLASSE PRINCIPALE
  // ============================================

  class DOIDSidebar {
    constructor() {
      this.config = { ...DEFAULT_CONFIG };
      this.state = {
        isExpanded: true,
        isHidden: false,
        isLoading: true,
        error: null,
        user: null,
        activities: [],
        currentActivity: null,
        subscriptions: [],
        notifications: [],
        userMenuOpen: false,
        activityDropdownOpen: false
      };
      this.elements = {};
      this.initialized = false;
    }

    // ============================================
    // INIZIALIZZAZIONE
    // ============================================

    async init(options = {}) {
      if (this.initialized) {
        console.warn('DOIDSidebar: Already initialized');
        return this;
      }

      // Merge config
      this.config = { ...this.config, ...options };

      // Validazione
      if (!this.config.token) {
        console.error('DOIDSidebar: Token is required');
        return this;
      }

      // Inietta stili
      this.injectStyles();

      // Crea elementi DOM
      this.createElements();

      // Carica dati
      await this.loadData();

      // Event listeners
      this.bindEvents();

      this.initialized = true;

      // Callback onReady
      if (typeof this.config.onReady === 'function') {
        this.config.onReady(this);
      }

      return this;
    }

    injectStyles() {
      if (document.getElementById('doid-sidebar-styles')) return;

      const style = document.createElement('style');
      style.id = 'doid-sidebar-styles';
      style.textContent = STYLES;
      document.head.appendChild(style);
    }

    createElements() {
      // Rimuovi elementi esistenti
      const existing = document.querySelector('.doid-sidebar');
      if (existing) existing.remove();

      const existingFab = document.querySelector('.doid-sidebar-fab');
      if (existingFab) existingFab.remove();

      // Crea sidebar
      const sidebar = document.createElement('aside');
      sidebar.className = `doid-sidebar doid-sidebar--${this.config.position} doid-sidebar--${this.config.theme} doid-sidebar--expanded`;
      sidebar.style.setProperty('--doid-expanded-width', this.config.expandedWidth);
      sidebar.style.setProperty('--doid-collapsed-width', this.config.collapsedWidth);
      sidebar.style.setProperty('--doid-z-index', this.config.zIndex);

      sidebar.innerHTML = `
        <header class="doid-sidebar__header">
          <a href="${this.config.suiteUrl}" class="doid-sidebar__logo" target="_blank">
            <div class="doid-sidebar__logo-icon">D</div>
            <span class="doid-sidebar__logo-text">DOID Suite</span>
          </a>
          <button class="doid-sidebar__toggle" title="Toggle sidebar">
            ${ICONS.chevronRight}
          </button>
        </header>
        <div class="doid-sidebar__content">
          <div class="doid-sidebar__loading">
            ${ICONS.loader}
            <span class="doid-sidebar__loading-text">Caricamento...</span>
          </div>
        </div>
        <footer class="doid-sidebar__footer">
          <div class="doid-sidebar__user">
            <div class="doid-sidebar__user-avatar">?</div>
            <div class="doid-sidebar__user-info">
              <div class="doid-sidebar__user-name">Caricamento...</div>
              <div class="doid-sidebar__user-email"></div>
            </div>
          </div>
          <div class="doid-sidebar__user-menu">
            <a href="${this.config.suiteUrl}/settings" class="doid-sidebar__user-menu-item" target="_blank">
              ${ICONS.settings}
              <span>Impostazioni</span>
            </a>
            <button class="doid-sidebar__user-menu-item doid-sidebar__user-menu-item--danger" data-action="logout">
              ${ICONS.logout}
              <span>Esci</span>
            </button>
          </div>
        </footer>
      `;

      document.body.appendChild(sidebar);
      this.elements.sidebar = sidebar;
      this.elements.content = sidebar.querySelector('.doid-sidebar__content');
      this.elements.toggle = sidebar.querySelector('.doid-sidebar__toggle');
      this.elements.user = sidebar.querySelector('.doid-sidebar__user');
      this.elements.userMenu = sidebar.querySelector('.doid-sidebar__user-menu');
      this.elements.userAvatar = sidebar.querySelector('.doid-sidebar__user-avatar');
      this.elements.userName = sidebar.querySelector('.doid-sidebar__user-name');
      this.elements.userEmail = sidebar.querySelector('.doid-sidebar__user-email');

      // Crea FAB (Floating Action Button)
      const fab = document.createElement('button');
      fab.className = `doid-sidebar-fab doid-sidebar-fab--${this.config.position} doid-sidebar-fab--hidden`;
      fab.innerHTML = ICONS.menu;
      fab.title = 'Apri DOID Suite';
      document.body.appendChild(fab);
      this.elements.fab = fab;
    }

    // ============================================
    // CARICAMENTO DATI
    // ============================================

    async loadData() {
      this.state.isLoading = true;
      this.state.error = null;

      try {
        // Chiama l'API SSO per ottenere tutti i dati
        const response = await this.apiCall('/api/external/sso/authenticate', {
          method: 'POST',
          body: JSON.stringify({ token: this.config.token })
        });

        if (!response.success) {
          throw new Error(response.error || 'Autenticazione fallita');
        }

        const data = response.data;

        // Aggiorna stato
        this.state.user = data.user;
        this.state.currentActivity = data.activity;
        this.state.subscriptions = data.license?.subscriptions || [];

        // Carica lista attività
        await this.loadActivities();

        // Render UI
        this.render();

      } catch (error) {
        console.error('DOIDSidebar: Error loading data', error);
        this.state.error = error.message;
        this.renderError();

        if (typeof this.config.onError === 'function') {
          this.config.onError(error);
        }
      } finally {
        this.state.isLoading = false;
      }
    }

    async loadActivities() {
      try {
        const response = await this.apiCall('/api/activities', {
          headers: {
            'Authorization': `Bearer ${this.config.token}`
          }
        });

        if (response.success) {
          this.state.activities = response.data || [];
        }
      } catch (error) {
        console.warn('DOIDSidebar: Could not load activities', error);
        // Non bloccare se fallisce
      }
    }

    async apiCall(endpoint, options = {}) {
      const url = `${this.config.apiUrl}${endpoint}`;

      const defaultOptions = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const fetchOptions = { ...defaultOptions, ...options };
      fetchOptions.headers = { ...defaultOptions.headers, ...options.headers };

      const response = await fetch(url, fetchOptions);
      return response.json();
    }

    // ============================================
    // RENDERING
    // ============================================

    render() {
      if (!this.elements.content) return;

      // Aggiorna info utente
      if (this.state.user) {
        const initials = this.getInitials(this.state.user.fullName || this.state.user.email);
        this.elements.userAvatar.textContent = initials;
        this.elements.userName.textContent = this.state.user.fullName || 'Utente';
        this.elements.userEmail.textContent = this.state.user.email || '';
      }

      // Costruisci contenuto
      let html = '';

      // Sezione Attività
      if (this.config.showActivitySwitcher && this.state.currentActivity) {
        html += this.renderActivitySelector();
      }

      // Sezione Servizi
      if (this.config.showServiceNav) {
        html += this.renderServiceNav();
      }

      // Sezione Notifiche
      if (this.config.showNotifications && this.state.notifications.length > 0) {
        html += this.renderNotifications();
      }

      this.elements.content.innerHTML = html;

      // Bind eventi dinamici
      this.bindDynamicEvents();
    }

    renderActivitySelector() {
      const activity = this.state.currentActivity;
      const initials = this.getInitials(activity.name);

      let dropdownItems = '';
      this.state.activities.forEach(act => {
        const isActive = act.id === activity.id;
        const actInitials = this.getInitials(act.name);
        dropdownItems += `
          <div class="doid-sidebar__activity-item ${isActive ? 'doid-sidebar__activity-item--active' : ''}"
               data-activity-id="${act.id}">
            <div class="doid-sidebar__activity-avatar">${actInitials}</div>
            <div class="doid-sidebar__activity-info">
              <div class="doid-sidebar__activity-name">${this.escapeHtml(act.name)}</div>
            </div>
            ${isActive ? `<div class="doid-sidebar__activity-item-check">${ICONS.check}</div>` : ''}
          </div>
        `;
      });

      return `
        <div class="doid-sidebar__section">
          <div class="doid-sidebar__section-title">Attività</div>
          <div class="doid-sidebar__activity-selector">
            <button class="doid-sidebar__activity-btn" data-action="toggle-activity-dropdown">
              <div class="doid-sidebar__activity-avatar">${initials}</div>
              <div class="doid-sidebar__activity-info">
                <div class="doid-sidebar__activity-name">${this.escapeHtml(activity.name)}</div>
                <div class="doid-sidebar__activity-type">${activity.email || ''}</div>
              </div>
              <div class="doid-sidebar__activity-chevron">${ICONS.chevronDown}</div>
            </button>
            <div class="doid-sidebar__activity-dropdown">
              ${dropdownItems}
            </div>
          </div>
        </div>
      `;
    }

    renderServiceNav() {
      let html = `
        <div class="doid-sidebar__section">
          <div class="doid-sidebar__section-title">Servizi</div>
          <nav class="doid-sidebar__nav">
            <a href="${this.config.suiteUrl}" class="doid-sidebar__nav-item" target="_blank">
              <div class="doid-sidebar__nav-icon">${ICONS.home}</div>
              <span class="doid-sidebar__nav-text">Dashboard</span>
              <span class="doid-sidebar__nav-external">${ICONS.externalLink}</span>
              <span class="doid-sidebar__tooltip">Dashboard</span>
            </a>
      `;

      // Aggiungi servizi attivi
      for (const [code, service] of Object.entries(DOID_SERVICES)) {
        const isActive = code === this.config.currentService;
        const hasSubscription = this.state.subscriptions.some(s => s.serviceCode === code);

        if (!hasSubscription && !isActive) continue;

        html += `
          <a href="${service.url}" class="doid-sidebar__nav-item ${isActive ? 'doid-sidebar__nav-item--active' : ''}"
             ${isActive ? '' : 'target="_blank"'}
             data-service="${code}">
            <div class="doid-sidebar__nav-icon doid-sidebar__nav-icon--colored" style="background: ${service.color}">
              ${ICONS[service.icon] || ICONS.star}
            </div>
            <span class="doid-sidebar__nav-text">${service.name}</span>
            ${!isActive ? `<span class="doid-sidebar__nav-external">${ICONS.externalLink}</span>` : ''}
            <span class="doid-sidebar__tooltip">${service.name}</span>
          </a>
        `;
      }

      html += `
          </nav>
        </div>
      `;

      return html;
    }

    renderNotifications() {
      return `
        <div class="doid-sidebar__section">
          <div class="doid-sidebar__section-title">Notifiche</div>
          <nav class="doid-sidebar__nav">
            <button class="doid-sidebar__nav-item">
              <div class="doid-sidebar__nav-icon">${ICONS.bell}</div>
              <span class="doid-sidebar__nav-text">Notifiche</span>
              <span class="doid-sidebar__nav-badge">${this.state.notifications.length}</span>
            </button>
          </nav>
        </div>
      `;
    }

    renderError() {
      if (!this.elements.content) return;

      this.elements.content.innerHTML = `
        <div class="doid-sidebar__error">
          <div class="doid-sidebar__error-text">${this.escapeHtml(this.state.error)}</div>
          <button class="doid-sidebar__error-btn" data-action="retry">
            ${ICONS.refresh} Riprova
          </button>
        </div>
      `;
    }

    // ============================================
    // EVENT HANDLERS
    // ============================================

    bindEvents() {
      // Toggle sidebar
      this.elements.toggle?.addEventListener('click', () => this.toggle());

      // FAB click
      this.elements.fab?.addEventListener('click', () => this.show());

      // User menu toggle
      this.elements.user?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleUserMenu();
      });

      // Close menus on outside click
      document.addEventListener('click', (e) => {
        if (!this.elements.sidebar?.contains(e.target)) {
          this.closeAllMenus();
        }
      });

      // Keyboard navigation
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.closeAllMenus();
        }
      });
    }

    bindDynamicEvents() {
      // Activity dropdown toggle
      const activityBtn = this.elements.content?.querySelector('[data-action="toggle-activity-dropdown"]');
      activityBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleActivityDropdown();
      });

      // Activity selection
      const activityItems = this.elements.content?.querySelectorAll('[data-activity-id]');
      activityItems?.forEach(item => {
        item.addEventListener('click', () => {
          const activityId = item.dataset.activityId;
          this.selectActivity(activityId);
        });
      });

      // Retry button
      const retryBtn = this.elements.content?.querySelector('[data-action="retry"]');
      retryBtn?.addEventListener('click', () => this.loadData());

      // Logout
      const logoutBtn = this.elements.userMenu?.querySelector('[data-action="logout"]');
      logoutBtn?.addEventListener('click', () => this.logout());

      // Service navigation with SSO
      const serviceLinks = this.elements.content?.querySelectorAll('[data-service]');
      serviceLinks?.forEach(link => {
        link.addEventListener('click', (e) => {
          const service = link.dataset.service;
          if (service !== this.config.currentService) {
            e.preventDefault();
            this.navigateToService(service);
          }
        });
      });
    }

    // ============================================
    // AZIONI
    // ============================================

    toggle() {
      this.state.isExpanded = !this.state.isExpanded;
      this.elements.sidebar?.classList.toggle('doid-sidebar--expanded', this.state.isExpanded);
      this.elements.sidebar?.classList.toggle('doid-sidebar--collapsed', !this.state.isExpanded);

      // Aggiorna icona toggle
      if (this.elements.toggle) {
        const icon = this.config.position === 'right'
          ? (this.state.isExpanded ? ICONS.chevronRight : ICONS.chevronLeft)
          : (this.state.isExpanded ? ICONS.chevronLeft : ICONS.chevronRight);
        this.elements.toggle.innerHTML = icon;
      }
    }

    show() {
      this.state.isHidden = false;
      this.elements.sidebar?.classList.remove('doid-sidebar--hidden');
      this.elements.fab?.classList.add('doid-sidebar-fab--hidden');
    }

    hide() {
      this.state.isHidden = true;
      this.elements.sidebar?.classList.add('doid-sidebar--hidden');
      this.elements.fab?.classList.remove('doid-sidebar-fab--hidden');
    }

    toggleUserMenu() {
      this.state.userMenuOpen = !this.state.userMenuOpen;
      this.elements.userMenu?.classList.toggle('doid-sidebar__user-menu--open', this.state.userMenuOpen);
    }

    toggleActivityDropdown() {
      this.state.activityDropdownOpen = !this.state.activityDropdownOpen;
      const selector = this.elements.content?.querySelector('.doid-sidebar__activity-selector');
      selector?.classList.toggle('doid-sidebar__activity-selector--open', this.state.activityDropdownOpen);
    }

    closeAllMenus() {
      this.state.userMenuOpen = false;
      this.state.activityDropdownOpen = false;
      this.elements.userMenu?.classList.remove('doid-sidebar__user-menu--open');
      this.elements.content?.querySelector('.doid-sidebar__activity-selector')
        ?.classList.remove('doid-sidebar__activity-selector--open');
    }

    async selectActivity(activityId) {
      if (activityId === this.state.currentActivity?.id) {
        this.closeAllMenus();
        return;
      }

      const activity = this.state.activities.find(a => a.id === activityId);
      if (!activity) return;

      this.state.currentActivity = activity;
      this.closeAllMenus();
      this.render();

      // Callback
      if (typeof this.config.onActivityChange === 'function') {
        this.config.onActivityChange(activity);
      }

      // Ricarica la pagina corrente con nuova attività (opzionale)
      // window.location.reload();
    }

    async navigateToService(serviceCode) {
      const service = DOID_SERVICES[serviceCode];
      if (!service) return;

      try {
        // Genera nuovo token SSO
        const response = await this.apiCall('/api/dashboard/generate-token', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.token}`
          },
          body: JSON.stringify({
            service: serviceCode,
            activityId: this.state.currentActivity?.id
          })
        });

        if (response.success && response.data?.token) {
          // Redirect con token SSO
          const ssoUrl = `${service.url}/auth/sso?token=${response.data.token}`;
          window.location.href = ssoUrl;
        } else {
          // Fallback: apri senza SSO
          window.open(service.url, '_blank');
        }
      } catch (error) {
        console.error('DOIDSidebar: Navigation error', error);
        window.open(service.url, '_blank');
      }

      // Callback
      if (typeof this.config.onServiceChange === 'function') {
        this.config.onServiceChange(serviceCode);
      }
    }

    logout() {
      // Redirect al logout di Suite
      window.location.href = `${this.config.suiteUrl}/logout`;
    }

    // ============================================
    // UTILITIES
    // ============================================

    getInitials(name) {
      if (!name) return '?';
      return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }

    escapeHtml(text) {
      if (!text) return '';
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    // ============================================
    // API PUBBLICA
    // ============================================

    setTheme(theme) {
      this.config.theme = theme;
      this.elements.sidebar?.classList.remove('doid-sidebar--light', 'doid-sidebar--dark');
      this.elements.sidebar?.classList.add(`doid-sidebar--${theme}`);
    }

    setPosition(position) {
      this.config.position = position;
      this.elements.sidebar?.classList.remove('doid-sidebar--left', 'doid-sidebar--right');
      this.elements.sidebar?.classList.add(`doid-sidebar--${position}`);
      this.elements.fab?.classList.remove('doid-sidebar-fab--left', 'doid-sidebar-fab--right');
      this.elements.fab?.classList.add(`doid-sidebar-fab--${position}`);
    }

    refresh() {
      return this.loadData();
    }

    destroy() {
      this.elements.sidebar?.remove();
      this.elements.fab?.remove();
      document.getElementById('doid-sidebar-styles')?.remove();
      this.initialized = false;
    }

    // Getter per stato
    getUser() { return this.state.user; }
    getActivity() { return this.state.currentActivity; }
    getActivities() { return this.state.activities; }
    getSubscriptions() { return this.state.subscriptions; }
    isExpanded() { return this.state.isExpanded; }
    isHidden() { return this.state.isHidden; }
  }

  // ============================================
  // ESPOSIZIONE GLOBALE
  // ============================================

  // Singleton instance
  const instance = new DOIDSidebar();

  // Export per diversi ambienti
  if (typeof module !== 'undefined' && module.exports) {
    // CommonJS
    module.exports = instance;
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define([], function() { return instance; });
  } else {
    // Browser global
    window.DOIDSidebar = instance;
  }

})(window, document);
