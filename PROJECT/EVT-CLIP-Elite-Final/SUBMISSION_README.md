# EVT-CLIP Submission Package

This package contains the complete, production-ready implementation of **EVT-CLIP v2.0**, along with comprehensive documentation and build guides.

## 📁 Package Contents

- **backend/**: FastAPI production server, model implementation (DAEP + CMI), and evaluation scripts.
- **frontend/**: React + TypeScript + Tailwind CSS dashboard for real-time anomaly detection.
- **documentation/**: 
  - `EVT-CLIP-Complete-Guide-V2.docx`: Full project guide, architecture deep-dive, and viva preparation.
  - `project_requirements.txt`: Original core objectives and system requirements.
- **docker-compose.yml**: Orchestration for running the entire system with one command.
- **Makefile**: Shortcut commands for installation, development, and testing.

## 🚀 Quick Start

1. **Prerequisites**: Ensure you have Docker and NVIDIA Container Toolkit installed (for GPU support).
2. **Run Everything**:
   ```bash
   docker-compose up --build
   ```
3. **Access**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## 🛠️ Manual Setup (Without Docker)

Refer to the `README.md` inside the root directory and the detailed instructions in `documentation/EVT-CLIP-Complete-Guide-V2.docx`.

---
**Developed by:** Harshitha S, Prajna K S, Ramya Manjunath Gouda, Shalini M B
**Institution:** Adichunchanagiri Institute of Technology
