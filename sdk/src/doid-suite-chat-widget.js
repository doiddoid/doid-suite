/**
 * DOID Suite Chat Widget
 * Widget AI standalone per assistenza utenti DOID Suite
 *
 * Utilizzo:
 *   <script src="https://suite.doid.it/sdk/doid-suite-chat-widget.min.js"></script>
 *   <script>
 *     DOIDChat.init({ apiUrl: 'https://suite-api.doid.it' });
 *   </script>
 */

(function(window, document) {
  'use strict';

  // ============================================
  // CONFIGURAZIONE
  // ============================================

  const DEFAULT_CONFIG = {
    apiUrl: '/api',
    position: 'right',    // 'right' | 'left'
    offsetBottom: '24px',
    offsetSide: '24px',
    zIndex: 10000,
    placeholder: 'Scrivi un messaggio...',
    title: 'DOID Assistente',
    subtitle: 'AI Support',
    maxMessages: 20
  };

  // ============================================
  // ICONE SVG
  // ============================================

  const ICONS = {
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
    minimize: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>'
  };

  // ============================================
  // STILI CSS
  // ============================================

  const STYLES = `
    .doid-chat-widget * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    .doid-chat-widget {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      position: fixed;
      z-index: var(--doid-chat-z, 10000);
    }

    /* FAB Button */
    .doid-chat-fab {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #14B8A6, #0D9488);
      color: #fff;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(20, 184, 166, 0.4);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      position: fixed;
    }

    .doid-chat-fab:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 24px rgba(20, 184, 166, 0.5);
    }

    .doid-chat-fab svg {
      width: 24px;
      height: 24px;
    }

    .doid-chat-fab--hidden {
      transform: scale(0);
      pointer-events: none;
    }

    /* Badge notifica */
    .doid-chat-fab-badge {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 16px;
      height: 16px;
      background: #EF4444;
      border-radius: 50%;
      border: 2px solid #fff;
      display: none;
    }

    .doid-chat-fab-badge--visible {
      display: block;
    }

    /* Chat Window */
    .doid-chat-window {
      position: fixed;
      width: 380px;
      max-width: calc(100vw - 32px);
      height: 520px;
      max-height: calc(100vh - 120px);
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transform: scale(0.9);
      opacity: 0;
      pointer-events: none;
      transition: transform 0.25s ease, opacity 0.25s ease;
      transform-origin: bottom right;
    }

    .doid-chat-window--open {
      transform: scale(1);
      opacity: 1;
      pointer-events: auto;
    }

    .doid-chat-window--left {
      transform-origin: bottom left;
    }

    /* Header */
    .doid-chat-header {
      background: linear-gradient(135deg, #14B8A6, #0D9488);
      color: #fff;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }

    .doid-chat-header-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 700;
      flex-shrink: 0;
    }

    .doid-chat-header-info {
      flex: 1;
      min-width: 0;
    }

    .doid-chat-header-title {
      font-size: 15px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .doid-chat-header-subtitle {
      font-size: 12px;
      opacity: 0.85;
    }

    .doid-chat-header-close {
      background: none;
      border: none;
      color: #fff;
      cursor: pointer;
      padding: 4px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s;
      flex-shrink: 0;
    }

    .doid-chat-header-close:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .doid-chat-header-close svg {
      width: 20px;
      height: 20px;
    }

    /* Messages Area */
    .doid-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      scroll-behavior: smooth;
    }

    .doid-chat-messages::-webkit-scrollbar {
      width: 4px;
    }

    .doid-chat-messages::-webkit-scrollbar-track {
      background: transparent;
    }

    .doid-chat-messages::-webkit-scrollbar-thumb {
      background: #D1D5DB;
      border-radius: 4px;
    }

    /* Message Bubbles */
    .doid-chat-msg {
      max-width: 85%;
      padding: 10px 14px;
      border-radius: 16px;
      word-wrap: break-word;
      white-space: pre-wrap;
      font-size: 14px;
      line-height: 1.5;
    }

    .doid-chat-msg--assistant {
      align-self: flex-start;
      background: #F3F4F6;
      color: #1F2937;
      border-bottom-left-radius: 4px;
    }

    .doid-chat-msg--user {
      align-self: flex-end;
      background: linear-gradient(135deg, #14B8A6, #0D9488);
      color: #fff;
      border-bottom-right-radius: 4px;
    }

    /* Typing Indicator */
    .doid-chat-typing {
      align-self: flex-start;
      display: flex;
      gap: 4px;
      padding: 12px 16px;
      background: #F3F4F6;
      border-radius: 16px;
      border-bottom-left-radius: 4px;
    }

    .doid-chat-typing-dot {
      width: 8px;
      height: 8px;
      background: #9CA3AF;
      border-radius: 50%;
      animation: doid-chat-bounce 1.4s ease-in-out infinite;
    }

    .doid-chat-typing-dot:nth-child(2) {
      animation-delay: 0.2s;
    }

    .doid-chat-typing-dot:nth-child(3) {
      animation-delay: 0.4s;
    }

    @keyframes doid-chat-bounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-6px); }
    }

    /* Input Area */
    .doid-chat-input-area {
      padding: 12px 16px;
      border-top: 1px solid #E5E7EB;
      display: flex;
      align-items: flex-end;
      gap: 8px;
      flex-shrink: 0;
      background: #fff;
    }

    .doid-chat-input {
      flex: 1;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      padding: 10px 14px;
      font-size: 14px;
      font-family: inherit;
      line-height: 1.5;
      resize: none;
      outline: none;
      min-height: 40px;
      max-height: 100px;
      transition: border-color 0.15s;
      color: #1F2937;
      background: #F9FAFB;
    }

    .doid-chat-input::placeholder {
      color: #9CA3AF;
    }

    .doid-chat-input:focus {
      border-color: #14B8A6;
      background: #fff;
    }

    .doid-chat-send {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #14B8A6, #0D9488);
      color: #fff;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.15s, transform 0.15s;
      flex-shrink: 0;
    }

    .doid-chat-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .doid-chat-send:not(:disabled):hover {
      transform: scale(1.05);
    }

    .doid-chat-send svg {
      width: 18px;
      height: 18px;
    }

    /* Link Buttons */
    .doid-chat-link-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 8px;
      margin-right: 6px;
      padding: 8px 14px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 500;
      font-family: inherit;
      text-decoration: none;
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.15s;
      line-height: 1.3;
    }

    .doid-chat-link-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    }

    .doid-chat-link-btn--whatsapp {
      background: #25D366;
      color: #fff;
    }

    .doid-chat-link-btn--email {
      background: #3B82F6;
      color: #fff;
    }

    .doid-chat-link-btn--default {
      background: #14B8A6;
      color: #fff;
    }

    .doid-chat-link-btn svg {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }

    /* Error Message */
    .doid-chat-error {
      align-self: center;
      background: #FEF2F2;
      color: #DC2626;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 12px;
      text-align: center;
    }

    /* Powered By */
    .doid-chat-powered {
      text-align: center;
      padding: 6px 0;
      font-size: 11px;
      color: #9CA3AF;
      background: #fff;
      border-top: 1px solid #F3F4F6;
      flex-shrink: 0;
    }

    .doid-chat-powered a {
      color: #14B8A6;
      text-decoration: none;
      font-weight: 500;
    }

    .doid-chat-powered a:hover {
      text-decoration: underline;
    }

    /* Mobile */
    @media (max-width: 480px) {
      .doid-chat-window {
        width: calc(100vw - 16px);
        height: calc(100vh - 80px);
        max-height: calc(100vh - 80px);
        border-radius: 12px;
      }
    }
  `;

  // ============================================
  // WIDGET CORE
  // ============================================

  let config = {};
  let messages = [];      // messaggi visibili nella chat (role: assistant/user)
  let apiMessages = [];   // messaggi da inviare all'AI (solo dopo intro completato)
  let isOpen = false;
  let isLoading = false;
  let elements = {};
  let visitor = { name: '', email: '' };
  let introPhase = 'greeting'; // 'greeting' | 'ask_name' | 'done' | 'ask_email_closing'
  let transcriptSent = false;
  let isAuthenticated = false;

  function init(userConfig) {
    config = Object.assign({}, DEFAULT_CONFIG, userConfig || {});

    injectStyles();
    createDOM();
    bindEvents();
    tryAutoLogin();
  }

  // ============================================
  // AUTO-LOGIN (utente già autenticato)
  // ============================================

  function tryAutoLogin() {
    var token = null;
    try { token = localStorage.getItem('accessToken'); } catch(e) {}
    if (!token) return;

    fetch(config.apiUrl + '/auth/me', {
      headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(function(res) { return res.ok ? res.json() : null; })
    .then(function(data) {
      if (!data || !data.data) return;
      var user = data.data.user || data.data;
      var name = user.fullName || user.full_name || user.name || '';
      var email = user.email || '';
      if (name && email) {
        visitor.name = name;
        visitor.email = email;
        introPhase = 'done';
        isAuthenticated = true;
      }
    })
    .catch(function() {});
  }

  function injectStyles() {
    if (document.getElementById('doid-chat-styles')) return;
    var style = document.createElement('style');
    style.id = 'doid-chat-styles';
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  function createDOM() {
    // Container
    var container = document.createElement('div');
    container.className = 'doid-chat-widget';
    container.style.setProperty('--doid-chat-z', config.zIndex);

    // Posizionamento
    var side = config.position === 'left' ? 'left' : 'right';
    var oppositeSide = side === 'left' ? 'right' : 'left';

    // FAB
    var fab = document.createElement('button');
    fab.className = 'doid-chat-fab';
    fab.setAttribute('aria-label', 'Apri chat assistenza');
    fab.style[side] = config.offsetSide;
    fab.style.bottom = config.offsetBottom;
    fab.style[oppositeSide] = 'auto';
    fab.innerHTML = ICONS.chat + '<span class="doid-chat-fab-badge"></span>';

    // Chat Window — nessun form intro, solo chat area visibile sempre
    var win = document.createElement('div');
    win.className = 'doid-chat-window' + (config.position === 'left' ? ' doid-chat-window--left' : '');
    win.style[side] = config.offsetSide;
    win.style.bottom = 'calc(' + config.offsetBottom + ' + 68px)';
    win.style[oppositeSide] = 'auto';

    win.innerHTML =
      '<div class="doid-chat-header">' +
        '<div class="doid-chat-header-avatar">d</div>' +
        '<div class="doid-chat-header-info">' +
          '<div class="doid-chat-header-title">' + escapeHtml(config.title) + '</div>' +
          '<div class="doid-chat-header-subtitle">' + escapeHtml(config.subtitle) + '</div>' +
        '</div>' +
        '<button class="doid-chat-header-close" aria-label="Chiudi chat">' + ICONS.close + '</button>' +
      '</div>' +
      '<div class="doid-chat-messages"></div>' +
      '<div class="doid-chat-input-area">' +
        '<textarea class="doid-chat-input" placeholder="' + escapeHtml(config.placeholder) + '" rows="1"></textarea>' +
        '<button class="doid-chat-send" aria-label="Invia messaggio" disabled>' + ICONS.send + '</button>' +
      '</div>' +
      '<div class="doid-chat-powered">Powered by <a href="https://suite.doid.it" target="_blank" rel="noopener">DOID Suite</a></div>';

    container.appendChild(fab);
    container.appendChild(win);
    document.body.appendChild(container);

    // Riferimenti
    elements.container = container;
    elements.fab = fab;
    elements.window = win;
    elements.closeBtn = win.querySelector('.doid-chat-header-close');
    elements.messagesArea = win.querySelector('.doid-chat-messages');
    elements.inputArea = win.querySelector('.doid-chat-input-area');
    elements.input = win.querySelector('.doid-chat-input');
    elements.sendBtn = win.querySelector('.doid-chat-send');
    elements.badge = fab.querySelector('.doid-chat-fab-badge');
  }

  function bindEvents() {
    elements.fab.addEventListener('click', toggleChat);
    elements.closeBtn.addEventListener('click', closeChat);

    elements.sendBtn.addEventListener('click', handleInput);

    elements.input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleInput();
      }
    });

    elements.input.addEventListener('input', function() {
      // Auto-resize
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 100) + 'px';
      // Enable/disable send
      elements.sendBtn.disabled = !this.value.trim() || isLoading;
    });
  }

  // ============================================
  // FLUSSO CONVERSAZIONALE INTRO
  // ============================================

  function startConversation() {
    if (messages.length > 0) return; // già iniziata

    if (introPhase === 'done') {
      // Utente loggato → saluto personalizzato e via
      var firstName = visitor.name.split(' ')[0];
      messages.push({ role: 'assistant', content: 'Ciao ' + firstName + '! 👋 Sono l\'assistente AI di DOID Suite. Come posso aiutarti?' });
      renderMessages();
      elements.input.placeholder = config.placeholder;
      return;
    }

    // Utente non loggato → flusso conversazionale
    introPhase = 'ask_name';
    messages.push({ role: 'assistant', content: 'Ciao! 👋 Sono l\'assistente AI di DOID Suite.\n\nCome ti chiami?' });
    renderMessages();
    elements.input.placeholder = 'Il tuo nome...';
  }

  function handleInput() {
    var text = elements.input.value.trim();
    if (!text || isLoading) return;

    if (introPhase === 'ask_name') {
      handleNameInput(text);
    } else if (introPhase === 'ask_email_closing') {
      handleEmailClosing(text);
    } else {
      sendMessage(text);
    }
  }

  function handleNameInput(text) {
    visitor.name = text;
    messages.push({ role: 'user', content: text });
    clearInput();
    renderMessages();

    var firstName = text.split(' ')[0];

    setTimeout(function() {
      introPhase = 'done';
      elements.input.placeholder = config.placeholder;
      messages.push({ role: 'assistant', content: 'Piacere ' + firstName + '! 😊 Come posso aiutarti?' });
      renderMessages();
    }, 400);
  }

  function handleEmailClosing(text) {
    if (!text.includes('@') || !text.includes('.')) {
      messages.push({ role: 'user', content: text });
      clearInput();
      renderMessages();
      setTimeout(function() {
        messages.push({ role: 'assistant', content: 'Non sembra un indirizzo email valido. Puoi riprovare?' });
        renderMessages();
      }, 300);
      return;
    }

    visitor.email = text;
    messages.push({ role: 'user', content: text });
    clearInput();
    renderMessages();

    var firstName = visitor.name.split(' ')[0];

    setTimeout(function() {
      introPhase = 'done';
      elements.input.placeholder = config.placeholder;
      messages.push({ role: 'assistant', content: 'Grazie ' + firstName + '! Ti invieremo il riepilogo a ' + text + '. A presto! 👋' });
      renderMessages();
      // Ora invia il transcript con l'email
      sendTranscript();
      // Chiudi dopo un attimo
      setTimeout(function() {
        isOpen = false;
        elements.window.classList.remove('doid-chat-window--open');
        elements.fab.classList.remove('doid-chat-fab--hidden');
      }, 2000);
    }, 400);
  }

  function clearInput() {
    elements.input.value = '';
    elements.input.style.height = 'auto';
    elements.sendBtn.disabled = true;
  }

  // ============================================
  // CHAT LOGIC
  // ============================================

  function toggleChat() {
    if (isOpen) {
      closeChat();
    } else {
      openChat();
    }
  }

  function openChat() {
    isOpen = true;
    elements.window.classList.add('doid-chat-window--open');
    elements.fab.classList.add('doid-chat-fab--hidden');
    elements.badge.classList.remove('doid-chat-fab-badge--visible');

    // Avvia conversazione alla prima apertura
    startConversation();
    elements.input.focus();
  }

  function resetConversation() {
    messages = [];
    apiMessages = [];
    transcriptSent = false;
    visitor = { name: '', email: '' };
    introPhase = 'greeting';
    isAuthenticated = false;
    elements.input.placeholder = config.placeholder;
    elements.messagesArea.innerHTML = '';
    // Ri-verifica auth per la prossima apertura
    tryAutoLogin();
  }

  function closeChat() {
    // Se non loggato, ha conversato con l'AI e non ha ancora dato l'email → chiedi
    // Se sta già chiedendo l'email e preme X di nuovo → chiudi senza email
    if (introPhase === 'ask_email_closing') {
      introPhase = 'done';
      isOpen = false;
      elements.window.classList.remove('doid-chat-window--open');
      elements.fab.classList.remove('doid-chat-fab--hidden');
      sendTranscript();
      resetConversation();
      return;
    }

    if (!isAuthenticated && !visitor.email && apiMessages.length > 0) {
      introPhase = 'ask_email_closing';
      var firstName = visitor.name ? visitor.name.split(' ')[0] : '';
      var greeting = firstName ? firstName + ', prima' : 'Prima';
      messages.push({ role: 'assistant', content: greeting + ' di andare, vuoi lasciarmi la tua email? Ti invierò un riepilogo della nostra conversazione.' });
      elements.input.placeholder = 'La tua email...';
      renderMessages();
      elements.input.focus();
      return; // Non chiudere ancora
    }

    isOpen = false;
    elements.window.classList.remove('doid-chat-window--open');
    elements.fab.classList.remove('doid-chat-fab--hidden');
    sendTranscript();
    resetConversation();
  }

  async function sendMessage(text) {
    if (text.length > 2000) {
      text = text.substring(0, 2000);
    }

    // Aggiungi messaggio utente
    messages.push({ role: 'user', content: text });
    // Aggiungi ai messaggi API (esclusi quelli dell'intro)
    apiMessages.push({ role: 'user', content: text });
    clearInput();
    renderMessages();

    // Show typing
    isLoading = true;
    showTyping();

    try {
      var payload = apiMessages.slice(-config.maxMessages).map(function(m) {
        return { role: m.role, content: m.content };
      });

      var response = await fetch(config.apiUrl + '/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payload })
      });

      var data = await response.json();

      hideTyping();
      isLoading = false;

      if (!response.ok || data.error) {
        showError(data.error || 'Si è verificato un errore. Riprova.');
        return;
      }

      messages.push({ role: 'assistant', content: data.content });
      apiMessages.push({ role: 'assistant', content: data.content });
      renderMessages();

    } catch (err) {
      hideTyping();
      isLoading = false;
      showError('Impossibile contattare il server. Verifica la connessione.');
    }

    elements.sendBtn.disabled = !elements.input.value.trim();
  }

  // ============================================
  // RENDERING
  // ============================================

  // Icone per i pulsanti link
  var LINK_ICONS = {
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.11.546 4.093 1.504 5.818L0 24l6.335-1.652A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.82c-1.97 0-3.867-.53-5.523-1.527l-.396-.235-3.767.983.998-3.648-.258-.41A9.79 9.79 0 012.18 12c0-5.422 4.398-9.82 9.82-9.82 5.422 0 9.82 4.398 9.82 9.82 0 5.422-4.398 9.82-9.82 9.82z"/></svg>',
    email: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>'
  };

  function renderMessages() {
    var area = elements.messagesArea;
    area.innerHTML = '';

    messages.forEach(function(msg) {
      var bubble = document.createElement('div');
      bubble.className = 'doid-chat-msg doid-chat-msg--' + msg.role;

      if (msg.role === 'assistant') {
        bubble.innerHTML = parseMessageContent(msg.content);
      } else {
        bubble.textContent = msg.content;
      }

      area.appendChild(bubble);
    });

    scrollToBottom();
  }

  function parseMessageContent(text) {
    // Regex per markdown links: [testo](url)
    var linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g;
    var parts = [];
    var lastIndex = 0;
    var match;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(formatInline(escapeHtml(text.substring(lastIndex, match.index))));
      }
      parts.push(createLinkButton(match[1], match[2]));
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(formatInline(escapeHtml(text.substring(lastIndex))));
    }

    return parts.join('');
  }

  function formatInline(html) {
    // Bold: **testo** → <strong>testo</strong>
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Italic: *testo* → <em>testo</em>
    html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
    return html;
  }

  function createLinkButton(label, url) {
    var type = 'default';
    var icon = LINK_ICONS.link;

    if (url.indexOf('wa.me') !== -1 || url.indexOf('whatsapp') !== -1) {
      type = 'whatsapp';
      icon = LINK_ICONS.whatsapp;
    } else if (url.indexOf('mailto:') === 0) {
      type = 'email';
      icon = LINK_ICONS.email;
    }

    return '<a class="doid-chat-link-btn doid-chat-link-btn--' + type + '" ' +
      'href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer">' +
      icon + ' ' + escapeHtml(label) + '</a>';
  }

  function showTyping() {
    var typing = document.createElement('div');
    typing.className = 'doid-chat-typing';
    typing.id = 'doid-chat-typing';
    typing.innerHTML =
      '<div class="doid-chat-typing-dot"></div>' +
      '<div class="doid-chat-typing-dot"></div>' +
      '<div class="doid-chat-typing-dot"></div>';
    elements.messagesArea.appendChild(typing);
    scrollToBottom();
  }

  function hideTyping() {
    var typing = document.getElementById('doid-chat-typing');
    if (typing) typing.remove();
  }

  function showError(msg) {
    var error = document.createElement('div');
    error.className = 'doid-chat-error';
    error.textContent = msg;
    elements.messagesArea.appendChild(error);
    scrollToBottom();

    setTimeout(function() {
      if (error.parentNode) error.remove();
    }, 5000);
  }

  function scrollToBottom() {
    var area = elements.messagesArea;
    requestAnimationFrame(function() {
      area.scrollTop = area.scrollHeight;
    });
  }

  // ============================================
  // UTILS
  // ============================================

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ============================================
  // TRANSCRIPT
  // ============================================

  function sendTranscript() {
    // Invia solo se ci sono messaggi AI reali (non intro) e non già inviato
    if (transcriptSent || apiMessages.length === 0) return;
    transcriptSent = true;

    var payload = JSON.stringify({
      visitorName: visitor.name || 'Anonimo',
      visitorEmail: visitor.email || '',
      messages: messages
    });

    var url = config.apiUrl + '/chat/transcript';

    if (navigator.sendBeacon) {
      var blob = new Blob([payload], { type: 'application/json' });
      var sent = navigator.sendBeacon(url, blob);
      if (!sent) {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true
        }).catch(function() {});
      }
    } else {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true
      }).catch(function() {});
    }
  }

  // ============================================
  // PUBLIC API
  // ============================================

  function destroy() {
    if (elements.container) {
      elements.container.remove();
    }
    var style = document.getElementById('doid-chat-styles');
    if (style) style.remove();
    messages = [];
    apiMessages = [];
    isOpen = false;
    isLoading = false;
    elements = {};
  }

  function open() { openChat(); }
  function close() { closeChat(); }

  window.DOIDChat = {
    init: init,
    open: open,
    close: close,
    destroy: destroy
  };

})(window, document);
