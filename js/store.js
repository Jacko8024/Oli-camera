/**
 * DG PRODUCTION — CMS DATA STORE & PERSISTENCE ENGINE
 * Centralized Store for Projects, Clients/Endorsements, Leads, and Authentication
 */

(function(global) {
  'use strict';

  const STORAGE_KEY = 'DG_PRODUCTION_CMS_DATA_V1';
  const SESSION_KEY = 'DG_ADMIN_SESSION_ACTIVE';

  // Default seed data (matches current public site portfolio and endorsements)
  const DEFAULT_DATA = {
    settings: {
      studioName: 'DG PRODUCTION',
      studioSubtitle: 'CINEMATOGRAPHY & LAB',
      founder: 'Oliyad Diriba',
      bookingStatus: 'BOOKING AVAILABLE',
      phone: '+251 928 318 444',
      phoneSecondary: '+251 922 462 961',
      email: 'olishe020@gmail.com',
      location: 'Addis Ababa, Ethiopia • Worldwide Commissions',
      adminPassword: 'admin123' // default initial password
    },
    projects: [
      {
        id: 'proj-1',
        title: 'Commercial Cinema Set',
        category: 'commercial',
        youtubeId: '-ECsHpfm-yM',
        aspect: '9-16',
        duration: '00:45',
        description: 'Behind-the-scenes cinematography on a commercial retail shoot with multi-angle softbox diffusion and fluid handheld gimbal maneuvering.',
        director: 'DIRECTED & SHOT BY OLIYAD',
        gear: 'GIMBAL • PRIME OPTICS',
        thumb: 'assets/images/portfolio-short-1.jpg',
        featured: true,
        createdAt: '2026-08-15T10:00:00.000Z'
      },
      {
        id: 'proj-2',
        title: 'Luxury Wedding Ceremony',
        category: 'events',
        youtubeId: '2In8XBHwwwA',
        aspect: '9-16',
        duration: '00:52',
        description: 'High-end ceremonial wedding cinematography captured with a continuous smooth gimbal glide through an illuminated floral candlelit aisle.',
        director: 'CEREMONY CINEMA',
        gear: 'TRACKING • CHANDELIER',
        thumb: 'assets/images/portfolio-short-2.jpg',
        featured: true,
        createdAt: '2026-08-20T12:30:00.000Z'
      },
      {
        id: 'proj-3',
        title: 'Broadcast & TV Interview',
        category: 'commercial',
        youtubeId: 'KZ65qIyzCEo',
        aspect: '9-16',
        duration: '00:38',
        description: "Executive multi-camera studio production for 'The iCapital', featuring multi-angle Canon EOS R cinema rigs and pristine audio capture.",
        director: 'THE iCAPITAL PRODUCTION',
        gear: 'CANON EOS R • MULTI-CAM',
        thumb: 'assets/images/portfolio-short-3.jpg',
        featured: true,
        createdAt: '2026-08-25T15:15:00.000Z'
      },
      {
        id: 'proj-4',
        title: 'Studio Dialogue & Lighting',
        category: 'creative',
        youtubeId: 'NvFqm8RtGPc',
        aspect: '9-16',
        duration: '00:41',
        description: 'Intimate narrative lighting setup with large lantern dome diffusion, rim accents, and prime cinema lens depth for evocative storytelling.',
        director: 'STUDIO CINEMA',
        gear: 'DOME DIFFUSION • 4K',
        thumb: 'assets/images/portfolio-short-4.jpg',
        featured: true,
        createdAt: '2026-09-01T09:45:00.000Z'
      }
    ],
    clients: [
      {
        id: 'client-1',
        name: 'Marcus K.',
        role: 'Music Executive & Label Director',
        quote: "Oliyad and the DG PRODUCTION team took our music video to a level we didn't think was possible. The lighting setup and the final color grade made it look like a feature film. Absolutely world-class.",
        rating: 5,
        avatar: 'MK',
        createdAt: '2026-08-10T14:00:00.000Z'
      },
      {
        id: 'client-2',
        name: 'Sarah Al-Mansoor',
        role: 'Creative Agency Head, RedDot Studio',
        quote: "Their mastery of DaVinci Resolve color grading completely transformed our commercial campaign. The client was blown away during the color review session. DG PRODUCTION is our first call on every shoot.",
        rating: 5,
        avatar: 'SA',
        createdAt: '2026-08-18T16:20:00.000Z'
      },
      {
        id: 'client-3',
        name: 'Tewodros D.',
        role: 'Film Director & Producer',
        quote: "Rarely do you meet a cinematographer who understands both the raw technical intricacies of camera sensors and the emotional core of editing. Fast, professional, and endlessly creative.",
        rating: 5,
        avatar: 'TD',
        createdAt: '2026-08-28T11:10:00.000Z'
      }
    ],
    leads: [
      {
        id: 'lead-1',
        name: 'Elena Vance',
        email: 'elena@redbullmedia.com',
        phone: '+251 911 234 567',
        budget: '$5,000 - $15,000',
        services: ['Cinematography', 'Color Grading'],
        message: 'Looking for high-speed sports cinematography and dynamic grading for our upcoming regional documentary.',
        status: 'In Discussion',
        createdAt: '2026-09-10T08:30:00.000Z'
      }
    ]
  };

  class Store {
    constructor() {
      this.data = this.load();
    }

    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
          this.saveToStorage(DEFAULT_DATA);
          return JSON.parse(JSON.stringify(DEFAULT_DATA));
        }
        const parsed = JSON.parse(raw);
        // Guarantee schemas exist
        parsed.settings = Object.assign({}, DEFAULT_DATA.settings, parsed.settings || {});
        parsed.projects = Array.isArray(parsed.projects) ? parsed.projects : DEFAULT_DATA.projects;
        parsed.clients = Array.isArray(parsed.clients) ? parsed.clients : DEFAULT_DATA.clients;
        parsed.leads = Array.isArray(parsed.leads) ? parsed.leads : DEFAULT_DATA.leads;
        return parsed;
      } catch (err) {
        console.error('[DGStore] Error reading storage, using defaults:', err);
        return JSON.parse(JSON.stringify(DEFAULT_DATA));
      }
    }

    saveToStorage(data) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        this.emitChange();
      } catch (err) {
        console.error('[DGStore] Failed to write to localStorage:', err);
      }
    }

    emitChange() {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dg:store:changed', { detail: this.data }));
      }
    }

    /* ---------------- AUTHENTICATION ---------------- */
    isAuthenticated() {
      try {
        return sessionStorage.getItem(SESSION_KEY) === 'true' || localStorage.getItem(SESSION_KEY) === 'true';
      } catch (e) {
        return false;
      }
    }

    login(password, rememberMe = true) {
      const currentPw = this.data.settings.adminPassword || 'admin123';
      if (password === currentPw) {
        if (rememberMe) {
          localStorage.setItem(SESSION_KEY, 'true');
        }
        sessionStorage.setItem(SESSION_KEY, 'true');
        return { success: true };
      }
      return { success: false, error: 'Invalid password. Please try again.' };
    }

    logout() {
      try {
        sessionStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(SESSION_KEY);
      } catch (e) {}
    }

    changePassword(currentPw, newPw) {
      const actualPw = this.data.settings.adminPassword || 'admin123';
      if (currentPw !== actualPw) {
        return { success: false, error: 'Current password does not match.' };
      }
      if (!newPw || newPw.length < 4) {
        return { success: false, error: 'New password must be at least 4 characters long.' };
      }
      this.data.settings.adminPassword = newPw;
      this.saveToStorage(this.data);
      return { success: true };
    }

    /* ---------------- SETTINGS ---------------- */
    getSettings() {
      return Object.assign({}, this.data.settings);
    }

    updateSettings(newSettings) {
      this.data.settings = Object.assign({}, this.data.settings, newSettings);
      this.saveToStorage(this.data);
      return this.data.settings;
    }

    /* ---------------- PROJECTS ---------------- */
    getProjects() {
      return [...this.data.projects];
    }

    getProjectById(id) {
      return this.data.projects.find((p) => p.id === id) || null;
    }

    saveProject(project) {
      if (!project.id) {
        project.id = 'proj-' + Date.now();
        project.createdAt = new Date().toISOString();
        this.data.projects.unshift(project);
      } else {
        const index = this.data.projects.findIndex((p) => p.id === project.id);
        if (index >= 0) {
          this.data.projects[index] = Object.assign({}, this.data.projects[index], project, {
            updatedAt: new Date().toISOString()
          });
        } else {
          this.data.projects.unshift(project);
        }
      }
      this.saveToStorage(this.data);
      return project;
    }

    deleteProject(id) {
      this.data.projects = this.data.projects.filter((p) => p.id !== id);
      this.saveToStorage(this.data);
      return true;
    }

    /* ---------------- CLIENTS / REVIEWS ---------------- */
    getClients() {
      return [...this.data.clients];
    }

    getClientById(id) {
      return this.data.clients.find((c) => c.id === id) || null;
    }

    saveClient(client) {
      if (!client.id) {
        client.id = 'client-' + Date.now();
        client.createdAt = new Date().toISOString();
        if (!client.avatar && client.name) {
          client.avatar = client.name
            .split(' ')
            .map((w) => w[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
        }
        this.data.clients.unshift(client);
      } else {
        const index = this.data.clients.findIndex((c) => c.id === client.id);
        if (index >= 0) {
          this.data.clients[index] = Object.assign({}, this.data.clients[index], client, {
            updatedAt: new Date().toISOString()
          });
        } else {
          this.data.clients.unshift(client);
        }
      }
      this.saveToStorage(this.data);
      return client;
    }

    deleteClient(id) {
      this.data.clients = this.data.clients.filter((c) => c.id !== id);
      this.saveToStorage(this.data);
      return true;
    }

    /* ---------------- LEADS / INQUIRIES ---------------- */
    getLeads() {
      return [...this.data.leads];
    }

    addLead(lead) {
      const newLead = {
        id: 'lead-' + Date.now(),
        name: lead.name || 'Anonymous Client',
        email: lead.email || '',
        phone: lead.phone || '',
        budget: lead.budget || 'To be discussed',
        services: Array.isArray(lead.services) ? lead.services : [],
        message: lead.message || '',
        status: 'New',
        createdAt: new Date().toISOString()
      };
      this.data.leads.unshift(newLead);
      this.saveToStorage(this.data);
      return newLead;
    }

    updateLeadStatus(id, status) {
      const lead = this.data.leads.find((l) => l.id === id);
      if (lead) {
        lead.status = status;
        lead.updatedAt = new Date().toISOString();
        this.saveToStorage(this.data);
        return lead;
      }
      return null;
    }

    deleteLead(id) {
      this.data.leads = this.data.leads.filter((l) => l.id !== id);
      this.saveToStorage(this.data);
      return true;
    }

    /* ---------------- BACKUP, RESTORE & EXPORT ---------------- */
    exportJSON() {
      return JSON.stringify(this.data, null, 2);
    }

    importJSON(jsonString) {
      try {
        const parsed = JSON.parse(jsonString);
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Invalid JSON format');
        }
        if (!Array.isArray(parsed.projects) || !Array.isArray(parsed.clients) || !Array.isArray(parsed.leads)) {
          throw new Error('Missing core schemas in imported backup');
        }
        this.data = parsed;
        this.saveToStorage(this.data);
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    resetDefaults() {
      this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
      this.saveToStorage(this.data);
      return true;
    }
  }

  // Instantiate singleton
  global.DGStore = new Store();
})(typeof window !== 'undefined' ? window : this);
