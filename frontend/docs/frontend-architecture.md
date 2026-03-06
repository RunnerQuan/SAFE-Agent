# Frontend Architecture

## Overview
This document describes the front-end module architecture for the SAFE-Agent UI. It follows a typical product documentation format: scope, diagram, module map, and data flow.

## Scope
- UI shell, routing, and feature domains
- Shared UI components and utilities
- Data access layer and mock data flow

## Architecture Diagram (Mermaid)
```mermaid
flowchart TB
  subgraph AppShell[App Shell]
    rootLayout["app/layout.tsx<br/>ThemeProvider + QueryProvider + Toaster"]
    mainLayout["app/(main)/layout.tsx<br/>AppShell wrapper"]
    rootLayout --> mainLayout
  end

  subgraph Domains[Feature Domains]
    dashboard["Dashboard<br/>app/(main)/dashboard/page.tsx"]
    agents["Agents<br/>list • new • detail • edit"]
    scans["Scans<br/>list • new • detail"]
    reports["Reports<br/>list • detail"]
  end

  subgraph Shared[Shared UI]
    common["components/common/*<br/>PageHeader, Loading, Error, Empty, AppShell"]
    badges["components/badges/*<br/>StatusBadge, RiskBadge"]
    dialogs["components/dialogs/*<br/>ConfirmDialog"]
    ui["components/ui/*<br/>Button, Card, Table, Tabs, Dialog, Select"]
  end

  subgraph DataLayer[Data Layer]
    api["lib/api.ts<br/>API client + mock switch"]
    types["lib/types.ts<br/>Type contracts"]
    utils["lib/utils.ts<br/>Formatters + labels"]
    mock["lib/mockData.ts<br/>Mock state + generators"]
  end

  mainLayout --> dashboard
  mainLayout --> agents
  mainLayout --> scans
  mainLayout --> reports

  dashboard --> common
  dashboard --> badges
  dashboard --> api
  dashboard --> utils

  agents --> common
  agents --> badges
  agents --> dialogs
  agents --> ui
  agents --> api
  agents --> types

  scans --> common
  scans --> badges
  scans --> dialogs
  scans --> ui
  scans --> api
  scans --> types

  reports --> common
  reports --> badges
  reports --> dialogs
  reports --> ui
  reports --> api
  reports --> types

  api --> mock
  api --> types
  api --> utils
```

## Module Map
- App Shell: global layout, theme, query client, toasts
- Dashboard: KPIs + recent scans/reports
- Agents: CRUD for agent definitions
- Scans: create/track/cancel scan tasks
- Reports: list, detail, and export
- Shared UI: reusable components for layout, forms, and feedback
- Data Layer: API client with mock switch, types, and utilities

## Data Flow
1. Page component requests data via `lib/api.ts`.
2. API client routes to real backend or mock state (via `NEXT_PUBLIC_USE_MOCK`).
3. Data returns to React Query hooks and renders in feature pages.

## Key Dependencies
- Next.js App Router
- React Query
- Tailwind CSS
- Framer Motion
- Recharts

## File Locations
- Diagram source: `docs/frontend-architecture.md`
