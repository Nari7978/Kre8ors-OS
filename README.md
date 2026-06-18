# Kre8ors OS: Agency CRM & Creator Management Platform

Kre8ors OS is an enterprise-grade SaaS CRM built for OnlyFans Management (OFM) Agencies. The platform allows agencies to manage multiple creators, subscribers (fans), content queues, media vaults, earnings data, and real-time operator shifts while integrating with the OnlyFans API via third-party wrappers (such as `onlyfansapi.com`).

---

## 🚀 Key Modules
1. **Dashboard**: Financial analytics, performance charts, and live activity streams.
2. **Creators**: Creator integration and status checkers.
3. **Messages**: Multi-account live-chat screen with direct vault attachment and pay-to-unlock (PPV) media composer.
4. **Fans**: Advanced CRM with customized tagging, lifetime spend tracking, and messaging logs.
5. **Content**: Queue management and automatic publishing calendars.
6. **Media Vault**: Folder-structured media storage with asset search.
7. **Stories**: Scheduling dashboard for creators' story queues.
8. **Earnings**: Net revenue ledgers, payout logs, and commission calculators.
9. **Analytics**: Cohort behavior tracking, PPV conversions, and operator (chatter) performance metrics.
10. **Automations**: Welcome triggers, keyword autoresponders, and subscriber follow-up filters.
11. **AI Assistant**: Smart message generator suggesting context-aware answers.
12. **Team Management**: Role configurations (Owner, Manager, Chatter) and shifts tracker.
13. **Settings**: Webhooks, agency properties, and proxy settings.

---

## 🛠️ Technology Stack
* **Framework**: Next.js 15 (App Router, React 19)
* **Language**: TypeScript
* **Styling**: Tailwind CSS
* **Components**: shadcn/ui (Radix UI)
* **State Management**: Zustand (UI state) & TanStack Query v5 (Server State)
* **Forms & Validation**: React Hook Form & Zod
* **Database**: PostgreSQL with Prisma ORM
* **Integration Provider**: OnlyFansAPI.com REST / WebSocket Gateway

---

## 📦 Local Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Nari7978/Kre8ors-OS.git
   cd Kre8ors-OS
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/kre8ors_os?schema=public"
   JWT_SECRET="your_jwt_signing_key"
   ONLYFANS_API_KEY="your_onlyfansapi_key"
   ```

4. **Initialize Database Schema**:
   ```bash
   npx prisma db push
   ```

5. **Start Dev Server**:
   ```bash
   npm run dev
   ```

---

## 📜 Development Guidelines & Commit Flow
This repository follows a strict daily commit workflow:
- No unnecessary configuration templates or system logs are committed.
- Code additions are broken down into **7–8 granular commits per day** to keep PRs clean and trace changes logically.
