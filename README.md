# 🎲 VRubi - Video-to-Rubik's Cube Solver

A web app that takes camera/video input of a Rubik's cube, recognizes its state, solves it using the Kociemba algorithm, and animates the solution in 3D.

![VRubi Screenshot](https://via.placeholder.com/800x450.png?text=VRubi+Screenshot)

## ✨ Features

- **3D Cube Visualization** - Interactive Three.js cube with smooth animations
- **Kociemba Solver** - Optimal solutions in ≤22 moves (0.84s initialization)
- **Camera Scanning** - Detect cube state from camera feed
- **Color Detection** - HSL-based color recognition with multi-frame averaging
- **Mobile Friendly** - Responsive design works on all devices

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/wangtian24/vrubi.git
cd vrubi

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🎮 Usage

### Cube Mode
1. Click **Scramble** to randomly scramble the cube
2. Click **Solve** to see the optimal solution animated
3. Click **Reset** to return to solved state
4. Drag to rotate the camera view

### Scan Mode
1. Click **📷 Scan** to switch to camera mode
2. Click **Start Camera** to begin scanning
3. Show each face of your cube (centered in frame)
4. Click **Capture Face** for each of the 6 faces
5. Click **Use State** to load and solve

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Browser (Client-Side)                 │
├──────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   Camera    │───▶│   Vision    │───▶│   Solver    │  │
│  │   Module    │    │   Module    │    │   Module    │  │
│  └─────────────┘    └─────────────┘    └─────────────┘  │
│                            │                   │         │
│                            ▼                   ▼         │
│                     ┌─────────────────────────────┐      │
│                     │       3D Renderer           │      │
│                     │        (Three.js)           │      │
│                     └─────────────────────────────┘      │
└──────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
vrubi/
├── src/
│   ├── main.js           # App entry point
│   ├── camera/           # Camera capture
│   ├── vision/           # Color detection & state building
│   ├── solver/           # Kociemba algorithm (cubejs)
│   ├── render/           # Three.js cube & animations
│   └── utils/            # Cube state utilities
├── index.html            # Main page
├── CLAUDE.md             # Development roadmap
├── PROGRESS.md           # Build progress journal
└── package.json
```

## 🛠️ Tech Stack

- **Framework:** Vanilla JS + Vite
- **3D Graphics:** Three.js
- **Solver:** cubejs (Kociemba two-phase algorithm)
- **Camera:** WebRTC / getUserMedia

## 📊 Performance

| Metric | Value |
|--------|-------|
| Solver Init | ~0.84s |
| Solve Time | 0.01-0.4s |
| Max Moves | 22 |
| Animation | 200ms/move |

## 🔮 Future Ideas (Phase 5)

- [ ] AR overlay showing solution on real cube
- [ ] Voice guidance ("turn right face clockwise")
- [ ] Multiple solving methods (beginner vs speedcuber)
- [ ] Solution playback controls (pause, step, speed)

## 📝 License

MIT

## 🙏 Credits

- [cubejs](https://github.com/ldez/cubejs) - Kociemba solver implementation
- [Three.js](https://threejs.org/) - 3D graphics library
- Built with ❤️ by Tsuki (AI) for Tian
