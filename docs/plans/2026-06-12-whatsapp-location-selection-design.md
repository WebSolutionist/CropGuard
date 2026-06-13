# WhatsApp Location Selection via Numbered List Menu

## Problem
When farmers send crop images via WhatsApp without a text caption containing their location, the system randomly assigns a State and LGA. This causes duplicate/mismatched locations and breaks accurate outbreak detection.

## Solution
After image analysis, if no location is detected in the farmer's message, the bot sends a **numbered list menu** asking the farmer to reply with the number of their State, followed by a second list for their LGA.

## Flow
1. Farmer sends image (with or without text caption)
2. Backend runs Groq AI analysis on the image (existing)
3. `extract_location()` checks if text contains a known State/LGA
   - **If found** → save report as before (no change)
   - **If NOT found** → send numbered list of states
4. Farmer replies with a number (e.g. `3`)
5. Backend sends numbered list of LGAs for the selected state
6. Farmer replies with a number (e.g. `2`)
7. Report is saved with correct State + LGA
8. `check_outbreak()` runs on the real location

## Implementation Details

### Backend (app.py)
- Add a new endpoint or session tracking to handle multi-step conversation state
- Modify `extract_location()` to return `None` when no location found (instead of random)
- Add list formatting helpers for states and LGAs
- Store conversation state in-memory dict keyed by sender number:
  ```python
  # Tracks where each user is in the flow
  sessions = {
      "+2348012345678": {"step": "awaiting_state"}
  }
  ```

### Twilio Response Messages
**First message (after analysis, no location found):**
```
🌿 Crop: [crop]
🦠 Disease: [disease] ([confidence]%)

Now, reply with the number of your State:
1. Benue
2. Enugu
3. Kaduna
4. Kogi
5. Kwara
6. Nasarawa
7. Niger
8. Oyo
9. Plateau
10. Taraba
```

**Second message (after state selected):**
```
Reply with the number of your LGA:
1. Makurdi
2. Gboko
3. Otukpo
```

**Confirmation:**
```
✅ Report saved!
📍 [LGA], [State]
🦠 [Disease]
```

### Session State
Managed in-memory with a simple dict. Each session stores:
- `step`: Current step (`"awaiting_state"`, `"awaiting_lga"`, `"report_data"`)
- `state`: Selected state name
- `report_data`: Parsed analysis result (disease, crop, confidence, image_url)

## Files to Modify
- `app.py` — Add session tracking, modify extract_location, add list message handlers

## Out of Scope
- Persistent session storage (DB) — in-memory is sufficient for MVP
- WhatsApp interactive list components — numbered replies work universally
