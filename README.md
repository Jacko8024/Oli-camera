# DG PRODUCTION — Premium Film Studio & CMS

Welcome to the official repository for **DG PRODUCTION**, a world-class cinematography, editing, and DaVinci Resolve color grading studio founded by **Oliyad Diriba**.

---

## Features

- **Luxury Cinematic Showcase**: 60fps fluid UI with anamorphic letterbox atmosphere, interactive before/after DaVinci color grading slider, 24fps custom cursor, and embedded YouTube lightbox theatre.
- **Header Live Status**: Displays live studio availability status (`BOOKING AVAILABLE`).
- **Full Studio Admin Panel (`/admin.html` or `/admin`)**:
  - **Login Auth**: Secure access key gate with session persistence and password management.
  - **Projects Management**: Add, edit, delete, and preview portfolio films with YouTube ID extraction, 9:16 Shorts / 16:9 Cinema aspect ratios, and custom thumbnails.
  - **Clients & Endorsements**: Add and curate verified client reviews, star ratings, and company roles.
  - **Leads & Inquiries Pipeline**: Tracks incoming project inquiries from the contact form, status updates (`New`, `In Discussion`, `Booked`, `Archived`), direct WhatsApp/Email reply links, and CSV export.
  - **Data Backup & Restore**: One-click JSON backup export, file restoration, and factory reset.
- **Vercel Ready**: Pre-configured with `vercel.json` for instant zero-config static hosting with clean URLs and security headers.

---

## Admin Access

- **Admin URL**: `https://<your-project>.vercel.app/admin` (or `admin.html` locally)
- Protected by secure Email and Password authentication. Credentials can be managed directly under **Studio Settings** in the Admin Panel.

---

## Deploying to Vercel

### Method 1: Deploy with Vercel CLI (Fastest)

1. Open your terminal in this directory:
   ```bash
   cd "c:\xampp\htdocs\oli camera"
   ```
2. Run the Vercel deployment command:
   ```bash
   npx vercel
   ```
3. Follow the CLI prompts to link or create your project.
4. For production deployment:
   ```bash
   npx vercel --prod
   ```

### Method 2: Deploy with Git & Vercel Dashboard

1. Initialize a git repository and commit your files:
   ```bash
   git init
   git add .
   git commit -m "DG PRODUCTION studio with Admin CMS and Vercel readiness"
   ```
2. Push to GitHub, GitLab, or Bitbucket.
3. Go to [vercel.com/new](https://vercel.com/new), select your repository, and click **Deploy**.
4. Vercel will automatically detect the static project and deploy it instantly!

---

## Tech Stack

- **Frontend**: HTML5, Vanilla CSS3 (Custom Luxury Dark/Gold Design System), Vanilla JavaScript (ES6+)
- **Store & Persistence**: `js/store.js` (DGStore engine with JSON Backup/Restore)
- **Deployment**: Vercel (`vercel.json`)
# Oli-camera
