# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + TypeScript + Vite application called "emotionlm". It's currently a minimal setup with the standard Vite React template structure.

## Development Commands

- **Start development server**: `npm run dev` or `bun dev`
- **Build for production**: `npm run build` or `bun run build`
  - This runs TypeScript compilation (`tsc -b`) followed by Vite build
- **Lint code**: `npm run lint` or `bun run lint`
- **Preview production build**: `npm run preview` or `bun run preview`

## Project Structure

- **Entry point**: `src/main.tsx` - React application root
- **Main component**: `src/App.tsx` - Primary application component
- **Styling**: Uses CSS files (`App.css`, `index.css`)
- **Build tool**: Vite with React plugin
- **Package manager**: Uses Bun (evidenced by `bun.lock`)

## TypeScript Configuration

The project uses a composite TypeScript setup:
- `tsconfig.json` - Root configuration with project references
- `tsconfig.app.json` - Application-specific TypeScript config
- `tsconfig.node.json` - Node.js/build tooling TypeScript config

## Linting

ESLint is configured with:
- TypeScript ESLint recommended rules
- React Hooks plugin
- React Refresh plugin for Vite
- Ignores `dist` directory

## Key Dependencies

- **Runtime**: React 19.1.0, React DOM 19.1.0
- **Build**: Vite 7.0.4, TypeScript 5.8.3
- **Development**: ESLint 9.30.1 with TypeScript and React plugins