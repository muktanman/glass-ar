# AR Sunglasses Web App (WebAR Try-On)

## 🎯 Project Goal
Build a browser-based AR web application that allows users to:
- Enable their camera
- Detect their face in real time
- Overlay 3D sunglasses on their face
- Switch between different sunglasses models

This should work smoothly on mobile browsers (iOS Safari + Android Chrome).

---

## 🧠 Core Concept
Pipeline:
Camera → Face Detection → Landmark Extraction → Transform Calculation → 3D Model Rendering

---

## 🧱 Tech Stack

### Frontend
- Next.js (React)
- TypeScript
- Tailwind CSS

### AR + Vision
- MediaPipe Face Landmarker (Web)
- WebAssembly

### 3D Rendering
- Three.js
- GLTFLoader

### Camera
- navigator.mediaDevices.getUserMedia()

### Optional Backend
- Node.js
- Supabase / Firebase
- CDN (Cloudflare / S3)

---

## 📁 Project Structure

/ar-sunglasses-app
├── /public
│   ├── /models
│   ├── /images
│   └── /wasm
├── /src
│   ├── /components
│   ├── /lib
│   ├── /hooks
│   ├── /data
│   ├── /pages
│   └── /styles
├── package.json
└── next.config.js

---

## 🔁 System Pipeline

1. Camera Initialization
2. Face Detection (MediaPipe)
3. Transform Calculation
4. 3D Rendering
5. UI Interaction

---

## 🧩 Key Modules

- faceTracking.ts
- transformUtils.ts
- threeSetup.ts
- modelLoader.ts

---

## 🧪 Product Data Example

[
  {
    "id": "sg-001",
    "name": "Aviator Black",
    "modelUrl": "/models/aviator.glb",
    "thumbnail": "/images/aviator.jpg",
    "price": 299
  }
]

---

## 🧱 MVP Features

- Camera on/off
- Face tracking
- 5 sunglasses models
- Real-time switching
- Mobile responsive UI

---

## 🚀 Development Plan

Phase 1:
- Setup project
- Camera feed
- Face tracking

Phase 2:
- Load models
- Model switching

Phase 3:
- UI + UX

Phase 4:
- Optimization + Deployment

---

## 📦 Deployment
- Vercel
- Cloudflare Pages

---

## ✅ Success Criteria

- Stable tracking
- Mobile support
- Smooth performance
