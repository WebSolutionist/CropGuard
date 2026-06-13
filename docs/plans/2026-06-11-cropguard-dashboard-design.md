# CropGuard NG Dashboard Design Specification
**Date**: 2026-06-11  
**Project**: CropGuard NG Early Warning Dashboard  
**Objective**: Build a state-of-the-art React dashboard connected to Supabase Realtime to monitor, report, and dispatch alerts for crop diseases in Nigeria.

---

## 1. Design Aesthetics & Visual Identity
We will adopt a **"Cinematic Green" Glassmorphism** design system, inspired by leading agricultural tech designs (like *AgrixAI* and *EarthEye*), to present a highly premium, modern interface.

### A. Color Palette
*   **Deep Forest Base (Backgrounds/Sidebar)**: `#0B1C0C` (rich dark green-black)
*   **Primary Brand Green (Headers/Highlights)**: `#166534` (forest green)
*   **Vibrant Accent (Interactions/Successes)**: `#9BB525` (glowing lime-green)
*   **Light Neutrals (Main Content Area)**: `#F4F5F3` (soft off-white)
*   **Cards Surface**: White with very fine borders (`rgba(22, 101, 52, 0.08)`) and soft blurs.
*   **Alert Risk Colors**:
    *   *High Risk (Red)*: `#EF4444` (Vibrant glowing red)
    *   *Medium Risk (Orange)*: `#F59E0B` (Amber)
    *   *Low Risk (Slate)*: `#64748B` (Muted gray)

### B. Typography & Icons
*   **Font**: *Outfit* or *Inter* (Google Fonts) for a tech-forward feel.
*   **Icons**: *Lucide React* (Leaf, Bell, Users, ShieldAlert, CheckCircle2, Search, Sliders, Play).

---

## 2. Page Structure & Features

### PAGE 1 — OVERVIEW
The central entry point of the app, designed for high-impact visual monitoring.
1.  **4 Live Stat Cards**:
    *   *Total Reports Today*: Counting reports with `timestamp` matching today.
    *   *Active Outbreaks*: Outbreaks table filtered by `status = 'Active'`.
    *   *Farmers Alerted*: Sum of `farmers_alerted` from outbreaks.
    *   *States Covered*: Count of unique states in reports.
2.  **Custom Interactive SVG Map of Nigeria**:
    *   Fully vector-mapped states with custom coordinate bindings.
    *   Glowing, pulsing dots positioned on states with active reports.
    *   *Red Dot*: Active outbreak (`risk_level = 'High'`).
    *   *Yellow Dot*: Single report or medium-risk.
    *   *Green Dot*: Clear state.
3.  **Live Activity Feed**:
    *   Subscribed via Supabase Realtime to the `reports` table.
    *   Shows the last 10 reports dynamically, sorted by timestamp descending.
    *   Displays: Masked number, crop, disease, confidence, location (State, LGA), and relative time.
4.  **7-Day Reports Bar Chart**:
    *   Visual representation of daily reports over the last week.

### PAGE 2 — DISEASE REPORTS
A searchable and filterable ledger of all reports.
*   **Filters**: Crop, disease, state, status, and date range.
*   **Search**: Full text search across columns.
*   **Contextual Side Panel**: Clicking a row slides open a detailed profile containing the Twilio/WhatsApp submitted crop image, confidence score, exact coordinates/location, and farmer info.
*   **Status Management**: Users can change the status (Pending/Verified/False Positive) which writes back to Supabase in real time.

### PAGE 3 — OUTBREAK ALERTS (The Demo Climax)
A control panel displaying active outbreaks as high-impact cards.
*   **High Risk Banner**: A red, pulsing emergency notice appears at the top if there is any active outbreak with `risk_level = 'High'`.
*   **Send Alert Button**: Triggers the main demo sequence:
    1.  Updates the outbreak's `farmers_alerted` count in Supabase.
    2.  Fades in a full-screen blurred glass overlay.
    3.  Renders a central glowing logo with lime-green circular radar wave pulses and live-updating system logs.
    4.  At 2 seconds, morphs into a green checkmark indicating SMS/WhatsApp broadcast delivery.
    5.  Displays 5 sample masked Nigerian numbers (e.g. `0803****567`) with delivery success badges.

### PAGE 4 — EXTENSION WORKERS
Provides field operator management.
*   **Hardcoded Directory**: Lists 8 workers, their location, and phone numbers.
*   **Availability Dots**: Green (Active/On-call) or Gray (Away).
*   **Assign Case**: Button to open a modal where you can select an active outbreak and assign it to the worker.

---

## 3. Demo Control Center (Seed & Reset Engine)
To guarantee the demo works flawlessly, we will add a floating/subtle **"Demo Control Center"** in the header:
*   **Reset & Seed Database**: Triggers a query that clears existing reports/outbreaks, then writes the 15 seed reports distributed realistically over the last 7 days. This allows the bar chart and map dots to render fully populated right away.

---

## 4. Supabase Integration & Subscriptions
*   Realtime channels will be configured for both `reports` and `outbreaks` tables:
    ```javascript
    supabase.channel('public:reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, handleReportChange)
      .subscribe();
    ```
*   Updates to report status or outbreak alerts are synced to Supabase instantly.
