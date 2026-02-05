# Search Everything Audit

A comprehensive SEO audit tool that analyses websites across 7 core categories plus brand-specific checks for ecommerce, local, and international businesses.

## Prerequisites

Before you begin, ensure you have the following installed on your laptop:

- **Node.js** (version 18 or higher)
- **npm** (comes with Node.js)

### Check if you have Node.js installed

Open your terminal (Terminal on Mac, Command Prompt or PowerShell on Windows) and run:

```bash
node --version
```

If you see a version number (e.g., `v18.17.0` or higher), you're good to go. If not, download and install Node.js from [https://nodejs.org](https://nodejs.org) (choose the LTS version).

## Quick Start

### Step 1: Clone the repository

Open your terminal and run:

```bash
git clone https://github.com/frankielevin/seo-audit-checklist.git
```

### Step 2: Navigate to the project folder

```bash
cd seo-audit-checklist
```

### Step 3: Install dependencies

```bash
npm install
```

This will download all the required packages. It may take a minute or two.

### Step 4: Start the development server

```bash
npm run dev
```

### Step 5: Open in your browser

Once you see the message `Ready`, open your web browser and go to:

```
http://localhost:3000
```

You should now see the Search Everything Audit app running!

## Stopping the app

To stop the development server, press `Ctrl + C` in your terminal.

## Troubleshooting

### "command not found: node" or "command not found: npm"

Node.js is not installed. Download it from [https://nodejs.org](https://nodejs.org).

### Dependency errors during npm install

Try running:

```bash
npm install --legacy-peer-deps
```

### Port 3000 already in use

Another app is using port 3000. Either close that app, or run the dev server on a different port:

```bash
npm run dev -- -p 3001
```

Then open `http://localhost:3001` in your browser.

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type-safe JavaScript
- **React 18** - UI library

## License

MIT
