/**
 * DG PRODUCTION — STUDIO CMS & ADMIN LOGIC ENGINE
 * Full CRUD for Projects, Clients, Leads, Auth, Settings & Backup
 */

document.addEventListener('DOMContentLoaded', () => {
  initAdminAuth();
  initAdminNavigation();
  initProjectsManager();
  initClientsManager();
  initLeadsManager();
  initSettingsManager();

  // Re-render data if store changes
  window.addEventListener('dg:store:changed', () => {
    refreshAllViews();
  });
});

/* ==========================================================================
   1. TOAST NOTIFICATION UTILITY
   ========================================================================== */
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let iconSvg = '';
  if (type === 'success') {
    iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34D399" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  } else if (type === 'error') {
    iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
  } else {
    iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
  }

  toast.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* ==========================================================================
   2. AUTHENTICATION & LOGIN GATE
   ========================================================================== */
function initAdminAuth() {
  const overlay = document.getElementById('loginOverlay');
  const loginForm = document.getElementById('adminLoginForm');
  const pwInput = document.getElementById('adminPasswordInput');
  const alertBox = document.getElementById('loginAlert');
  const logoutBtn = document.getElementById('logoutBtn');
  const togglePwBtn = document.getElementById('togglePasswordBtn');

  // Check initial state
  if (window.DGStore && window.DGStore.isAuthenticated()) {
    overlay.classList.add('hidden');
    refreshAllViews();
  } else {
    overlay.classList.remove('hidden');
  }

  // Toggle password visibility
  if (togglePwBtn && pwInput) {
    togglePwBtn.addEventListener('click', () => {
      const type = pwInput.getAttribute('type') === 'password' ? 'text' : 'password';
      pwInput.setAttribute('type', type);
    });
  }

  // Handle login submit
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('adminEmailInput');
      const enteredEmail = emailInput ? emailInput.value.trim() : '';
      const enteredPw = pwInput ? pwInput.value.trim() : '';

      if (!window.DGStore) {
        showAlert('Store engine failed to load. Please reload.', true);
        return;
      }

      const result = window.DGStore.login(enteredEmail, enteredPw);
      if (result.success) {
        overlay.classList.add('hidden');
        showAlert('', false);
        loginForm.reset();
        showToast('Authenticated successfully. Welcome back, Oliyad!', 'success');
        refreshAllViews();
      } else {
        const card = document.querySelector('.login-card');
        if (card) {
          card.classList.add('shake');
          setTimeout(() => card.classList.remove('shake'), 450);
        }
        showAlert(result.error || 'Invalid credentials.', true);
        if (pwInput) pwInput.select();
      }
    });
  }

  // Logout button
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (window.DGStore) window.DGStore.logout();
      overlay.classList.remove('hidden');
      showToast('Logged out of Admin Portal.', 'info');
      if (pwInput) pwInput.focus();
    });
  }

  function showAlert(msg, visible) {
    if (!alertBox) return;
    if (visible) {
      alertBox.textContent = msg;
      alertBox.classList.add('visible');
    } else {
      alertBox.textContent = '';
      alertBox.classList.remove('visible');
    }
  }
}

/* ==========================================================================
   3. NAVIGATION & TABS CONTROLLER
   ========================================================================== */
function initAdminNavigation() {
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
  const tabPanes = document.querySelectorAll('.admin-tab-pane');
  const topbarTitle = document.getElementById('topbarTitle');
  const mobileToggle = document.getElementById('mobileSidebarToggle');
  const sidebar = document.getElementById('adminSidebar');

  const titles = {
    tabOverview: 'Dashboard Overview',
    tabProjects: 'Projects Showcase Manager',
    tabClients: 'Clients & Endorsements',
    tabLeads: 'Leads & Inquiries Pipeline',
    tabSettings: 'Studio Settings & Backup'
  };

  navItems.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);

      // Close mobile sidebar if open
      if (sidebar && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
      }
    });
  });

  // Mobile drawer toggle
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  // Quick Action button in Overview to add project
  const btnQuickAdd = document.getElementById('btnQuickAddProject');
  if (btnQuickAdd) {
    btnQuickAdd.addEventListener('click', () => {
      switchTab('tabProjects');
      openProjectModal();
    });
  }

  // Button in Overview to view all leads
  const btnViewAllLeads = document.getElementById('btnViewAllLeads');
  if (btnViewAllLeads) {
    btnViewAllLeads.addEventListener('click', () => {
      switchTab('tabLeads');
    });
  }

  function switchTab(tabId) {
    navItems.forEach((item) => {
      item.classList.toggle('active', item.getAttribute('data-tab') === tabId);
    });
    tabPanes.forEach((pane) => {
      pane.classList.toggle('active', pane.getAttribute('id') === tabId);
    });
    if (topbarTitle && titles[tabId]) {
      topbarTitle.textContent = titles[tabId];
    }
  }
}

/* ==========================================================================
   4. PROJECTS MANAGEMENT (CRUD)
   ========================================================================== */
function initProjectsManager() {
  const modal = document.getElementById('projectModal');
  const openModalBtn = document.getElementById('btnOpenNewProjectModal');
  const closeModalBtn = document.getElementById('closeProjectModalBtn');
  const cancelModalBtn = document.getElementById('cancelProjectModalBtn');
  const projectForm = document.getElementById('projectForm');
  const searchInput = document.getElementById('projectSearchInput');
  const filterChips = document.querySelectorAll('[data-proj-filter]');
  const previewModal = document.getElementById('previewModal');
  const closePreviewBtn = document.getElementById('closePreviewModalBtn');

  if (openModalBtn) {
    openModalBtn.addEventListener('click', () => openProjectModal());
  }

  if (closeModalBtn) closeModalBtn.addEventListener('click', closeProjectModal);
  if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeProjectModal);

  // Form Submit (Create / Update)
  if (projectForm) {
    projectForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('projectId').value;
      const title = document.getElementById('projectTitle').value.trim();
      const category = document.getElementById('projectCategory').value;
      const rawYoutube = document.getElementById('projectYoutube').value.trim();
      const aspect = document.getElementById('projectAspect').value;
      const duration = document.getElementById('projectDuration').value.trim() || '00:45';
      const customThumb = document.getElementById('projectCustomThumb').value.trim();
      const director = document.getElementById('projectDirector').value.trim() || 'DIRECTED & SHOT BY OLIYAD';
      const gear = document.getElementById('projectGear').value.trim() || 'GIMBAL • PRIME OPTICS';
      const desc = document.getElementById('projectDesc').value.trim();

      const youtubeId = extractYouTubeId(rawYoutube);
      if (!youtubeId) {
        alert('Please enter a valid YouTube Video ID or URL.');
        return;
      }

      const projectData = {
        title,
        category,
        youtubeId,
        aspect,
        duration,
        thumb: customThumb,
        director,
        gear,
        description: desc
      };

      if (id) projectData.id = id;

      window.DGStore.saveProject(projectData);
      closeProjectModal();
      renderProjectsList();
      showToast(id ? 'Project updated successfully!' : 'New project added to portfolio!');
    });
  }

  // Filter chips
  filterChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      filterChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      renderProjectsList();
    });
  });

  // Search input
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderProjectsList();
    });
  }

  // Close preview modal
  if (closePreviewBtn && previewModal) {
    closePreviewBtn.addEventListener('click', () => {
      previewModal.classList.remove('open');
      const wrap = document.getElementById('previewIframeWrap');
      if (wrap) wrap.innerHTML = '';
    });
  }
}

function openProjectModal(projectId = null) {
  const modal = document.getElementById('projectModal');
  const titleEl = document.getElementById('projectModalTitle');
  const form = document.getElementById('projectForm');
  if (!modal || !form) return;

  form.reset();
  document.getElementById('projectId').value = '';

  if (projectId && window.DGStore) {
    const proj = window.DGStore.getProjectById(projectId);
    if (proj) {
      titleEl.textContent = 'Edit Project';
      document.getElementById('projectId').value = proj.id;
      document.getElementById('projectTitle').value = proj.title || '';
      document.getElementById('projectCategory').value = proj.category || 'commercial';
      document.getElementById('projectYoutube').value = proj.youtubeId || '';
      document.getElementById('projectAspect').value = proj.aspect || '9-16';
      document.getElementById('projectDuration').value = proj.duration || '';
      document.getElementById('projectCustomThumb').value = proj.thumb || '';
      document.getElementById('projectDirector').value = proj.director || '';
      document.getElementById('projectGear').value = proj.gear || '';
      document.getElementById('projectDesc').value = proj.description || '';
    }
  } else {
    titleEl.textContent = 'Add New Project';
  }

  modal.classList.add('open');
}

function closeProjectModal() {
  const modal = document.getElementById('projectModal');
  if (modal) modal.classList.remove('open');
}

function renderProjectsList() {
  const container = document.getElementById('adminProjectsGrid');
  const countEl = document.getElementById('countAllProjects');
  if (!container || !window.DGStore) return;

  let projects = window.DGStore.getProjects();
  if (countEl) countEl.textContent = projects.length;

  // Read filter
  const activeChip = document.querySelector('[data-proj-filter].active');
  const filterVal = activeChip ? activeChip.getAttribute('data-proj-filter') : 'all';

  // Read search
  const searchInput = document.getElementById('projectSearchInput');
  const searchVal = searchInput ? searchInput.value.trim().toLowerCase() : '';

  if (filterVal !== 'all') {
    projects = projects.filter((p) => p.category === filterVal);
  }

  if (searchVal) {
    projects = projects.filter((p) => 
      (p.title && p.title.toLowerCase().includes(searchVal)) ||
      (p.description && p.description.toLowerCase().includes(searchVal)) ||
      (p.gear && p.gear.toLowerCase().includes(searchVal))
    );
  }

  if (projects.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--bg-surface); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle); color: var(--text-muted);">
        <p style="margin-bottom: 1rem;">No projects found matching your criteria.</p>
        <button class="btn btn-gold btn-sm" onclick="openProjectModal()">+ Add Project</button>
      </div>
    `;
    return;
  }

  container.innerHTML = projects.map((proj) => {
    const isVertical = proj.aspect === 'vertical' || proj.aspect === '9-16';
    const aspectTag = isVertical ? '9:16 Short' : '16:9 Cinema';
    const thumbUrl = proj.thumb || `https://img.youtube.com/vi/${proj.youtubeId}/hqdefault.jpg`;

    return `
      <article class="admin-proj-card" data-id="${proj.id}">
        <div class="admin-proj-thumb-wrap">
          <img src="${escapeHtml(thumbUrl)}" alt="${escapeHtml(proj.title)}" class="admin-proj-thumb" onerror="this.src='assets/images/portfolio-short-1.jpg'">
          <span class="proj-aspect-badge">${escapeHtml(aspectTag)}</span>
          <div class="proj-preview-overlay" onclick="previewProjectVideo('${escapeHtml(proj.youtubeId)}', '${escapeHtml(proj.title)}')">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="var(--gold-pure)"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          </div>
        </div>
        <div class="admin-proj-body">
          <div class="proj-cat-tag">${escapeHtml(proj.category)} • ${escapeHtml(proj.duration || '00:45')}</div>
          <h3 class="proj-card-title">${escapeHtml(proj.title)}</h3>
          <p class="proj-card-desc">${escapeHtml(proj.description || '')}</p>
          <div class="proj-card-actions">
            <button class="btn btn-outline btn-sm" onclick="openProjectModal('${proj.id}')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              Edit
            </button>
            <button class="btn btn-danger btn-sm" onclick="confirmDeleteProject('${proj.id}', '${escapeHtml(proj.title)}')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              Delete
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function previewProjectVideo(youtubeId, title) {
  const modal = document.getElementById('previewModal');
  const titleEl = document.getElementById('previewModalTitle');
  const wrap = document.getElementById('previewIframeWrap');
  if (!modal || !wrap) return;

  if (titleEl) titleEl.textContent = title || 'Video Preview';
  wrap.innerHTML = `
    <iframe src="https://www.youtube.com/embed/${youtubeId}?autoplay=1" allow="autoplay; encrypted-media" allowfullscreen></iframe>
  `;
  modal.classList.add('open');
}

function confirmDeleteProject(id, title) {
  if (confirm(`Are you sure you want to delete the project "${title}"? This cannot be undone.`)) {
    window.DGStore.deleteProject(id);
    renderProjectsList();
    showToast(`Project "${title}" deleted.`, 'info');
  }
}

// YouTube URL parser
function extractYouTubeId(urlOrId) {
  if (!urlOrId) return '';
  const trimmed = urlOrId.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : trimmed;
}

/* ==========================================================================
   5. CLIENTS & ENDORSEMENTS MANAGEMENT (CRUD)
   ========================================================================== */
function initClientsManager() {
  const modal = document.getElementById('clientModal');
  const openBtn = document.getElementById('btnOpenNewClientModal');
  const closeBtn = document.getElementById('closeClientModalBtn');
  const cancelBtn = document.getElementById('cancelClientModalBtn');
  const clientForm = document.getElementById('clientForm');

  if (openBtn) openBtn.addEventListener('click', () => openClientModal());
  if (closeBtn) closeBtn.addEventListener('click', closeClientModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeClientModal);

  if (clientForm) {
    clientForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('clientId').value;
      const name = document.getElementById('clientModalName').value.trim();
      const role = document.getElementById('clientModalRole').value.trim();
      const rating = parseInt(document.getElementById('clientModalRating').value, 10) || 5;
      const avatar = document.getElementById('clientModalAvatar').value.trim();
      const quote = document.getElementById('clientModalQuote').value.trim();

      const clientData = {
        name,
        role,
        rating,
        avatar,
        quote
      };
      if (id) clientData.id = id;

      window.DGStore.saveClient(clientData);
      closeClientModal();
      renderClientsList();
      showToast(id ? 'Client review updated!' : 'New client review published!');
    });
  }
}

function openClientModal(clientId = null) {
  const modal = document.getElementById('clientModal');
  const titleEl = document.getElementById('clientModalTitle');
  const form = document.getElementById('clientForm');
  if (!modal || !form) return;

  form.reset();
  document.getElementById('clientId').value = '';

  if (clientId && window.DGStore) {
    const client = window.DGStore.getClientById(clientId);
    if (client) {
      titleEl.textContent = 'Edit Client Review';
      document.getElementById('clientId').value = client.id;
      document.getElementById('clientModalName').value = client.name || '';
      document.getElementById('clientModalRole').value = client.role || '';
      document.getElementById('clientModalRating').value = client.rating || 5;
      document.getElementById('clientModalAvatar').value = client.avatar || '';
      document.getElementById('clientModalQuote').value = client.quote || '';
    }
  } else {
    titleEl.textContent = 'Add Client Review';
  }

  modal.classList.add('open');
}

function closeClientModal() {
  const modal = document.getElementById('clientModal');
  if (modal) modal.classList.remove('open');
}

function renderClientsList() {
  const container = document.getElementById('adminClientsGrid');
  if (!container || !window.DGStore) return;

  const clients = window.DGStore.getClients();

  if (clients.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--bg-surface); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle); color: var(--text-muted);">
        <p style="margin-bottom: 1rem;">No client reviews found.</p>
        <button class="btn btn-gold btn-sm" onclick="openClientModal()">+ Add Client Review</button>
      </div>
    `;
    return;
  }

  container.innerHTML = clients.map((c) => {
    const stars = '★'.repeat(Math.min(5, Math.max(1, c.rating || 5)));
    const avatar = c.avatar || (c.name ? c.name.slice(0, 2).toUpperCase() : 'DG');

    return `
      <div class="admin-client-card" data-id="${c.id}">
        <div>
          <div class="client-card-top">
            <div class="client-avatar-circle">${escapeHtml(avatar)}</div>
            <div>
              <h4 style="font-family: var(--font-display); font-size: 1.05rem; font-weight: 700; color: var(--text-white);">${escapeHtml(c.name)}</h4>
              <p style="font-size: 0.8rem; color: var(--text-secondary);">${escapeHtml(c.role || 'Client')}</p>
            </div>
          </div>
          <div class="client-stars">${stars}</div>
          <p class="client-quote-text">"${escapeHtml(c.quote)}"</p>
        </div>
        <div class="client-card-actions">
          <button class="btn btn-outline btn-sm" onclick="openClientModal('${c.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="confirmDeleteClient('${c.id}', '${escapeHtml(c.name)}')">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

function confirmDeleteClient(id, name) {
  if (confirm(`Delete endorsement review by "${name}"?`)) {
    window.DGStore.deleteClient(id);
    renderClientsList();
    showToast(`Review by "${name}" deleted.`, 'info');
  }
}

/* ==========================================================================
   6. LEADS & INQUIRIES MANAGEMENT
   ========================================================================== */
let activeSelectedLeadId = null;

function initLeadsManager() {
  const filterChips = document.querySelectorAll('[data-lead-filter]');
  const searchInput = document.getElementById('leadSearchInput');
  const exportCsvBtn = document.getElementById('btnExportLeadsCsv');
  const leadModal = document.getElementById('leadDetailModal');
  const closeLeadModalBtn = document.getElementById('closeLeadDetailModalBtn');
  const closeLeadBtn = document.getElementById('closeLeadDetailBtn');
  const deleteCurrentLeadBtn = document.getElementById('btnDeleteCurrentLead');

  filterChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      filterChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      renderLeadsTables();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderLeadsTables();
    });
  }

  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', exportLeadsToCSV);
  }

  if (closeLeadModalBtn) closeLeadModalBtn.addEventListener('click', closeLeadModal);
  if (closeLeadBtn) closeLeadBtn.addEventListener('click', closeLeadModal);

  if (deleteCurrentLeadBtn) {
    deleteCurrentLeadBtn.addEventListener('click', () => {
      if (activeSelectedLeadId) {
        if (confirm('Delete this inquiry lead record permanently?')) {
          window.DGStore.deleteLead(activeSelectedLeadId);
          closeLeadModal();
          renderLeadsTables();
          showToast('Lead deleted.', 'info');
        }
      }
    });
  }
}

function openLeadDetail(leadId) {
  activeSelectedLeadId = leadId;
  const modal = document.getElementById('leadDetailModal');
  const content = document.getElementById('leadDetailContent');
  if (!modal || !content || !window.DGStore) return;

  const leads = window.DGStore.getLeads();
  const lead = leads.find((l) => l.id === leadId);
  if (!lead) return;

  const servicesList = Array.isArray(lead.services) && lead.services.length > 0 
    ? lead.services.join(', ') 
    : 'General Production';

  const dateFormatted = lead.createdAt 
    ? new Date(lead.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) 
    : 'Recently';

  content.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
      <div class="detail-row">
        <span class="detail-label">Client / Company</span>
        <span class="detail-value" style="font-size: 1.1rem; color: var(--gold-pure);">${escapeHtml(lead.name)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Status</span>
        <select class="admin-input" style="padding: 0.35rem 0.65rem; font-size: 0.8rem;" onchange="updateLeadStatusDirect('${lead.id}', this.value)">
          <option value="New" ${lead.status === 'New' ? 'selected' : ''}>New</option>
          <option value="In Discussion" ${lead.status === 'In Discussion' ? 'selected' : ''}>In Discussion</option>
          <option value="Booked" ${lead.status === 'Booked' ? 'selected' : ''}>Booked</option>
          <option value="Archived" ${lead.status === 'Archived' ? 'selected' : ''}>Archived</option>
        </select>
      </div>
      <div class="detail-row">
        <span class="detail-label">Email Address</span>
        <span class="detail-value">${escapeHtml(lead.email || 'None')}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Phone / WhatsApp</span>
        <span class="detail-value">${escapeHtml(lead.phone || 'None')}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Requested Services</span>
        <span class="detail-value">${escapeHtml(servicesList)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Budget Range</span>
        <span class="detail-value" style="color: var(--emerald);">${escapeHtml(lead.budget || 'To be discussed')}</span>
      </div>
      <div class="detail-row" style="grid-column: 1 / -1;">
        <span class="detail-label">Date Received</span>
        <span class="detail-value" style="font-size: 0.82rem; color: var(--text-muted);">${escapeHtml(dateFormatted)}</span>
      </div>
    </div>

    <div class="detail-row">
      <span class="detail-label">Production Brief & Vision</span>
      <div class="detail-message-box">${escapeHtml(lead.message || 'No brief provided.')}</div>
    </div>

    <div class="quick-contact-bar">
      ${lead.email ? `
        <a href="mailto:${encodeURIComponent(lead.email)}?subject=${encodeURIComponent('[DG PRODUCTION] Regarding your project inquiry')}" class="btn btn-gold btn-sm" target="_blank">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          Reply via Email
        </a>
      ` : ''}
      ${lead.phone ? `
        <a href="https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}" class="btn btn-outline btn-sm" target="_blank">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          WhatsApp Chat
        </a>
      ` : ''}
    </div>
  `;

  modal.classList.add('open');
}

function updateLeadStatusDirect(id, newStatus) {
  if (window.DGStore) {
    window.DGStore.updateLeadStatus(id, newStatus);
    showToast(`Status updated to "${newStatus}".`, 'success');
    renderLeadsTables();
  }
}

function closeLeadModal() {
  const modal = document.getElementById('leadDetailModal');
  if (modal) modal.classList.remove('open');
  activeSelectedLeadId = null;
}

function renderLeadsTables() {
  if (!window.DGStore) return;

  const leads = window.DGStore.getLeads();

  // 1. Render Recent Leads in Dashboard Overview (up to 5)
  const recentTableBody = document.getElementById('recentLeadsTableBody');
  if (recentTableBody) {
    if (leads.length === 0) {
      recentTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No inquiries received yet.</td></tr>`;
    } else {
      recentTableBody.innerHTML = leads.slice(0, 5).map((l) => {
        const servicesStr = Array.isArray(l.services) ? l.services.slice(0, 2).join(', ') : 'General';
        const dateStr = l.createdAt ? new Date(l.createdAt).toLocaleDateString() : 'Recent';
        return `
          <tr>
            <td>
              <div style="font-weight: 600; color: var(--text-white);">${escapeHtml(l.name)}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(l.email || l.phone || '')}</div>
            </td>
            <td><span style="font-size: 0.8rem; color: var(--text-secondary);">${escapeHtml(servicesStr)}</span></td>
            <td><span style="font-size: 0.8rem; color: var(--emerald);">${escapeHtml(l.budget || '—')}</span></td>
            <td>${renderStatusPill(l.status)}</td>
            <td><span style="font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(dateStr)}</span></td>
            <td style="text-align: right;">
              <button class="btn btn-outline btn-sm" onclick="openLeadDetail('${l.id}')">View</button>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  // 2. Render All Leads in TabLeads
  const allTableBody = document.getElementById('allLeadsTableBody');
  if (allTableBody) {
    let filtered = [...leads];

    // Filter
    const activeChip = document.querySelector('[data-lead-filter].active');
    const filterVal = activeChip ? activeChip.getAttribute('data-lead-filter') : 'all';
    if (filterVal !== 'all') {
      filtered = filtered.filter((l) => l.status === filterVal);
    }

    // Search
    const searchInput = document.getElementById('leadSearchInput');
    const searchVal = searchInput ? searchInput.value.trim().toLowerCase() : '';
    if (searchVal) {
      filtered = filtered.filter((l) => 
        (l.name && l.name.toLowerCase().includes(searchVal)) ||
        (l.email && l.email.toLowerCase().includes(searchVal)) ||
        (l.phone && l.phone.toLowerCase().includes(searchVal)) ||
        (l.message && l.message.toLowerCase().includes(searchVal))
      );
    }

    if (filtered.length === 0) {
      allTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 3rem;">No inquiries found matching criteria.</td></tr>`;
    } else {
      allTableBody.innerHTML = filtered.map((l) => {
        const servicesStr = Array.isArray(l.services) ? l.services.join(', ') : 'General';
        const dateStr = l.createdAt ? new Date(l.createdAt).toLocaleDateString() : 'Recent';
        const messagePreview = l.message ? (l.message.length > 55 ? l.message.slice(0, 55) + '...' : l.message) : '—';

        return `
          <tr>
            <td>
              <div style="font-weight: 600; color: var(--gold-pure);">${escapeHtml(l.name)}</div>
              <div style="font-size: 0.78rem; color: var(--text-secondary);">${escapeHtml(l.email || '')}</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">${escapeHtml(l.phone || '')}</div>
            </td>
            <td><span style="font-size: 0.8rem;">${escapeHtml(servicesStr)}</span></td>
            <td><span style="font-size: 0.8rem; color: var(--emerald); font-weight: 600;">${escapeHtml(l.budget || '—')}</span></td>
            <td><span style="font-size: 0.8rem; color: var(--text-secondary); font-style: italic;">"${escapeHtml(messagePreview)}"</span></td>
            <td>
              <select style="background: var(--bg-surface-elevated); color: var(--text-white); border: 1px solid var(--border-subtle); border-radius: var(--radius-xs); padding: 3px 6px; font-size: 0.72rem;" onchange="updateLeadStatusDirect('${l.id}', this.value)">
                <option value="New" ${l.status === 'New' ? 'selected' : ''}>New</option>
                <option value="In Discussion" ${l.status === 'In Discussion' ? 'selected' : ''}>In Discussion</option>
                <option value="Booked" ${l.status === 'Booked' ? 'selected' : ''}>Booked</option>
                <option value="Archived" ${l.status === 'Archived' ? 'selected' : ''}>Archived</option>
              </select>
            </td>
            <td><span style="font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(dateStr)}</span></td>
            <td style="text-align: right;">
              <div style="display: inline-flex; gap: 0.35rem;">
                <button class="btn btn-outline btn-sm" onclick="openLeadDetail('${l.id}')">View</button>
                <button class="btn btn-danger btn-sm" onclick="deleteLeadDirect('${l.id}')">×</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
  }
}

function deleteLeadDirect(id) {
  if (confirm('Delete this inquiry record?')) {
    window.DGStore.deleteLead(id);
    renderLeadsTables();
    showToast('Lead deleted.', 'info');
  }
}

function renderStatusPill(status) {
  const s = status || 'New';
  const cls = s.toLowerCase().replace(/\s+/g, '-');
  return `<span class="status-pill ${cls}">${escapeHtml(s)}</span>`;
}

function exportLeadsToCSV() {
  if (!window.DGStore) return;
  const leads = window.DGStore.getLeads();
  if (leads.length === 0) {
    alert('No leads to export.');
    return;
  }

  const headers = ['ID', 'Name', 'Email', 'Phone', 'Budget', 'Services', 'Status', 'Date', 'Message'];
  const rows = leads.map((l) => [
    l.id,
    `"${(l.name || '').replace(/"/g, '""')}"`,
    `"${(l.email || '').replace(/"/g, '""')}"`,
    `"${(l.phone || '').replace(/"/g, '""')}"`,
    `"${(l.budget || '').replace(/"/g, '""')}"`,
    `"${(Array.isArray(l.services) ? l.services.join(';') : '').replace(/"/g, '""')}"`,
    `"${(l.status || '').replace(/"/g, '""')}"`,
    `"${l.createdAt || ''}"`,
    `"${(l.message || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `dg_production_leads_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  showToast('Leads exported to CSV.', 'success');
}

/* ==========================================================================
   7. STUDIO SETTINGS & BACKUP / RESTORE
   ========================================================================== */
function initSettingsManager() {
  const statusForm = document.getElementById('studioStatusForm');
  const pwForm = document.getElementById('changePasswordForm');
  const exportBtn = document.getElementById('btnExportJSON');
  const importFileInput = document.getElementById('importJsonFileInput');
  const resetBtn = document.getElementById('btnResetDefaults');

  // Studio Settings Form
  if (statusForm && window.DGStore) {
    const settings = window.DGStore.getSettings();
    if (settings) {
      const selectStatus = document.getElementById('settingBookingStatus');
      const emailInput = document.getElementById('settingStudioEmail');
      const phoneInput = document.getElementById('settingStudioPhone');
      if (selectStatus && settings.bookingStatus) selectStatus.value = settings.bookingStatus;
      if (emailInput && settings.email) emailInput.value = settings.email;
      if (phoneInput && settings.phone) phoneInput.value = settings.phone;
    }

    statusForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const bookingStatus = document.getElementById('settingBookingStatus').value;
      const email = document.getElementById('settingStudioEmail').value.trim();
      const phone = document.getElementById('settingStudioPhone').value.trim();

      window.DGStore.updateSettings({ bookingStatus, email, phone });
      showToast('Studio settings updated successfully!', 'success');
      refreshAllViews();
    });
  }

  // Change Credentials Form (Email & Password)
  if (pwForm && window.DGStore) {
    const settings = window.DGStore.getSettings();
    const adminEmailInput = document.getElementById('settingAdminEmail');
    if (adminEmailInput && settings) {
      adminEmailInput.value = settings.adminEmail || 'olishe020@gmail.com';
    }

    pwForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newEmail = document.getElementById('settingAdminEmail').value.trim();
      const currentPw = document.getElementById('currentPasswordInput').value;
      const newPw = document.getElementById('newPasswordInput').value;
      const confirmPw = document.getElementById('confirmPasswordInput').value;

      if (newPw && newPw !== confirmPw) {
        alert('New passwords do not match. Please verify.');
        return;
      }

      const res = window.DGStore.updateCredentials(currentPw, newEmail, newPw || null);
      if (res.success) {
        document.getElementById('currentPasswordInput').value = '';
        document.getElementById('newPasswordInput').value = '';
        document.getElementById('confirmPasswordInput').value = '';
        showToast('Admin credentials updated successfully!', 'success');
      } else {
        alert(res.error || 'Failed to update credentials.');
      }
    });
  }

  // Export JSON Backup
  if (exportBtn && window.DGStore) {
    exportBtn.addEventListener('click', () => {
      const jsonStr = window.DGStore.exportJSON();
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonStr);
      const link = document.createElement('a');
      link.setAttribute('href', dataUri);
      link.setAttribute('download', `dg_production_cms_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('Full CMS snapshot exported to JSON.', 'success');
    });
  }

  // Import JSON Backup
  if (importFileInput && window.DGStore) {
    importFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;
        const res = window.DGStore.importJSON(content);
        if (res.success) {
          showToast('Database backup successfully restored!', 'success');
          refreshAllViews();
        } else {
          alert('Failed to import backup: ' + res.error);
        }
      };
      reader.readAsText(file);
      importFileInput.value = '';
    });
  }

  // Reset Defaults
  if (resetBtn && window.DGStore) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all data to initial defaults? All changes will be overwritten.')) {
        window.DGStore.resetDefaults();
        showToast('Reset to factory defaults completed.', 'info');
        refreshAllViews();
      }
    });
  }
}

/* ==========================================================================
   8. REFRESH & METRICS SYNC
   ========================================================================== */
function refreshAllViews() {
  if (!window.DGStore) return;

  const projects = window.DGStore.getProjects();
  const clients = window.DGStore.getClients();
  const leads = window.DGStore.getLeads();
  const settings = window.DGStore.getSettings();

  // Update Topbar status
  const topbarStatusText = document.getElementById('topbarStatusText');
  if (topbarStatusText && settings && settings.bookingStatus) {
    topbarStatusText.textContent = settings.bookingStatus;
  }

  // Update Badges
  const badgeProjects = document.getElementById('badgeProjectsCount');
  if (badgeProjects) badgeProjects.textContent = projects.length;

  const badgeClients = document.getElementById('badgeClientsCount');
  if (badgeClients) badgeClients.textContent = clients.length;

  const unreadLeads = leads.filter((l) => l.status === 'New').length;
  const badgeLeads = document.getElementById('badgeLeadsCount');
  if (badgeLeads) {
    badgeLeads.textContent = unreadLeads;
    badgeLeads.style.display = unreadLeads > 0 ? 'inline-block' : 'none';
  }

  // Update Dashboard Stat Cards
  const statProj = document.getElementById('statProjectsCount');
  if (statProj) statProj.textContent = projects.length;

  const statClient = document.getElementById('statClientsCount');
  if (statClient) statClient.textContent = clients.length;

  const statLeads = document.getElementById('statLeadsCount');
  if (statLeads) statLeads.textContent = leads.length;

  const statNew = document.getElementById('statNewLeadsCount');
  if (statNew) statNew.textContent = unreadLeads;

  // Render Sub-Views
  renderProjectsList();
  renderClientsList();
  renderLeadsTables();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
