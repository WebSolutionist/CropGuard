# CropGuard NG Development Memory

This file serves as the project's persistent memory log to record the state, decisions, configurations, and progress across coding sessions.

## Project Core Context
*   **Product Name**: CropGuard NG
*   **Description**: Live crop disease early warning system for Nigerian farmers with real-time Supabase integration.
*   **Aesthetic Style**: "Cinematic Green" Glassmorphism HUD (inspired by EcoFarm, EarthEye, and sleek agricultural SaaS designs).
*   **Main Tech Stack**: React SPA (Vite, Lucide-React, Recharts) + Python Flask backend.

---

## Configuration & Credentials
Credentials are loaded from environment variables (see `.env.example`).
*   **Supabase URL**: Configured via `SUPABASE_URL` / `VITE_SUPABASE_URL` env vars.

---

## Status Log & Brainstorming Points

### 1. State & Location Parsing (Numbered List Menu)
*   *Status*: **RESOLVED** ✅
*   *Observation*: When farmers submit photos without a text caption via WhatsApp, the backend received an empty request body. It fell back to random coordinates — causing mismatched locations across reports.
*   *Solution*: Implemented a **numbered list menu** flow:
    1. If no location detected in the image caption, backend stores the analysis result in session
    2. Sends a numbered list of states → farmer replies with a number
    3. Sends a numbered list of LGAs for that state → farmer replies with a number
    4. Report is saved with correct State + LGA
    5. No random fallback — location is always explicitly chosen by the farmer
*   *Files changed*: `app.py` — extract_location(), new sessions dict, format_state_list(), format_lga_list(), updated /whatsapp route

### 2. Disease Report Status
*   *Observation*: Newly logged diagnostic reports default to `"Pending"` until manually updated to `"Verified"` or `"False Positive"` via the dashboard table detail view.
*   *Action Plan*: Retain `"Pending"` as the initial triage status, but verify database sync speed and real-time frontend feedback.

### 3. Outbreak Alert Trigger Conditions
*   *Observation*: Global report count is 5, but no outbreak alert is active in the dashboard.
*   *Reasoning*: The backend `check_outbreak` function uses localized grouping. An outbreak is triggered when $\ge 2$ reports of the *same* disease are received from the *same* State.
*   *Note*: With the new location list menu, reports now have accurate State/LGA data — outbreak alerts are now reliable. Threshold set at 2 reports (state-wide) for demo-friendly triggering.

### 4. Interactive Map Node Tooltip Blinking
*   *Observation*: Hovering over/clicking the pulsing map nodes triggers a details box that disappears or blinks when moving the cursor.
*   *Action Plan*: Refactor the tooltip to either render adjacent to the pointer cursor, or transform it into a persistent floating panel that locks when a node is clicked.

### 5. Animation Speeds & Curves
*   *Observation*: Current transitions are basic and feel too fast/abrupt.
*   *Action Plan*: Slow down transitions to `800ms - 1200ms` and use organic `cubic-bezier(0.16, 1, 0.3, 1)` easing.
