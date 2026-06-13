import os
import json
import base64
import threading
from datetime import datetime, timezone

from flask import Flask, request, jsonify, render_template_string, send_from_directory
from twilio.twiml.messaging_response import MessagingResponse
from twilio.rest import Client
from groq import Groq
from supabase import create_client
import requests

app = Flask(__name__)

# ─── CONFIG (from environment variables) ──────────────
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN  = os.environ.get("TWILIO_AUTH_TOKEN")
GROQ_API_KEY       = os.environ.get("GROQ_API_KEY")
SUPABASE_URL       = os.environ.get("SUPABASE_URL")
SUPABASE_KEY       = os.environ.get("SUPABASE_KEY")
TWILIO_WHATSAPP_NUMBER = os.environ.get("TWILIO_WHATSAPP_NUMBER", "whatsapp:+14155238886")

# ─── CLIENTS ──────────────────────────────────────────
twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN else None
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None
supabase = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

# ─── SUBSCRIBERS STORAGE ─────────────────────────────
SUBSCRIBERS_FILE = os.path.join(os.path.dirname(__file__), "..", "subscribers.json")


def load_subscribers():
    if os.path.exists(SUBSCRIBERS_FILE):
        with open(SUBSCRIBERS_FILE, "r") as f:
            return json.load(f)
    return {}


def save_subscribers(data):
    with open(SUBSCRIBERS_FILE, "w") as f:
        json.dump(data, f, indent=2)


def add_subscriber(phone, state, lga):
    data = load_subscribers()
    phone_clean = phone.replace("whatsapp:", "")
    if phone_clean not in data:
        data[phone_clean] = {"state": state, "lga": lga}
        save_subscribers(data)
        print(f"Subscriber added: {phone_clean} in {lga}, {state}")


def get_subscribers_by_state(state):
    data = load_subscribers()
    return [phone for phone, info in data.items() if info["state"].lower() == state.lower()]


# ─── HELPERS ──────────────────────────────────────────
def detect_crop(disease_name):
    d = disease_name.lower()
    if "armyworm" in d or "streak" in d or "rust" in d:
        return "Maize"
    elif "cassava" in d or "mosaic" in d:
        return "Cassava"
    elif "blight" in d or "tomato" in d:
        return "Tomato"
    elif "yam" in d:
        return "Yam"
    elif "groundnut" in d or "rosette" in d:
        return "Groundnut"
    elif "rice" in d or "brown spot" in d:
        return "Rice"
    else:
        return "Mixed Crops"


def mask_number(sender):
    number = sender.replace("whatsapp:", "").replace("+", "")
    if len(number) >= 6:
        return number[:4] + "****" + number[-3:]
    return "Unknown"


def extract_field(text, field_name):
    for line in text.split("\n"):
        if field_name.lower() in line.lower():
            parts = line.split(":", 1)
            if len(parts) > 1:
                return parts[1].strip()
    return "Unknown"


def identify_disease(image_url):
    if not groq_client:
        return "Analysis unavailable: GROQ_API_KEY not configured."
    try:
        img_response = requests.get(
            image_url,
            auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        )
        img_data = img_response.content
        img_base64 = base64.b64encode(img_data).decode("utf-8")

        response = groq_client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            temperature=0,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{img_base64}"
                            }
                        },
                        {
                            "type": "text",
                            "text": """You are CropGuard NG, a crop disease helper for Nigerian farmers. Use very simple English.

Look at this crop image and reply in this exact format:

Detected: [disease name or 'Healthy crop']
Confidence: [High/Medium/Low]

Cause: [one short sentence in simple English]

Action: [2 simple steps the farmer can do right now, in plain English]"""
                        }
                    ]
                }
            ],
            max_tokens=400
        )

        return response.choices[0].message.content

    except Exception as e:
        print("Groq Error:", e)
        return f"Analysis failed. Error: {str(e)}"


NIGERIAN_LOCATIONS = {
    "benue": {"state": "Benue", "lgas": ["makurdi", "gboko", "otukpo"]},
    "kogi": {"state": "Kogi", "lgas": ["lokoja", "ankpa", "okene"]},
    "plateau": {"state": "Plateau", "lgas": ["jos north", "jos south", "pankshin"]},
    "kaduna": {"state": "Kaduna", "lgas": ["zaria", "kafanchan", "kaduna north"]},
    "oyo": {"state": "Oyo", "lgas": ["ibadan north", "ibadan south", "oyo west"]},
    "enugu": {"state": "Enugu", "lgas": ["enugu north", "nsukka", "udi"]},
    "anambra": {"state": "Anambra", "lgas": ["onitsha", "awka north", "nnewi north"]},
    "nasarawa": {"state": "Nasarawa", "lgas": ["lafia", "karu", "akersa"]},
    "kwara": {"state": "Kwara", "lgas": ["ilorin", "offa", "irepodun"]},
    "taraba": {"state": "Taraba", "lgas": ["jalingo", "wukari", "bali"]},
    "niger": {"state": "Niger", "lgas": ["bida", "minna", "chanchaga"]}
}

STATE_KEYS = list(NIGERIAN_LOCATIONS.keys())
sessions = {}


def format_state_list():
    lines = ["Select your State - Reply with the number:"]
    for i, key in enumerate(STATE_KEYS, 1):
        lines.append(f"{i}. {NIGERIAN_LOCATIONS[key]['state']}")
    return "\n".join(lines)


def format_lga_list(state_key):
    loc = NIGERIAN_LOCATIONS.get(state_key)
    if not loc:
        return None
    lines = [f"Select your LGA in {loc['state']} - Reply with the number:"]
    for i, lga in enumerate(loc["lgas"], 1):
        lines.append(f"{i}. {lga.title()}")
    return "\n".join(lines)


def extract_location(text):
    if not text:
        return None, None
    text_lower = text.lower()
    for state_key, loc_info in NIGERIAN_LOCATIONS.items():
        for lga in loc_info["lgas"]:
            if lga in text_lower:
                return loc_info["state"], lga.title()
    for state_key, loc_info in NIGERIAN_LOCATIONS.items():
        if state_key in text_lower:
            return loc_info["state"], loc_info["lgas"][0].title()
    return None, None


def save_report(sender, disease, confidence, crop, state, lga, image_url=None):
    if not supabase:
        print("Supabase not configured, skipping report save")
        return
    try:
        report = {
            "farmer_number": mask_number(sender),
            "disease":       disease,
            "confidence":    confidence,
            "crop":          crop,
            "state":         state,
            "lga":           lga,
            "status":        "Pending",
            "timestamp":     datetime.now(timezone.utc).isoformat(),
            "image_url":     image_url
        }
        supabase.table("reports").insert(report).execute()
        print(f"Report saved: {disease} | {crop} | {confidence} | {lga}, {state}")
        check_outbreak(disease, state, lga, sender)
    except Exception as e:
        print("Supabase save error:", str(e))


def check_outbreak(disease_name, state, lga, sender=None):
    if not supabase:
        return
    try:
        result = supabase.table("reports")\
            .select("*")\
            .eq("disease", disease_name)\
            .eq("state", state)\
            .execute()

        report_count = len(result.data)
        print(f"Outbreak check: {disease_name} in {state} has {report_count} reports")

        if report_count >= 2:
            existing = supabase.table("outbreaks")\
                .select("*")\
                .eq("disease", disease_name)\
                .eq("state", state)\
                .eq("status", "Active")\
                .execute()

            if not existing.data:
                outbreak = {
                    "disease":         disease_name,
                    "state":           state,
                    "lga":             lga,
                    "report_count":    report_count,
                    "risk_level":      "High" if report_count >= 3 else "Medium",
                    "farmers_alerted": 0,
                    "status":          "Active",
                    "timestamp":       datetime.now(timezone.utc).isoformat()
                }
                supabase.table("outbreaks").insert(outbreak).execute()
                print(f"Outbreak created: {disease_name} in {state}")
            else:
                supabase.table("outbreaks")\
                    .update({
                        "report_count":    report_count,
                        "risk_level":      "High" if report_count >= 3 else "Medium",
                        "farmers_alerted": report_count * 15
                    })\
                    .eq("disease", disease_name)\
                    .eq("state", state)\
                    .eq("status", "Active")\
                    .execute()
                print(f"Outbreak updated: {disease_name} in {state}")
    except Exception as e:
        print("Outbreak check error:", e)


# ─── DASHBOARD SPA (built React app, served at /) ────
DASHBOARD_DIST = os.path.join(os.path.dirname(__file__), "..", "dashboard", "dist")


@app.route("/")
def dashboard_index():
    return send_from_directory(DASHBOARD_DIST, "index.html")


@app.route("/assets/<path:filename>")
def dashboard_assets(filename):
    return send_from_directory(DASHBOARD_DIST, os.path.join("assets", filename))


@app.route("/favicon.svg")
def dashboard_favicon():
    return send_from_directory(DASHBOARD_DIST, "favicon.svg")


@app.route("/icons.svg")
def dashboard_icons():
    return send_from_directory(DASHBOARD_DIST, "icons.svg")


# ─── DEMO: Analyze image page ────────────────────────
DEMO_PAGE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CropGuard NG - Analyze Crop</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0f0a; color: #e0e0e0; min-height: 100vh; }
  .container { max-width: 800px; margin: 0 auto; padding: 2rem 1rem; }
  header { text-align: center; margin-bottom: 2rem; }
  h1 { color: #7cff7c; font-size: 2rem; margin-bottom: 0.5rem; }
  .subtitle { color: #888; font-size: 0.9rem; }
  .card { background: #141a14; border: 1px solid #2a3a2a; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
  .card h2 { color: #7cff7c; margin-bottom: 1rem; font-size: 1.2rem; }
  .upload-area { border: 2px dashed #3a5a3a; border-radius: 8px; padding: 2rem; text-align: center; cursor: pointer; transition: border-color 0.3s; }
  .upload-area:hover { border-color: #7cff7c; }
  .upload-area input { display: none; }
  .upload-label { color: #aaa; font-size: 0.9rem; }
  .preview { max-width: 100%; max-height: 300px; margin-top: 1rem; border-radius: 8px; display: none; }
  .btn { background: #7cff7c; color: #0a0f0a; border: none; padding: 0.75rem 2rem; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: opacity 0.3s; margin-top: 1rem; }
  .btn:hover { opacity: 0.9; }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .result { margin-top: 1rem; padding: 1rem; background: #1a221a; border-radius: 8px; white-space: pre-wrap; font-family: monospace; font-size: 0.85rem; display: none; line-height: 1.6; }
  .result.show { display: block; }
  .error { color: #ff6b6b; }
  .loading { text-align: center; padding: 2rem; display: none; }
  .spinner { width: 40px; height: 40px; border: 3px solid #2a3a2a; border-top-color: #7cff7c; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .footer { text-align: center; color: #555; font-size: 0.8rem; margin-top: 3rem; }
  .badge { display: inline-block; background: #1a3a1a; color: #7cff7c; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; margin-bottom: 1rem; }
  .nav-link { display: inline-block; color: #7cff7c; text-decoration: none; font-size: 0.9rem; padding: 0.5rem 1rem; border: 1px solid #2a3a2a; border-radius: 6px; transition: border-color 0.3s; margin-bottom: 1rem; }
  .nav-link:hover { border-color: #7cff7c; }
</style>
</head>
<body>
<div class="container">
  <header>
    <div class="badge">AI-Powered Crop Disease Detection</div>
    <h1>CropGuard NG</h1>
    <p class="subtitle">Protecting Nigerian Farms, One Alert at a Time</p>
    <a href="/" class="nav-link">Back to Dashboard</a>
  </header>

  <div class="card">
    <h2>Upload a crop image for AI analysis</h2>
    <p style="color:#888;font-size:0.85rem;margin-bottom:1rem;">
      Take a photo of a diseased crop leaf and see instant diagnosis.
    </p>
    <form id="uploadForm">
      <div class="upload-area" id="dropArea">
        <input type="file" id="imageInput" accept="image/*" capture="environment">
        <div class="upload-label">Tap to take a photo or choose an image</div>
        <img id="preview" class="preview" alt="Preview">
      </div>
      <div style="text-align:center">
        <button type="submit" class="btn" id="analyzeBtn" disabled>Analyze Crop Image</button>
      </div>
    </form>
  </div>

  <div class="loading" id="loading">
    <div class="spinner"></div>
    <p>Analyzing your crop image with AI...</p>
  </div>

  <div class="card" id="resultCard" style="display:none">
    <h2>Analysis Result</h2>
    <div class="result" id="result"></div>
  </div>

  <div class="footer">
    <p>Built for Nigerian Farmers | AI by Groq (Meta Llama 4 Scout)</p>
  </div>
</div>

<script>
const dropArea = document.getElementById('dropArea');
const imageInput = document.getElementById('imageInput');
const preview = document.getElementById('preview');
const analyzeBtn = document.getElementById('analyzeBtn');
const form = document.getElementById('uploadForm');
const loading = document.getElementById('loading');
const resultCard = document.getElementById('resultCard');
const resultDiv = document.getElementById('result');

dropArea.addEventListener('click', () => imageInput.click());

imageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      preview.src = ev.target.result;
      preview.style.display = 'block';
      analyzeBtn.disabled = false;
    };
    reader.readAsDataURL(file);
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const file = imageInput.files[0];
  if (!file) return;

  analyzeBtn.disabled = true;
  analyzeBtn.textContent = 'Analyzing...';
  loading.style.display = 'block';
  resultCard.style.display = 'none';

  const formData = new FormData();
  formData.append('image', file);

  try {
    const res = await fetch('/api/analyze', { method: 'POST', body: formData });
    const data = await res.json();
    loading.style.display = 'none';
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = 'Analyze Crop Image';

    if (data.success) {
      resultDiv.textContent = data.analysis;
      resultDiv.className = 'result show';
      resultCard.style.display = 'block';
    } else {
      resultDiv.textContent = 'Error: ' + (data.error || 'Analysis failed');
      resultDiv.className = 'result show error';
      resultCard.style.display = 'block';
    }
  } catch (err) {
    loading.style.display = 'none';
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = 'Analyze Crop Image';
    resultDiv.textContent = 'Network error: ' + err.message;
    resultDiv.className = 'result show error';
    resultCard.style.display = 'block';
  }
});
</script>
</body>
</html>"""


@app.route("/analyze", methods=["GET"])
def demo_page():
    return render_template_string(DEMO_PAGE)


# ─── API: Analyze image (for web demo) ───────────────
@app.route("/api/analyze", methods=["POST"])
def analyze_image():
    if "image" not in request.files:
        return jsonify({"success": False, "error": "No image file provided"}), 400
    file = request.files["image"]
    if file.filename == "":
        return jsonify({"success": False, "error": "Empty filename"}), 400
    try:
        img_data = file.read()
        img_base64 = base64.b64encode(img_data).decode("utf-8")

        if not groq_client:
            return jsonify({"success": False, "error": "GROQ_API_KEY not configured on server"}), 500

        response = groq_client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            temperature=0,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{img_base64}"
                            }
                        },
                        {
                            "type": "text",
                            "text": """You are CropGuard NG, a crop disease helper for Nigerian farmers. Use very simple English.

Look at this crop image and reply in this exact format:

Detected: [disease name or 'Healthy crop']
Confidence: [High/Medium/Low]

Cause: [one short sentence in simple English]

Action: [2 simple steps the farmer can do right now, in plain English]"""
                        }
                    ]
                }
            ],
            max_tokens=400
        )

        analysis = response.choices[0].message.content
        return jsonify({"success": True, "analysis": analysis})

    except Exception as e:
        print("Analyze error:", e)
        return jsonify({"success": False, "error": str(e)}), 500


# ─── TWILIO WHATSAPP WEBHOOK ──────────────────────────
@app.route("/whatsapp", methods=["POST"])
def whatsapp_reply():
    incoming_msg = request.values.get("Body", "").strip()
    media_url = request.values.get("MediaUrl0", None)
    sender = request.values.get("From", "")

    resp = MessagingResponse()
    msg = resp.message()
    incoming_lower = incoming_msg.lower()

    if not media_url and sender in sessions:
        session = sessions[sender]

        if session["step"] == "processing":
            msg.body("Still analyzing your image. Please wait...")
            return str(resp)

        if session["step"] == "awaiting_state":
            try:
                num = int(incoming_msg.strip())
                key = STATE_KEYS[num - 1]
                session["state_key"] = key
                session["state_name"] = NIGERIAN_LOCATIONS[key]["state"]
                session["step"] = "awaiting_lga"
                msg.body(format_lga_list(key))
            except (ValueError, IndexError):
                msg.body(
                    f"Please reply with a valid number (1-{len(STATE_KEYS)}).\n\n"
                    + format_state_list()
                )
            return str(resp)

        if session["step"] == "awaiting_lga":
            try:
                num = int(incoming_msg.strip())
                key = session["state_key"]
                lga = NIGERIAN_LOCATIONS[key]["lgas"][num - 1].title()
                data = session["report_data"]
                save_report(
                    sender, data["disease"], data["confidence"],
                    data["crop"], session["state_name"], lga, data["image_url"]
                )
                add_subscriber(sender, session["state_name"], lga)
                msg.body(
                    f"Report saved!\n"
                    f"Location: {lga}, {session['state_name']}\n"
                    f"Disease: {data['disease']} ({data['confidence']})"
                )
                del sessions[sender]
            except (ValueError, IndexError):
                key = session["state_key"]
                msg.body(
                    f"Please reply with a valid number (1-{len(NIGERIAN_LOCATIONS[key]['lgas'])}).\n\n"
                    + format_lga_list(key)
                )
            return str(resp)

    if media_url:
        msg.body("Analyzing your crop image... One moment.")
        sessions[sender] = {"step": "processing"}

        def process_async():
            try:
                result = identify_disease(media_url)
                disease = extract_field(result, "Detected")
                confidence = extract_field(result, "Confidence")
                crop = detect_crop(disease)

                state, lga = extract_location(incoming_msg)

                if state and lga:
                    save_report(sender, disease, confidence, crop, state, lga, media_url)
                    add_subscriber(sender, state, lga)
                    if twilio_client:
                        twilio_client.messages.create(
                            body=result,
                            from_=TWILIO_WHATSAPP_NUMBER,
                            to=sender
                        )
                else:
                    sessions[sender] = {
                        "step": "awaiting_state",
                        "report_data": {
                            "disease":    disease,
                            "confidence": confidence,
                            "crop":       crop,
                            "image_url":  media_url
                        }
                    }
                    if twilio_client:
                        twilio_client.messages.create(
                            body=result + "\n\nWhere is your farm?\n\n" + format_state_list(),
                            from_=TWILIO_WHATSAPP_NUMBER,
                            to=sender
                        )
            except Exception as e:
                print("Background processing error:", e)
                try:
                    if twilio_client:
                        twilio_client.messages.create(
                            body="Sorry, analysis failed. Please try again.",
                            from_=TWILIO_WHATSAPP_NUMBER,
                            to=sender
                        )
                except:
                    pass
                if sender in sessions:
                    del sessions[sender]

        thread = threading.Thread(target=process_async)
        thread.daemon = True
        thread.start()
        return str(resp)

    elif "help" in incoming_lower:
        msg.body(
            "Extension Worker Contacts\n\n"
            "Benue State: 08012345678\n"
            "Kogi State: 08087654321\n"
            "Plateau State: 08023456789\n"
            "Kaduna State: 08034567890\n"
            "Enugu State: 08056789012\n\n"
            "Or visit your nearest NASC office."
        )

    elif "alert" in incoming_lower:
        if not supabase:
            msg.body("Alert system unavailable (Supabase not configured).")
            return str(resp)
        try:
            outbreaks = supabase.table("outbreaks")\
                .select("*")\
                .eq("status", "Active")\
                .execute()

            if outbreaks.data:
                alert_text = "Active Outbreaks Near You\n\n"
                for o in outbreaks.data[:3]:
                    risk = "HIGH" if o["risk_level"] == "High" else "MEDIUM"
                    alert_text += f"{o['disease']} - {o['lga']} LGA, {o['state']} ({o['report_count']} reports) [Risk: {risk}]\n"
                alert_text += "\nSend a crop photo for instant analysis."
                msg.body(alert_text)
            else:
                msg.body("No active outbreaks in your area right now.")
        except Exception as e:
            print("Alert fetch error:", e)
            msg.body("Could not fetch alerts right now.")

    elif incoming_lower.startswith("subscribe"):
        parts = incoming_msg.split(" ", 1)
        if len(parts) == 2:
            loc_text = parts[1]
            state, lga = extract_location(loc_text)
            if state and lga:
                add_subscriber(sender, state, lga)
                msg.body(f"You're now subscribed to outbreak alerts for {lga}, {state}.")
            else:
                msg.body("Please type your location like: SUBSCRIBE Benue, Makurdi")
        else:
            msg.body("Type: SUBSCRIBE [State], [LGA]\nExample: SUBSCRIBE Benue, Makurdi")

    else:
        msg.body(
            "Welcome to CropGuard NG\n\n"
            "I help Nigerian farmers detect crop diseases instantly using AI.\n\n"
            "Commands:\n"
            "Send a photo -> Instant disease analysis\n"
            "HELP -> Extension worker contacts\n"
            "ALERT -> Active outbreaks near you\n"
            "SUBSCRIBE [State], [LGA] -> Get outbreak alerts for your area"
        )

    return str(resp)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "CropGuard NG is running",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "twilio_configured": twilio_client is not None,
        "groq_configured": groq_client is not None,
        "supabase_configured": supabase is not None
    })


@app.route("/api/send-outbreak-alert", methods=["POST"])
def send_outbreak_alert():
    if not supabase or not twilio_client:
        return jsonify({"error": "Supabase or Twilio not configured"}), 500
    try:
        data = request.get_json()
        outbreak_id = data.get("outbreak_id")

        if not outbreak_id:
            return jsonify({"error": "outbreak_id is required"}), 400

        result = supabase.table("outbreaks")\
            .select("*")\
            .eq("id", outbreak_id)\
            .single()\
            .execute()

        outbreak = result.data
        if not outbreak:
            return jsonify({"error": "Outbreak not found"}), 404

        state = outbreak["state"]
        disease = outbreak["disease"]
        lga = outbreak["lga"]
        report_count = outbreak["report_count"]
        risk_level = outbreak["risk_level"]

        subscribers = get_subscribers_by_state(state)
        emoji = "HIGH" if risk_level == "High" else "MEDIUM"
        alert_body = (
            f"CropGuard NG Emergency Alert\n\n"
            f"{emoji} {disease} outbreak confirmed in {state}!\n\n"
            f"Location: {lga} LGA\n"
            f"Reports: {report_count}\n"
            f"Risk: {risk_level.upper()}\n\n"
            f"Check your crops immediately and report any symptoms."
        )

        sent_count = 0
        for phone in subscribers:
            try:
                twilio_client.messages.create(
                    body=alert_body,
                    from_=TWILIO_WHATSAPP_NUMBER,
                    to=f"whatsapp:{phone}"
                )
                sent_count += 1
            except Exception as e:
                print(f"Failed to send alert to {phone}: {e}")

        supabase.table("outbreaks")\
            .update({"farmers_alerted": sent_count})\
            .eq("id", outbreak_id)\
            .execute()

        return jsonify({
            "success": True,
            "farmers_alerted": sent_count,
            "state": state,
            "disease": disease
        })

    except Exception as e:
        print("Send outbreak alert error:", e)
        return jsonify({"error": str(e)}), 500
