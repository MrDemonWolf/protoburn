# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-22

### Added

- Token usage dashboard with stats cards (total, input, output, cache write, cache read) with odometer animations
- Top models leaderboard with medal rankings and per-model cost
- Time-series usage chart with weekly navigation
- Heatmap calendar (90-day GitHub-style grid with hover tooltips)
- Cost breakdown donut chart
- Cost forecast card
- Monthly burn history with tier indicators
- Monthly achievements (30 unlockable badges)
- Velocity ticker with trend indicators
- Burn intensity system (7 tiers: cold → meltdown, WebGL2 + Canvas 2D particles)
- Prompt caching tracking (cache creation + cache read tokens with per-model pricing)
- Dynamic OG image with live stats and burn tier
- PWA support (installable, offline-capable via service worker)
- Discord webhook notifications for sync events and tier changes
- Mobile hamburger drawer with fire effects and theme controls
- Error boundaries with fallback UI and recovery buttons
- Konami code easter egg (WebGL fire animation)
- Glassmorphism UI with dark/light mode toggle
- Tab title shows cost + tier when tab is backgrounded
- Sync script for Claude Code usage data (`bun sync` / `bun sync:watch`)
- API key protection for write endpoints
- Full Cloudflare deployment via Alchemy (Workers + D1 + Pages)
- CI pipeline with type-check, test, and build jobs
