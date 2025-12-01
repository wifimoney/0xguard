# 0xGuard Frontend - Next.js + TypeScript

Modern Next.js and TypeScript implementation of the 0xGuard Mission Control dashboard.

## Features

- **Next.js 16** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Real-time log polling** via API routes
- **Component-based architecture** for maintainability
- **Inter & JetBrains Mono fonts** for professional typography

## Getting Started

### Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
frontend/
├── app/
│   ├── api/
│   │   └── logs/
│   │       └── route.ts      # API route for logs.json
│   ├── globals.css            # Global styles and animations
│   ├── layout.tsx             # Root layout with fonts
│   └── page.tsx               # Main dashboard page
├── components/
│   ├── Header.tsx             # Top navigation bar
│   ├── SummaryBanner.tsx      # Project summary banner
│   ├── AgentCard.tsx          # Agent status card component
│   ├── Terminal.tsx            # Live terminal component
│   ├── HivemindList.tsx       # Unibase exploits list
│   └── ZKProofsList.tsx       # Midnight proofs list
├── hooks/
│   └── useLogs.ts             # Custom hook for polling logs
└── types/
    └── index.ts               # TypeScript type definitions
```

## API Routes

### `/api/logs`

Returns the contents of `logs.json` from the project root. The API route reads from `../logs.json` relative to the frontend directory.

## Components

### Header
Persistent navigation bar with 0xGuard logo, breadcrumbs, and wallet connection.

### SummaryBanner
Project overview with status badge and quick links.

### AgentCard
Displays agent status (Red Team, Target, Judge) with dynamic status updates based on logs.

### Terminal
Live streaming terminal that displays agent logs in real-time with:
- Auto-scroll toggle
- Vulnerability highlighting
- Monospace font (JetBrains Mono)
- Smooth animations

### HivemindList
Displays learned attack vectors from Unibase, extracted from log messages.

### ZKProofsList
Shows Midnight ZK proof hashes with verification status.

## Styling

- **Inter** font for UI elements (headers, buttons, labels)
- **JetBrains Mono** font for technical content (terminal, hashes, addresses)
- Dark mode by default (`bg-black`, `text-white`)
- Custom animations for pulsing status indicators
- Vulnerability glow effects for security alerts

## Real-time Updates

The `useLogs` hook polls `/api/logs` every second and updates the UI when new log entries are detected. The hook:
- Maintains state of processed logs
- Only appends new entries
- Handles errors gracefully
- Cleans up intervals on unmount

## TypeScript

All components and utilities are fully typed:
- `LogEntry` interface for log data
- `AgentStatus` interface for agent states
- Type-safe props for all components
- Type-safe API responses

## Migration from Vanilla JS

The original HTML/CSS/JS implementation has been converted to:
- React components with TypeScript
- Next.js App Router
- Custom hooks for state management
- API routes instead of direct file access
- Type-safe code throughout

Old files are preserved in `../frontend-old/` for reference.
