# ZKGameVault Frontend

Privacy-preserving gaming interface built with Next.js, React, and Starknet.

## Features

- 🔐 Starknet wallet connection (Argent X, Braavos)
- 🎮 Identity vault management
- ⚡ Tic-Tac-Toe game with age-gated access
- 🔒 Zero-knowledge proof generation
- 📱 Responsive design with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Starknet wallet (Argent X or Braavos browser extension)
- Testnet ETH from [Starknet Faucet](https://starknet-faucet.vercel.app/)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Update .env.local with your configuration
```

### Development

```bash
# Run development server
npm run dev

# Open http://localhost:3000
```

### Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

Create a `.env.local` file:

```bash
NEXT_PUBLIC_NETWORK=sepolia
NEXT_PUBLIC_RPC_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_8
NEXT_PUBLIC_WORLD_ADDRESS=0x526a04441c187487d88f826b38d53dad242f4896575b9ab6298fc1f364bdae2
```

## Project Structure

```
frontend/
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── layout.tsx       # Root layout with Starknet provider
│   │   ├── page.tsx         # Homepage
│   │   ├── identity/        # Identity vault pages
│   │   └── games/           # Game pages
│   ├── components/          # React components
│   │   ├── StarknetProvider.tsx
│   │   └── WalletConnect.tsx
│   └── lib/                 # Utility functions
├── public/                  # Static assets
└── package.json
```

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Starknet:** @starknet-react/core
- **Blockchain:** Starknet Sepolia Testnet

## Deployed Contracts

- **World:** `0x526a04441c187487d88f826b38d53dad242f4896575b9ab6298fc1f364bdae2`
- **Network:** Starknet Sepolia
- **Explorer:** [Starkscan](https://sepolia.starkscan.io/)
