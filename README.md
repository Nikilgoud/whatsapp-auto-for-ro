# 💧 RO Water Purifier Service & Renewal Engine (RO Care Pro)

> **Next-generation autonomous SaaS & operations engine for RO water purifier service providers, dealership networks, and water treatment businesses.**

Built with **Next.js 15, React 19, TypeScript, Tailwind CSS, and Meta WhatsApp Cloud API**.

---

## 🌟 Key Features

1. **🔐 Mobile Number + Passcode Authentication:**
   - Persistent session storage in `localStorage` (`ro_owner_auth_session`) — stays logged in until explicit logout.
   - Owner Mobile: `9849000000` | Passcode: `123456`.
   - **Forgot Passcode Recovery**: Secure 6-digit OTP dispatched directly to business WhatsApp with countdown timer and instant verification.
   - Dedicated explicit logout buttons with confirmation modals in top navigation and sidebar footer.

2. **📥 Excel / CSV Bulk Customer Importer:**
   - Drag & drop `.xlsx`, `.xls`, `.csv` file upload powered by SheetJS.
   - Fuzzy column detection for Name, Phone, Address/Locality, Last Service Date, Purifier Brand, and Service Charges.
   - Clean data sanitization: strictly imports sheet data without phantom consumables or arbitrary charges.
   - Automatically computes `nextDueDate` (default: 90 days or custom business interval) and preserves separate installation dates.

3. **💳 Business UPI & Payment QR Code on Invoices:**
   - Upload business UPI QR code in Business Profile.
   - Automatically renders on GST & Non-GST Sales Tax Invoices, service receipts, and PDF printouts with `Scan & Pay via UPI` badges.

4. **📅 Standard Indian Date Formatting (`DD/MM/YYYY`):**
   - Uniform date formatting across all cards, tables, inputs, filters, and invoices.

5. **💬 Multi-Language WhatsApp Automation Hub:**
   - Full support for **Telugu (`తెలుగు`)**, Hindi (`हिंदी`), English, and Hinglish.
   - Automated 30-day, 15-day, 7-day, 1-day, and due-today service & filter replacement reminders.
   - Service completion acknowledgements and invoice sharing via Meta WhatsApp Cloud API.

6. **⚡ 1-Click Desktop Launcher (`run-ro-pro.bat`):**
   - Instant startup for local shop PCs and offline environments.

---

## 🚀 100% Free Deployment Guide (Vercel)

This application can be deployed **completely free forever** on Vercel:

1. Sign in to [Vercel](https://vercel.com) using your GitHub account (`Nikilgoud`).
2. Click **"Add New..."** → **"Project"**.
3. Locate **`whatsapp-auto-for-ro`** and click **"Import"**.
4. Leave Framework as **Next.js** and click **"Deploy"**.
5. Within 1 minute, your live production app is available at `https://whatsapp-auto-for-ro.vercel.app`.

---

## 💻 Local Development

```bash
# Clone repository
git clone https://github.com/Nikilgoud/whatsapp-auto-for-ro.git
cd whatsapp-auto-for-ro

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or `http://localhost:3001` if port 3000 is occupied).

---

## 🛠️ Verification & Quality Assurance

- **TypeScript Typecheck:** `npx tsc --noEmit` (0 errors)
- **Production Build:** `npm run build` (Turbopack production build verified)
