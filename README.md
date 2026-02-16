# Video Editor Monorepo

A high-performance video editing application built with a modern hybrid architecture.

## Architecture

This monorepo uses a **three-tier architecture** combining web technologies with native performance:

### Structure

```
video/
├── apps/           # Application packages
│   ├── web/        # Next.js web application
│   ├── desktop/    # Tauri desktop application
│   └── cli/        # Command-line tools
├── packages/       # Shared TypeScript packages
│   ├── core/       # Core editor logic
│   ├── ui/         # Shared UI components
│   └── types/      # Shared TypeScript types
└── crates/         # Rust crates (FFI bindings)
    ├── ffmpeg/     # FFmpeg bindings
    └── renderer/   # Native video renderer
```

### Technology Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Desktop**: Tauri (Rust + WebView)
- **Native**: Rust with FFmpeg bindings
- **Build**: Turborepo, pnpm workspaces

## Getting Started

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build all packages
pnpm build

# Run linting
pnpm lint

# Run tests
pnpm test
```

## Requirements

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Rust >= 1.75 (for native crates)
- FFmpeg >= 6.0

## License

MIT
