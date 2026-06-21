#!/bin/bash
# ForensAI — Startup Script (Linux/Mac)
# "The forest has a voice. ForensAI speaks it."

echo ""
echo "🌿 =============================================="
echo "   FORENSAI — Intelligent Forest Protection"
echo "   AI-Sthetica 2026 | Harshitha + Kshema + Neha"
echo "================================================"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.9+"
    exit 1
fi

# Check Node
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 16+"
    exit 1
fi

echo "📦 Installing backend dependencies..."
cd forensai-backend
pip3 install -r requirements.txt -q
echo "✅ Backend dependencies installed"

echo ""
echo "🚀 Starting ForensAI Backend on port 8000..."
python3 -m uvicorn main:app --reload --port 8000 --host 0.0.0.0 &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

sleep 3

echo ""
echo "📦 Installing frontend dependencies..."
cd ../forensai-frontend
npm install --silent
echo "✅ Frontend dependencies installed"

echo ""
echo "🌐 Starting ForensAI Dashboard on port 3000..."
npm start &
FRONTEND_PID=$!

echo ""
echo "🌿 =============================================="
echo "   ForensAI is running!"
echo "   Backend API:  http://localhost:8000"
echo "   Dashboard:    http://localhost:3000"
echo "   Health check: http://localhost:8000/health"
echo "================================================"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap "echo ''; echo 'Stopping ForensAI...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT
wait
