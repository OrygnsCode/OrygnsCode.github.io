# Client Portal V2 - Architecture

## Overview
This document outlines the core architecture for the Client Portal V2 rewrite. The goal is a robust, modular, and error-free single-page application (SPA) using vanilla JavaScript (ES Modules).

## Core Modules

### 1. Store (`js/store.js`)
The central source of truth.
- **State**:
  - `user`: Current user profile.
  - `projects`: Array of project objects.
  - `messages`: Array of conversation threads.
  - `files`: Array of file objects.
  - `invoices`: Array of invoice objects.
  - `activity`: Array of activity log entries.
  - `notifications`: Array of notification objects.
  - `settings`: App settings.
- **API**:
  - `constructor()`: Initializes state, loads from localStorage/mock data.
  - `getState()`: Returns current state.
  - `setState(partialState)`: Updates state and notifies listeners.
  - `subscribe(listener)`: Adds a change listener.
  - `unsubscribe(listener)`: Removes a listener.
  - `notify()`: Internal method to trigger listeners.
  - **Actions**: Specific methods for business logic (e.g., `addMessage`, `updateProjectStatus`, `payInvoice`).

### 2. Router (`js/router.js`)
Handles client-side navigation via URL hash.
- **Routes**:
  - `/dashboard`
  - `/projects` (List)
  - `/projects/:id` (Detail)
  - `/messages`
  - `/messages/:id`
  - `/files`
  - `/billing`
  - `/activity`
  - `/settings`
- **API**:
  - `init(routes, onRouteMatch)`: Starts listening to hash changes.
  - `navigateTo(path)`: Programmatic navigation.
  - `getParams()`: Extracts parameters from current route.

### 3. Layout (`js/components/layout.js`)
Manages the global application shell.
- **Components**:
  - **Sidebar**: Navigation links, active state management.
  - **Topbar**: Global search, User profile, Notifications.
- **Responsibilities**:
  - Render the shell structure.
  - Update active navigation state based on current route.
  - Render main content into a container.

### 4. App (`js/app.js`)
The entry point.
- **Responsibilities**:
  - Initialize `Store`.
  - Initialize `Layout`.
  - Initialize `Router`.
  - Mount the initial view.

## Feature Views (`js/views/*.js`)
Each view is a class or module that renders content into the main container.
- **Contract**:
  - `render(container, params)`: Renders the view's HTML.
  - `destroy()`: Optional cleanup (remove event listeners).
- **Views**:
  - `DashboardView`
  - `ProjectsView`
  - `MessagesView`
  - `FilesView`
  - `BillingView`
  - `ActivityView`
  - `SettingsView`

## Data Flow
1. **User Action** (Click) -> **View** calls **Store Action**.
2. **Store** updates state -> calls `notify()`.
3. **Subscribers** (Views/Layout) receive update -> Re-render UI.

## Directory Structure
```
projects/client-portal-v2/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── store.js
│   ├── router.js
│   ├── data/
│   │   └── mock-data.js
│   ├── components/
│   │   └── layout.js
│   └── views/
│       ├── dashboard.js
│       ├── projects.js
│       ├── messages.js
│       ├── files.js
│       ├── billing.js
│       ├── activity.js
│       └── settings.js
```
