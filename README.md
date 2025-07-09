# SmartChallenge Frontend

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20App-blue?style=for-the-badge)](https://smartchallenge-mohammadaminrezs-projects.vercel.app/)

**Live Demo:** [https://smartchallenge-mohammadaminrezs-projects.vercel.app/](https://smartchallenge-mohammadaminrezs-projects.vercel.app/)

A modern dApp built with [Next.js](https://nextjs.org), [React](https://react.dev), and [ethers.js](https://docs.ethers.org/) for blockchain-based challenge competitions. This project interacts with a smart contract deployed on the Sepolia testnet and features a user leaderboard, admin dashboard, and dynamic challenge management.

---

## Features

- **Blockchain Integration:** Connect your wallet (MetaMask), interact with a smart contract, and submit solutions to challenges.
- **Challenge Management:** Admins can add, edit, and delete challenges, with metadata pinned to IPFS via Pinata.
- **Leaderboard:** Real-time leaderboard ranks users by solved challenges and scores.
- **Wallet Connection:** Secure wallet connect/disconnect with UI feedback.
- **Dynamic UI:** Modern, responsive design with Tailwind CSS and custom components.
- **API Route:** Serverless API for pinning challenge metadata to IPFS.

---

## Project Structure

```
frontend/
  ├── src/
  │   ├── app/
  │   │   ├── admin/           # Admin dashboard (challenge management)
  │   │   ├── home/            # Main user homepage (challenge list, leaderboard)
  │   │   ├── disconnected/    # Wallet disconnected page
  │   │   ├── api/pinMetadata/ # API route for IPFS pinning
  │   │   ├── layout.tsx       # Global layout and footer
  │   │   ├── globals.css      # Global styles (Tailwind)
  │   │   └── page.tsx         # Redirects to /home
  │   ├── components/          # Reusable UI components
  │   │   ├── AdminPanel.tsx
  │   │   ├── ChallengeCard.tsx
  │   │   ├── ConnectButton.tsx
  │   │   ├── Header.tsx
  │   │   ├── Leaderboard.tsx
  │   │   └── Modal.tsx
  │   ├── lib/                 # Blockchain and utility logic
  │   │   ├── contract.ts      # Ethers.js contract helpers
  │   │   └── challengeTemplates.ts # Sample challenge templates
  │   └── abi/                 # Smart contract ABI
  │       └── SmartChallengeUpgradeable.json
  ├── public/                  # Static assets (icons, SVGs)
  ├── package.json             # Project metadata and scripts
  ├── tsconfig.json            # TypeScript config
  ├── next.config.ts           # Next.js config
  ├── postcss.config.mjs       # PostCSS config (Tailwind)
  └── eslint.config.mjs        # ESLint config
```

---

## Getting Started

1. **Install dependencies:**

   ```bash
   npm install
   # or
   yarn install
   ```

2. **Set up environment variables:**

   Create a `.env.local` file in the `frontend/` directory with the following (replace with your values):

   ```env
   NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourContractAddress
   NEXT_PUBLIC_INFURA_PROJECT_ID=your-infura-id
   PINATA_API_KEY=your-pinata-key
   PINATA_SECRET_API_KEY=your-pinata-secret
   ```

3. **Run the development server:**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## Main Pages

- `/home` — Main challenge list, leaderboard, and wallet connect.
- `/admin` — Admin dashboard (restricted to contract owner).
- `/disconnected` — Shown when wallet is disconnected.

---

## Components

- **AdminPanel:** Manage challenges, pause/unpause contract, withdraw funds.
- **ChallengeCard:** View, solve, and (admin) edit/delete challenges.
- **Leaderboard:** Displays user rankings and scores.
- **ConnectButton:** Wallet connect/disconnect UI.
- **Header:** Navigation, funding, and wallet status.
- **Modal:** Reusable modal dialog.

---

## Blockchain & API

- **Smart Contract:** Interacts with a deployed contract (see `src/abi/SmartChallengeUpgradeable.json`).
- **IPFS Pinning:** Uses `/api/pinMetadata` route to pin challenge metadata to IPFS via Pinata.
- **Ethers.js:** Handles all blockchain interactions.

---

## Scripts

- `npm run dev` — Start development server
- `npm run build` — Build for production
- `npm run start` — Start production server
- `npm run lint` — Run ESLint

---

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Ethers.js 6
- Pinata (IPFS)

---

## License

MIT
