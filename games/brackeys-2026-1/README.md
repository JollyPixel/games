<p align="center"><h1 align="center">
  Brackeys 2026.1
</h1>

<p align="center">
  Entry for the <a href="https://itch.io/jam/brackeys-13">Brackeys Game Jam 2026.1</a>
</p>

## Tech Stack

- **Engine**: [@jolly-pixel/engine](https://github.com/JollyPixel) + [@jolly-pixel/runtime](https://github.com/JollyPixel)
- **Language**: TypeScript
- **Bundler**: [Vite](https://vitejs.dev/)
- **Rendering**: HTML5 Canvas

## Getting Started

Make sure dependencies are installed from the **workspace root**:

```bash
$ npm ci
```

Then start the development server:

```bash
$ npm run dev
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build locally |

## Project Structure

```
brackeys-2026-1/
├── index.html          # Entry HTML (canvas + module loader)
├── public/
│   ├── main.css        # Global styles
│   └── images/         # Static assets
└── src/
    ├── runtime.ts      # Canvas bootstrap & player initialization
    └── main.ts         # World / game logic entry point
```

