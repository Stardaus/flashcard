# SJKC Fun Learning Companion
## Production Documentation — Phase 1.7 (Google Sheet Integration & Service Worker Updates)

---

## DOCUMENT CONTROL

**Project Name:** SJKC Fun Learning Companion  
**Version:** 4.0 (Production Release)  
**Phase:** 1.7 — Google Sheet Integration & Service Worker Updates
**Audience:** Parents, Developers (Future-proof handover)  
**Status:** Approved for Production Deployment

---

# PART A — PRODUCT REQUIREMENTS DOCUMENT (PRD)

## A1. Educational Purpose

SJKC Fun Learning Companion is a **Mandarin vocabulary learning application** designed to support young learners in recognising, recalling, and understanding **Mandarin words and phrases used in the SJKC curriculum**.

Vocabulary sources include:
- **Mandarin subject textbooks** (core language vocabulary)
- **Science textbooks** (Mandarin terminology appearing in Science lessons)
- **Mathematics textbooks** (Mandarin terminology appearing in Mathematics lessons)

> The application focuses strictly on **vocabulary recognition and meaning**.  
> It does **not** teach Science or Mathematics concepts.

---

## A2. Target Users

- **Primary users:** Year 1–2 SJKC students  
- **Secondary users:** Parents (initial setup, monitoring, recovery actions)

---

## A3. Design Principles

- Privacy-first (no accounts, no personal data collection)  
- **True offline-first reliability (app + data)**  
- Low cognitive and interaction load for children  
- Predictable behaviour over clever optimisation  
- Modular design with explicit upgrade paths  

---

## A4. In-Scope Features (Phase 1.7)

- Practice Mode (flip-card learning)  
- Game Mode (two-option recognition)  
- Subject selection: Mandarin, Science, Math, Mixed  
- **Select number of cards for practice/game**
- Offline-first vocabulary availability via Service Worker data caching
- **Service worker-based update mechanism with user notification**
- Manual recovery / redownload control for parents  
- **Mandatory App Shell caching via Service Worker**  
- Installable PWA
- **Custom-styled modals for alerts and confirmations**

---

## A5. Explicitly Out of Scope

- User accounts or authentication  
- Global leaderboards or social features  
- Cloud database or backend services  
- Real-time synchronisation across devices  

---

## A6. User Flow

Landing → Mode Selection → Configuration → Activity → Results

---

# PART B — SOFTWARE DESIGN DOCUMENT (SDD)

## B1. Architectural Overview

The application is a **Modular Single Page Application (SPA)** implemented using **native ES Modules** and a **mandatory Service Worker**.

```
UI Layer → AppController → Services Layer
                │
                └→ Service Worker (App Shell & Data Cache)
```

Services:
- **DataService** — content parsing, validation, deck generation from Google Sheet
- **StorageService** — persistence of parsed data in localStorage

---

## B2. Key Architectural Decisions (Phase 1.7)

1. **No backend in Phase 1.7**  
2. **Service Worker is mandatory for App Shell and Data caching**  
3. **localStorage used for runtime persistence of parsed data**  
4. **Vocabulary data is fetched from a public Google Sheet CSV**
5. **Update detection is handled by the service worker using a "stale-while-revalidate" strategy**
6. **The service worker notifies the app of available updates**
7. **Manual recovery (“Redownload Vocabulary”) is mandatory**  
8. **IndexedDB reserved for future escalation if localStorage proves insufficient**
9. **All scripts loaded via native ES Modules**  

---

## B3. Data Models

### Flashcard
```
{ subject, mandarin, pinyin, english }
```

### VocabularyCache (internal)
The `vocabularyCache` in `localStorage` is now a simple array of `Flashcard` objects.
```
Flashcard[]
```

---

## B4. Offline-First Strategy (R++ — App + Data Survivability)

Phase 1.7 guarantees **offline execution and offline data availability**.

### App Shell Availability
- `index.html`, `app.js`, `style.css`, and assets are cached by the Service Worker  
- App launches successfully even when fully offline  

### Startup Behaviour
1. Load cached App Shell from Service Worker  
2. Load parsed vocabulary JSON from localStorage immediately  
3. App is usable offline without delay  

### Background Update (Stale-While-Revalidate)
1. The service worker intercepts the request for the vocabulary data (Google Sheet CSV).
2. It serves the cached version of the data immediately (stale).
3. In the background, it fetches the latest version from the network (revalidate).
4. If the network fetch is successful, it updates the data cache.
5. The service worker then sends a message to the application to notify it that a new version of the data is available.

### Update Application Rules
- The application displays a notification banner to the user when a new version of the data is available.
- The user can click a "Refresh" button on the banner to reload the page and get the latest data.

---

# PART C — UML (TEXTUAL)

```
AppController
 ├─ DataService
 ├─ StorageService
 └─ ServiceWorker
        │
        ├─ App Shell Cache
        └─ Data Cache
```

---

# PART D — CODING GUIDE (PHASE 1.7)

## D1. Project Structure

```
/sjkc-fun-learning
├── index.html
├── style.css
├── app.js
├── data-service.js
├── storage-service.js
├── sw.js            // mandatory: App Shell & Data caching
├── manifest.json
└── README.md
```

---

## D2. Script Loading

```html
<script type="module" src="app.js"></script>
```

Browsers without ES Module support are **not supported**.

---

## D3. Service Responsibilities

### AppController
- Application state management  
- UI flow control  
- Handling user interactions

### StorageService
- localStorage access for parsed vocabulary persistence
- Recovery actions (clearing cache)

### Service Worker
- App Shell caching
- **Data caching using stale-while-revalidate strategy**
- Offline navigation handling
- **Sending update notifications to the app**

### DataService
- **Fetching data from Google Sheet**
- CSV parsing  
- Data validation and sanitisation  
- Deck and distractor generation  

---

## D4. Non-Negotiable Safety Rules

- Service Worker must be registered on first load  
- No hot-swapping of data during gameplay  
- No rendering of CSV-derived content using `innerHTML`  
- All localStorage writes must be wrapped in error handling  
- CSV input must be validated before persistence  

---

## D5. Parent Recovery Controls

A **Redownload Vocabulary** control must be available on the main screen.

Purpose:
- Recover from corrupted or partial cache  
- Force update when automatic detection fails  
- Avoid uninstall / reinstall scenarios  

---

# PART E — PRODUCTION OPERATIONS

## E1. Offline Behaviour Matrix

| Scenario | Behaviour |
|--------|----------|
| First launch (online) | Cache App Shell → Fetch data from Google Sheet → Parse → Store in localStorage & SW Cache → Play |
| Subsequent launch (offline) | Load App Shell from SW → Load data from localStorage |
| Subsequent launch (online) | Load App Shell from SW → Load data from localStorage → SW fetches update in background |
| Update detected | SW sends message to app → App shows notification → User clicks to refresh |
| Corrupted cache | Parent triggers Redownload Vocabulary |
| Browser cache cleared | App still loads via Service Worker, data is re-fetched |

---

## E2. Data Privacy Statement

- No personal data is collected  
- No cloud storage is used  
- All learning data remains on the device  

---

# PART F — README (END-USER)

SJKC Fun Learning Companion helps children practise Mandarin vocabulary found in SJKC Mandarin, Science, and Mathematics textbooks.

### Offline Use
- The app works without internet after the first successful load  
- Vocabulary and progress remain available offline  

### Parent Controls
- Parents may manually refresh vocabulary data if needed  
- No accounts or sign-ins are required  

---

**End of Production Document — Phase 1.7**
