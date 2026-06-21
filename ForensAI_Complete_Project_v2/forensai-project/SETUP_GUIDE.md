# ForensAI — Complete Setup Guide

## Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Python | 3.9+ | https://python.org |
| Node.js | 16+ | https://nodejs.org |
| npm | 8+ | (comes with Node.js) |
| Git | any | https://git-scm.com |

---

## Step 1 — Backend Setup

```bash
cd forensai-backend

# Install Python dependencies
pip install -r requirements.txt

# Optional: Configure Telegram alerts
# Copy env_config_template.txt to .env
# Edit .env with your Telegram bot token and chat ID

# Start the backend
uvicorn main:app --reload --port 8000
```

**Verify backend is running:**
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{"status": "online", "version": "1.0.0", "agents": 4, "features": 12}
```

---

## Step 2 — Frontend Setup

```bash
cd forensai-frontend

# Install Node dependencies
npm install

# Start the dashboard
npm start
```

Open your browser at: **http://localhost:3000**

---

## Step 3 — Quick Start (All-in-One)

### Linux/Mac:
```bash
chmod +x start.sh
./start.sh
```

### Windows:
```
Double-click start.bat
```

---

## Step 4 — Configure Telegram Alerts (Optional)

1. Create a Telegram bot via [@BotFather](https://t.me/BotFather)
2. Get your `BOT_TOKEN`
3. Get your `CHAT_ID` (send a message to your bot, then check `https://api.telegram.org/bot{TOKEN}/getUpdates`)
4. Copy `env_config_template.txt` to `.env` in the `forensai-backend` folder
5. Fill in `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`
6. Restart the backend

---

## Step 5 — Prepare Demo Audio Files

Download from [freesound.org](https://freesound.org):

| File | Search Term |
|------|-------------|
| `birds_ambient.wav` | "forest birds ambient" |
| `chainsaw.wav` | "chainsaw sound effect" |
| `gunshot.wav` | "gunshot single" |
| `unknown_sound.wav` | Record any unusual sound |

Convert to required format:
```bash
ffmpeg -i input.mp3 -ar 16000 -ac 1 output.wav
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| YAMNet download fails | Add to main.py: `import ssl; ssl._create_default_https_context = ssl._create_unverified_context` |
| Port 8000 in use | `kill $(lsof -t -i:8000)` or change port in uvicorn command |
| Port 3000 in use | Set `PORT=3001` before `npm start` |
| CORS error | Backend already has CORS enabled for all origins |
| Leaflet map blank | Check internet connection (OpenStreetMap tiles require internet) |
| npm install fails | Try `npm install --legacy-peer-deps` |

---

## API Testing

```bash
# Health check
curl http://localhost:8000/health

# Agent status
curl http://localhost:8000/agents/status

# Zone risk levels
curl http://localhost:8000/zones

# Classify audio
curl -X POST http://localhost:8000/classify \
  -F "file=@chainsaw.wav" \
  -F "zone=Zone A Nagarhole"

# All evidence
curl http://localhost:8000/evidence/all

# Forest twin state
curl http://localhost:8000/twin/state

# Predictions
curl http://localhost:8000/predict/all
```

---

## Edge AI / Raspberry Pi Deployment

1. Install Raspberry Pi OS (64-bit recommended)
2. Install Python 3.9+ and pip
3. Run backend setup steps above
4. Set `EDGE_MODE=true` in your `.env` file
5. YAMNet will be cached after first run
6. Use `POST /edge/mode {"offline": true}` to enable offline mode
7. Use `POST /edge/sync` to sync queued events when internet is available

---

*ForensAI — AI-Sthetica 2026 | "The forest has a voice. ForensAI speaks it."*
