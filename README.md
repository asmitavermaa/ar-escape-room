# 🔐 Spatial Escape: AI-Powered AR Escape Room
Spatial Escape is a high-performance Augmented Reality (AR) experience that merges real-time AI spatial awareness with marker-based puzzle solving. Unlike traditional AR games that rely solely on visual markers, this project uses computer vision to detect physical obstacles (like chairs or people) in your actual environment, creating a "Smart Navigation" path to guide you to hidden fragments.

## 🚀 Tech Stack & Why We Chose It

### 1. React + Vite
* **Why React?** The project requires complex state management to handle AI "Ready" states, navigation trends (Warmer/Colder), and puzzle overlays simultaneously. React's component-based architecture allows us to isolate the 3D Engine from the UI.
* **Why Vite?** Developing AR requires constant mobile testing. Vite's lightning-fast Hot Module Replacement (HMR) ensures that changes to 3D coordinates or AI logic are reflected instantly during development.

### 2. Three.js (@react-three/fiber)
* This is the core 3D engine used to render the coordinate system, the cyan navigation rings, the 3D grid, and the pulsing red "Danger Zones".

### 3. MediaPipe (DeepLab V3)
* **Spatial Awareness:** We use the DeepLab V3 model for semantic segmentation. It identifies objects like chairs, monitors, and people in the camera feed, allowing the app to "know" where physical hazards are located.
* **Custom Pixel-Scanner:** A specialized algorithm designed to detect the high-contrast patterns of Hiro and Kanji markers without needing heavy external AR libraries.

### 4. Web Speech & Spatial Audio
* **Relative Navigation:** Instead of static coordinates, the app uses "Clock-Face Navigation" (e.g., "Target at 2 o'clock") to guide the user relative to their current heading.
* **Feedback Loop:** The app provides "Warmer" and "Colder" voice cues based on distance trends and uses pitch-shifting audio pings to indicate proximity.

## 🌐 The Role of ngrok
Mobile browsers strictly block access to the Camera and Gyroscope over unencrypted `http` connections.
ngrok is used to create a secure `https` tunnel to your local development server. This allows you to:
1. Run the project on your laptop.
2. Expose it via a secure ngrok URL.
3. Open that URL on your physical iPhone or Android device to access the camera and spatial sensors in real-time.

## 🛠️ Installation & Setup

### 1. Clone and Install
```bash
git clone https://github.com/your-username/spatial-escape.git
cd spatial-escape
npm install
```

### 2. Run the Local Server
```bash
npm run dev
```
Note: Your server will likely be at `http://localhost:5173`.

### 3. Expose via ngrok
In a new terminal window, run:
```bash
npx ngrok http 5173
```
Copy the Forwarding URL (e.g., `https://a1b2-c3d4.ngrok-free.dev`).

### 4. Mobile Launch
1. Open the ngrok URL on your smartphone.
2. Grant Camera and Motion/Orientation permissions.
3. Tap the screen once to initialize the audio engine and AI scanning.

## 🎮 How to Play

**Phase 1: Navigate**
Hold your phone upright (parallel to the walls). Follow the cyan rings and the voice guide. If the rings turn red, there is a physical object like a chair in your path—reroute immediately.

**Phase 2: Search**
As you get closer, the audio pings will increase in speed. When you are within 1.5 meters, the guide will ask you to search for a physical Hiro or Kanji marker.

**Phase 3: Solve**
Center the marker in your camera feed. Once "Authenticated," a high-tech riddle panel will appear. Solve the riddle to unlock the next fragment and eventually escape.

## 📁 Project Structure
* `src/components/ARScene.tsx`: The main engine handling 3D rendering and navigation logic.
* `src/hooks/useVision.ts`: Manages the MediaPipe AI stream and the pixel-based marker scanner.
* `src/hooks/EscapeLogic.ts`: Stores puzzle data, riddles, and target 3D coordinates.
* `src/components/PuzzleUI.tsx`: The interface for the interactive riddle puzzles.