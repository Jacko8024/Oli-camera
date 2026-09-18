/**
 * DG PRODUCTION — CINEMATIC FILM STUDIO
 * Interactive UI Engine, Dynamic CMS Renderer & Video Lightbox Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  initDynamicCMS();
  initCustomCursor();
  initStickyHeader();
  initMobileDrawer();
  initColorGradingSlider();
  initPortfolioFilters();
  initVideoLightbox();
  initContactForm();
  initScrollAnimations();
});

/* ==========================================================================
   1. DYNAMIC CMS CONTENT RENDERER & STORE SYNC
   ========================================================================== */
function initDynamicCMS() {
  renderDynamicPortfolio();
  renderDynamicServices();
  renderDynamicTestimonials();
  syncStudioStatus();

  // Re-render when data updates in DGStore (e.g. from admin panel or storage event)
  window.addEventListener('dg:store:changed', () => {
    renderDynamicPortfolio();
    renderDynamicServices();
    renderDynamicTestimonials();
    syncStudioStatus();
  });

  window.addEventListener('storage', (e) => {
    if (e.key === 'DG_PRODUCTION_CMS_DATA_V1') {
      if (window.DGStore) {
        window.DGStore.data = window.DGStore.load();
        renderDynamicPortfolio();
        renderDynamicServices();
        renderDynamicTestimonials();
        syncStudioStatus();
      }
    }
  });
}

function syncStudioStatus() {
  const statusEl = document.getElementById('headerStudioStatus');
  if (!statusEl || !window.DGStore) return;
  const settings = window.DGStore.getSettings();
  if (settings && settings.bookingStatus) {
    statusEl.textContent = settings.bookingStatus.toUpperCase();
  }
}

function renderDynamicPortfolio() {
  const grid = document.getElementById('portfolioGrid');
  if (!grid || !window.DGStore) return;

  const projects = window.DGStore.getProjects();
  if (!projects || projects.length === 0) return;

  // Render cards
  grid.innerHTML = projects.map((proj) => {
    const isVertical = proj.aspect === 'vertical' || proj.aspect === '9-16';
    const spanClass = isVertical ? 'span-3 aspect-vertical' : 'span-6 aspect-widescreen';
    const aspectTag = isVertical ? '9:16 Short' : '16:9 Cinema';
    const thumbUrl = proj.thumb || `https://img.youtube.com/vi/${proj.youtubeId}/maxresdefault.jpg`;
    
    // Category display label
    let categoryDisplay = proj.category.charAt(0).toUpperCase() + proj.category.slice(1);
    if (proj.category === 'music-videos') categoryDisplay = 'Music Video';
    if (proj.category === 'creative') categoryDisplay = 'Creative & Short';
    if (proj.category === 'events') categoryDisplay = 'Events & Luxury';

    return `
      <article class="video-card ${spanClass} lightbox-trigger" 
               data-category="${escapeHtml(proj.category)}" 
               data-youtube-id="${escapeHtml(proj.youtubeId)}" 
               data-aspect="${isVertical ? 'vertical' : '16-9'}"
               tabindex="0"
               aria-label="Play ${escapeHtml(proj.title)} Video">
        <div class="video-card-thumb-wrap">
          <img src="${escapeHtml(thumbUrl)}" 
               alt="${escapeHtml(proj.title)}" 
               class="video-card-thumb" 
               onerror="this.src='https://img.youtube.com/vi/${escapeHtml(proj.youtubeId)}/hqdefault.jpg'">
          <div class="video-badge-top">
            <span class="card-tag tag-category">${escapeHtml(categoryDisplay)}</span>
            <span class="card-tag tag-aspect">${escapeHtml(aspectTag)}</span>
          </div>
          <span class="video-duration">${escapeHtml(proj.duration || '00:45')}</span>
          <div class="play-btn-overlay">
            <div class="play-circle">
              <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            </div>
          </div>
        </div>
        <div class="video-card-body">
          <h3 class="video-card-title">${escapeHtml(proj.title)}</h3>
          <p class="video-card-desc">
            ${escapeHtml(proj.description || '')}
          </p>
          <div class="video-card-meta">
            <span>${escapeHtml(proj.director || 'DG PRODUCTION')}</span>
            <span class="meta-gear">${escapeHtml(proj.gear || 'CINEMA OPTICS')}</span>
          </div>
        </div>
      </article>
    `;
  }).join('');

  // Re-apply filter if active tab is not 'all'
  const activeTab = document.querySelector('.filter-tab.active');
  if (activeTab) {
    const filter = activeTab.getAttribute('data-filter');
    if (filter && filter !== 'all') {
      applyPortfolioFilter(filter);
    }
  }
}

function renderDynamicTestimonials() {
  const container = document.getElementById('testimonialsGrid');
  if (!container || !window.DGStore) return;

  const clients = window.DGStore.getClients();
  if (!clients || clients.length === 0) return;

  container.innerHTML = clients.map((item) => {
    const stars = '★'.repeat(Math.min(5, Math.max(1, item.rating || 5)));
    const avatar = item.avatar || (item.name ? item.name.slice(0, 2).toUpperCase() : 'DG');
    
    return `
      <div class="testimonial-card">
        <div class="stars-rating">${stars}</div>
        <p class="testimonial-quote">
          "${escapeHtml(item.quote)}"
        </p>
        <div class="testimonial-client">
          <div class="client-avatar">${escapeHtml(avatar)}</div>
          <div>
            <div class="client-name">${escapeHtml(item.name)}</div>
            <div class="client-role">${escapeHtml(item.role || 'Client')}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderDynamicServices() {
  const grid = document.getElementById('servicesGrid');
  if (!grid || !window.DGStore) return;

  const settings = window.DGStore.getSettings();
  const services = window.DGStore.getServices();

  // Update Section Header (Tagline, Title, Description)
  const taglineEl = document.getElementById('servicesTagline');
  const titleEl = document.getElementById('servicesTitle');
  const descEl = document.getElementById('servicesDesc');

  if (taglineEl && settings.servicesTagline) {
    taglineEl.textContent = settings.servicesTagline;
  }
  if (titleEl && settings.servicesTitle) {
    // Style last word with gold gradient
    const parts = settings.servicesTitle.trim().split(' ');
    if (parts.length > 1) {
      const lastWord = parts.pop();
      titleEl.innerHTML = `${escapeHtml(parts.join(' '))} <span class="gold-gradient-text">${escapeHtml(lastWord)}</span>`;
    } else {
      titleEl.innerHTML = `<span class="gold-gradient-text">${escapeHtml(settings.servicesTitle)}</span>`;
    }
  }
  if (descEl && settings.servicesSubtitle) {
    descEl.textContent = settings.servicesSubtitle;
  }

  // Filter active services for live website
  const activeServices = services.filter((s) => s.active !== false);
  if (activeServices.length === 0) return;

  grid.innerHTML = activeServices.map((s) => {
    const iconSvg = getServiceIconSvg(s.icon || 'camera');
    
    const featuresHtml = Array.isArray(s.features) && s.features.length > 0
      ? `
        <ul class="service-features-list">
          ${s.features.map((f) => `
            <li>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
              ${escapeHtml(f)}
            </li>
          `).join('')}
        </ul>
      `
      : '';

    const gearHtml = Array.isArray(s.gear) && s.gear.length > 0
      ? `
        <div class="service-gear-tags">
          ${s.gear.map((g) => `<span class="gear-pill">${escapeHtml(g)}</span>`).join('')}
        </div>
      `
      : '';

    return `
      <div class="service-card">
        <div class="service-number">${escapeHtml(s.number || '00 // DISCIPLINE')}</div>
        <div class="service-icon-wrap">
          ${iconSvg}
        </div>
        <h3 class="service-title">${escapeHtml(s.title || 'Service Title')}</h3>
        <p class="service-desc">
          ${escapeHtml(s.description || '')}
        </p>
        ${featuresHtml}
        ${gearHtml}
      </div>
    `;
  }).join('');

  // Sync booking inquiry form checkboxes
  const chipsWrapper = document.getElementById('formServiceChipsWrapper');
  if (chipsWrapper && activeServices.length > 0) {
    // Preserve any currently checked states
    const checkedValues = new Set();
    chipsWrapper.querySelectorAll('input[name="services"]:checked').forEach((cb) => {
      checkedValues.add(cb.value);
    });

    chipsWrapper.innerHTML = activeServices.map((s, idx) => {
      const isChecked = checkedValues.size > 0 ? checkedValues.has(s.title) : idx < 3;
      return `
        <label class="chip-label">
          <input type="checkbox" name="services" value="${escapeHtml(s.title)}" ${isChecked ? 'checked' : ''}>
          <span class="chip-pill">${escapeHtml(s.title)}</span>
        </label>
      `;
    }).join('');
  }
}

function getServiceIconSvg(iconType) {
  switch (iconType) {
    case 'film':
      return `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="6" cy="6" r="3"></circle>
        <circle cx="6" cy="18" r="3"></circle>
        <line x1="20" y1="4" x2="8.12" y2="15.88"></line>
        <line x1="14.47" y1="14.48" x2="20" y2="20"></line>
        <line x1="8.12" y1="8.12" x2="12" y2="12"></line>
      </svg>`;
    case 'sliders':
      return `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
        <line x1="4" y1="21" x2="4" y2="14"></line>
        <line x1="4" y1="10" x2="4" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12" y2="3"></line>
        <line x1="20" y1="21" x2="20" y2="16"></line>
        <line x1="20" y1="12" x2="20" y2="3"></line>
        <line x1="1" y1="14" x2="7" y2="14"></line>
        <line x1="9" y1="8" x2="15" y2="8"></line>
        <line x1="17" y1="16" x2="23" y2="16"></line>
      </svg>`;
    case 'drone':
      return `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M4 8l5 2"></path>
        <path d="M15 14l5 2"></path>
        <path d="M8 4l2 5"></path>
        <path d="M14 15l2 5"></path>
        <circle cx="4" cy="8" r="2"></circle>
        <circle cx="20" cy="16" r="2"></circle>
        <circle cx="8" cy="4" r="2"></circle>
        <circle cx="16" cy="20" r="2"></circle>
      </svg>`;
    case 'lighting':
      return `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 18h6"></path>
        <path d="M10 22h4"></path>
        <path d="M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 6h8c1.5-1.5 3-3.5 3-6a7 7 0 0 0-7-7z"></path>
      </svg>`;
    case 'mic':
      return `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
        <line x1="12" y1="19" x2="12" y2="23"></line>
        <line x1="8" y1="23" x2="16" y2="23"></line>
      </svg>`;
    case 'sparkles':
      return `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 3l1.912 4.678a2 2 0 0 0 1.41 1.41L20 11l-4.678 1.912a2 2 0 0 0-1.41 1.41L12 19l-1.912-4.678a2 2 0 0 0-1.41-1.41L4 11l4.678-1.912a2 2 0 0 0 1.41-1.41L12 3z"></path>
        <path d="M5 3v4"></path>
        <path d="M3 5h4"></path>
      </svg>`;
    case 'camera':
    default:
      return `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
        <circle cx="12" cy="13" r="4"></circle>
      </svg>`;
  }
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

/* ==========================================================================
   2. CUSTOM CINEMATIC CURSOR & MAGNETIC HOVER
   ========================================================================== */
function initCustomCursor() {
  const cursor = document.getElementById('customCursor');
  const follower = document.getElementById('customCursorFollower');
  if (!cursor || !follower) return;

  // Disable on touch devices
  if (window.matchMedia('(pointer: coarse)').matches) {
    cursor.style.display = 'none';
    follower.style.display = 'none';
    return;
  }

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let followerX = mouseX;
  let followerY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    cursor.style.left = `${mouseX}px`;
    cursor.style.top = `${mouseY}px`;
  });

  // Smooth follower animation loop
  function renderFollower() {
    followerX += (mouseX - followerX) * 0.18;
    followerY += (mouseY - followerY) * 0.18;

    follower.style.left = `${followerX}px`;
    follower.style.top = `${followerY}px`;

    requestAnimationFrame(renderFollower);
  }
  requestAnimationFrame(renderFollower);

  // Hover targets (delegated for dynamic elements)
  document.addEventListener('mouseover', (e) => {
    const target = e.target.closest('a, button, .filter-tab, .chip-label, input, textarea, .video-card');
    if (!target) return;

    if (target.classList.contains('video-card')) {
      cursor.classList.add('play-mode');
      follower.style.display = 'none';
    } else {
      cursor.classList.add('hovering');
      follower.style.borderColor = 'var(--gold-pure)';
      follower.style.transform = 'translate(-50%, -50%) scale(1.4)';
    }
  });

  document.addEventListener('mouseout', (e) => {
    const target = e.target.closest('a, button, .filter-tab, .chip-label, input, textarea, .video-card');
    if (!target) return;

    if (target.classList.contains('video-card')) {
      cursor.classList.remove('play-mode');
      follower.style.display = 'block';
    } else {
      cursor.classList.remove('hovering');
      follower.style.borderColor = 'rgba(212, 175, 55, 0.4)';
      follower.style.transform = 'translate(-50%, -50%) scale(1)';
    }
  });
}

/* ==========================================================================
   3. STICKY HEADER & SCROLL SPY
   ========================================================================== */
function initStickyHeader() {
  const header = document.querySelector('.site-header');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // Scroll spy
    let currentId = '';
    const scrollPos = window.scrollY + 180;

    sections.forEach((section) => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        currentId = section.getAttribute('id');
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentId}`) {
        link.classList.add('active');
      }
    });
  });
}

/* ==========================================================================
   4. MOBILE DRAWER NAVIGATION
   ========================================================================== */
function initMobileDrawer() {
  const openBtn = document.getElementById('mobileMenuOpenBtn');
  const closeBtn = document.getElementById('mobileMenuCloseBtn');
  const drawer = document.getElementById('mobileDrawer');
  const backdrop = document.getElementById('drawerBackdrop');
  const drawerLinks = document.querySelectorAll('.drawer-link, .mobile-drawer .btn');

  if (!openBtn || !drawer || !backdrop) return;

  function openDrawer() {
    drawer.classList.add('open');
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  openBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);

  drawerLinks.forEach((link) => {
    link.addEventListener('click', closeDrawer);
  });
}

/* ==========================================================================
   5. COLOR GRADING LAB (BEFORE/AFTER SPLIT-VIEW SLIDER)
   ========================================================================== */
function initColorGradingSlider() {
  const viewport = document.getElementById('gradingViewport');
  const rawOverlay = document.getElementById('gradingRawOverlay');
  const rawImage = document.getElementById('gradingRawImg');
  const handle = document.getElementById('sliderHandle');

  if (!viewport || !rawOverlay || !handle) return;

  let isDragging = false;

  function updateSlider(clientX) {
    const rect = viewport.getBoundingClientRect();
    let offsetX = clientX - rect.left;

    // Clamp between 2% and 98%
    if (offsetX < rect.width * 0.02) offsetX = rect.width * 0.02;
    if (offsetX > rect.width * 0.98) offsetX = rect.width * 0.98;

    const percent = (offsetX / rect.width) * 100;

    rawOverlay.style.width = `${percent}%`;
    handle.style.left = `${percent}%`;

    // Ensure raw image matches exact width of the viewport so alignment is 1:1
    if (rawImage) {
      rawImage.style.width = `${rect.width}px`;
    }
  }

  // Sync width on window resize
  function syncDimensions() {
    const rect = viewport.getBoundingClientRect();
    if (rawImage) {
      rawImage.style.width = `${rect.width}px`;
    }
  }
  window.addEventListener('resize', syncDimensions);
  syncDimensions();

  // Mouse Drag Events
  viewport.addEventListener('mousedown', (e) => {
    isDragging = true;
    updateSlider(e.clientX);
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    updateSlider(e.clientX);
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Touch Drag Events
  viewport.addEventListener('touchstart', (e) => {
    isDragging = true;
    updateSlider(e.touches[0].clientX);
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    updateSlider(e.touches[0].clientX);
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isDragging = false;
  });

  // Keyboard accessibility
  viewport.setAttribute('tabindex', '0');
  viewport.setAttribute('role', 'slider');
  viewport.setAttribute('aria-label', 'Color grading before and after wipe comparison');
  viewport.addEventListener('keydown', (e) => {
    const currentPercent = parseFloat(handle.style.left) || 50;
    if (e.key === 'ArrowLeft') {
      const newPercent = Math.max(5, currentPercent - 5);
      rawOverlay.style.width = `${newPercent}%`;
      handle.style.left = `${newPercent}%`;
    } else if (e.key === 'ArrowRight') {
      const newPercent = Math.min(95, currentPercent + 5);
      rawOverlay.style.width = `${newPercent}%`;
      handle.style.left = `${newPercent}%`;
    }
  });
}

/* ==========================================================================
   6. PORTFOLIO CATEGORY FILTER TABS
   ========================================================================== */
function initPortfolioFilters() {
  const tabs = document.querySelectorAll('.filter-tab');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      const filter = tab.getAttribute('data-filter') || 'all';
      applyPortfolioFilter(filter);
    });
  });
}

function applyPortfolioFilter(filter) {
  const cards = document.querySelectorAll('.video-card');
  cards.forEach((card) => {
    const rawCategory = card.getAttribute('data-category') || '';
    const categories = rawCategory.toLowerCase().split(/\s+/);
    if (filter === 'all' || categories.includes(filter)) {
      card.style.display = 'block';
      setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, 20);
    } else {
      card.style.opacity = '0';
      card.style.transform = 'scale(0.95)';
      setTimeout(() => {
        card.style.display = 'none';
      }, 300);
    }
  });
}

/* ==========================================================================
   7. INTERACTIVE YOUTUBE VIDEO LIGHTBOX MODAL
   ========================================================================== */
function initVideoLightbox() {
  const modal = document.getElementById('videoModal');
  const modalContainer = document.getElementById('videoModalContainer');
  const iframeWrap = document.getElementById('modalIframeWrap');
  const closeBtn = document.getElementById('videoModalCloseBtn');

  if (!modal || !modalContainer || !iframeWrap) return;

  function openLightbox(youtubeId, aspect) {
    // Reset aspect classes
    modalContainer.classList.remove('aspect-16-9', 'aspect-9-16');

    // Adapt layout for 9:16 Shorts vs 16:9 Widescreen
    if (aspect === 'vertical' || aspect === '9-16') {
      modalContainer.classList.add('aspect-9-16');
    } else {
      modalContainer.classList.add('aspect-16-9');
    }

    // Embed YouTube player with autoplay
    iframeWrap.innerHTML = `
      <iframe 
        src="https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1" 
        title="DG PRODUCTION Video Showcase" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
        allowfullscreen>
      </iframe>
    `;

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    modal.classList.remove('open');
    iframeWrap.innerHTML = ''; // Terminate playback immediately
    document.body.style.overflow = '';
  }

  // Delegated click listener for any video card / lightbox trigger
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.lightbox-trigger');
    if (!trigger) return;

    e.preventDefault();
    const card = trigger.closest('.video-card') || trigger;
    const youtubeId = card.getAttribute('data-youtube-id');
    const aspect = card.getAttribute('data-aspect') || '16-9';

    if (youtubeId) {
      openLightbox(youtubeId, aspect);
    }
  });

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);

  // Close on outside backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeLightbox();
    }
  });

  // Close on ESC key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeLightbox();
    }
  });
}

/* ==========================================================================
   8. CONTACT FORM INQUIRY HANDLER (CMS PIPELINE + DIRECT MAIL)
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('bookingContactForm');
  const feedback = document.getElementById('formFeedback');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const nameInput = document.getElementById('clientName');
    const emailInput = document.getElementById('clientEmail');
    const phoneInput = document.getElementById('clientPhone');
    const budgetInput = document.getElementById('projectBudget');
    const messageInput = document.getElementById('projectMessage');

    // Collect selected services
    const checkedServices = [];
    document.querySelectorAll('input[name="services"]:checked').forEach((cb) => {
      checkedServices.push(cb.value);
    });

    const clientName = nameInput ? nameInput.value.trim() : '';
    const clientEmail = emailInput ? emailInput.value.trim() : '';
    const clientPhone = phoneInput ? phoneInput.value.trim() : '';
    const budget = budgetInput ? budgetInput.value : '';
    const message = messageInput ? messageInput.value.trim() : '';

    if (!clientName || !clientEmail || !message) {
      alert('Please fill out all required fields (Name, Email, and Message).');
      return;
    }

    // Save lead to DGStore CMS Leads Pipeline
    if (window.DGStore) {
      window.DGStore.addLead({
        name: clientName,
        email: clientEmail,
        phone: clientPhone,
        budget: budget,
        services: checkedServices,
        message: message
      });
    }

    // Construct Mailto link for direct transmission
    const subject = encodeURIComponent(`[Project Inquiry] DG PRODUCTION — ${clientName}`);
    const bodyContent = encodeURIComponent(
      `Hello Oliyad Diriba & DG PRODUCTION Team,\n\n` +
      `I would like to inquire about a new production project.\n\n` +
      `Client Name: ${clientName}\n` +
      `Email: ${clientEmail}\n` +
      `Phone: ${clientPhone || 'Not provided'}\n` +
      `Selected Services: ${checkedServices.join(', ') || 'General Inquiry'}\n` +
      `Estimated Budget: ${budget || 'To be discussed'}\n\n` +
      `Project Details:\n${message}\n\n` +
      `Best regards,\n${clientName}`
    );

    // Show celebratory feedback UI
    if (feedback) {
      feedback.className = 'form-feedback success';
      feedback.innerHTML = `
        <div style="background: rgba(52, 211, 153, 0.1); border: 1px solid #34D399; padding: 1.25rem; border-radius: 8px; margin-top: 1rem;">
          <p style="font-weight: 700; color: #34D399; margin-bottom: 0.4rem;">✓ Inquiry Logged to Studio System!</p>
          <p style="font-size: 0.85rem; color: #E4E4E7; margin-bottom: 0.8rem;">Your brief has been saved in our production leads pipeline. You can also send it directly via email or reach Oliyad at <strong style="color:#D4AF37;">olishe020@gmail.com</strong> / <strong style="color:#D4AF37;">+251 928 318 444</strong>.</p>
          <a href="mailto:olishe020@gmail.com?subject=${subject}&body=${bodyContent}" class="btn btn-primary" style="padding: 0.5rem 1.25rem; font-size: 0.85rem;">Send Email Confirmation →</a>
        </div>
      `;
    }

    form.reset();
  });

  // Back to Top button
  const backToTopBtn = document.getElementById('backToTopBtn');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

/* ==========================================================================
   9. SCROLL REVEAL OBSERVER
   ========================================================================== */
function initScrollAnimations() {
  const animatedElements = document.querySelectorAll(
    '.service-card, .testimonial-card, .about-text-column, .founder-frame, .comparison-wrapper'
  );

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  animatedElements.forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)';
    observer.observe(el);
  });
}
