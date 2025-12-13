# SJKC Fun Learning Companion
## Production Documentation — Phase 1.6-R++ (Reduced, Robust & Truly Offline-First)

---

## DOCUMENT CONTROL

**Project Name:** SJKC Fun Learning Companion  
**Version:** 3.9 (Production Release — R++)  
**Phase:** 1.6-R++ — Offline-First (App Shell + Data Cached, No Backend)  
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

## A4. In-Scope Features (Phase 1.6-R++)

- Practice Mode (flip-card learning)  
- Game Mode (two-option recognition)  
- Subject selection: Mandarin, Science, Math, Mixed  
- Personal Best tracking (per device)  
- Offline-first vocabulary availability  
- Deferred content update mechanism  
- Manual recovery / redownload control for parents  
- **Mandatory App Shell caching via Service Worker**  
- Installable PWA  

---

## A5. Explicitly Out of Scope

- User accounts or authentication  
- Global leaderboards or social features  
- Cloud database or backend services  
- Real-time synchronisation across devices  

---

## A6. User Flow

Landing → Mode Selection → Configuration → Activity → Results → Personal Best

---

# PART B — SOFTWARE DESIGN DOCUMENT (SDD)

## B1. Architectural Overview

The application is a **Modular Single Page Application (SPA)** implemented using **native ES Modules** and a **mandatory Service Worker**.

```
UI Layer → AppController → Services Layer
                │
                └→ Service Worker (App Shell Cache)
```

Services:
- **DataService** — content parsing, validation, deck generation  
- **StorageService** — persistence, update detection, recovery actions  

---

## B2. Key Architectural Decisions (Phase 1.6-R++)

1. **No backend in Phase 1.6-R++**  
2. **Service Worker is mandatory for App Shell caching**  
3. **localStorage used for runtime persistence of parsed data**  
4. **CSV is treated strictly as a transport format**  
5. **Update detection uses HTTP HEAD (ETag / Last-Modified)**  
6. **Content updates are deferred and never applied mid-session**  
7. **Manual recovery (“Redownload Vocabulary”) is mandatory**  
8. **IndexedDB reserved strictly for Phase 2 escalation**  
9. **All scripts loaded via native ES Modules**  

---

## B3. Data Models

### Flashcard
```
{ id, subject, mandarin, pinyin, english }
```

### PersonalBestEntry
```
{ subject, score, date }
```

### VocabularyCache (internal)
```
{
  parsedData: Flashcard[],
  etag?: string,
  lastModified?: string,
  updateAvailable?: boolean
}
```

---

## B4. Offline-First Strategy (R++ — App + Data Survivability)

Phase 1.6-R++ guarantees **offline execution and offline data availability**.

### App Shell Availability
- `index.html`, `app.js`, `style.css`, and assets are cached by the Service Worker  
- App launches successfully even when fully offline  

### Startup Behaviour
1. Load cached App Shell from Service Worker  
2. Load parsed vocabulary JSON from localStorage immediately  
3. App is usable offline without delay  

### Background Update Detection (Online Only)
1. Perform HTTP **HEAD** request to the CSV endpoint  
2. Compare returned **ETag / Last-Modified** headers with cached values  
3. If unchanged → no action  
4. If changed → download CSV, parse and validate content  
5. Store parsed JSON and mark `updateAvailable = true`  

### Update Application Rules
- Updates **must not** be applied during an active learning or game session  
- Updates are applied only when:
  - App is restarted, or  
  - User returns to the Landing screen, or  
  - Parent explicitly triggers update application  

---

# PART C — UML (TEXTUAL)

```
AppController
 ├─ DataService
 ├─ StorageService
 └─ ServiceWorker
        │
        ├─ App Shell Cache
        └─ Network Fallback
```

---

# PART D — CODING GUIDE (PHASE 1.6-R++)

## D1. Project Structure

```
/sjkc-fun-learning
├── index.html
├── style.css
├── app.js
├── data-service.js
├── storage-service.js
├── sw.js            // mandatory: App Shell caching
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
- Safe-boundary update application  
- Parent-only recovery actions  

### StorageService
- localStorage access  
- Parsed vocabulary persistence  
- HTTP HEAD update detection  
- Deferred update flag management  
- Quota-safe write operations  

### Service Worker
- App Shell caching  
- Offline navigation handling  
- Network fallback for updates  

### DataService
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
- IndexedDB may only be introduced when localStorage quota is exceeded  

---

## D5. Parent Recovery Controls

A **Redownload Vocabulary** control must be available in Parent / Configuration mode.

Purpose:
- Recover from corrupted or partial cache  
- Force update when automatic detection fails  
- Avoid uninstall / reinstall scenarios  

---

# PART E — PRODUCTION OPERATIONS

## E1. Offline Behaviour Matrix

| Scenario | Behaviour |
|--------|----------|
| First launch (online) | Cache App Shell → Fetch CSV → Parse → Store → Play |
| Subsequent launch (offline) | Load App Shell from SW → Load data from localStorage |
| Subsequent launch (online) | Load App Shell → HEAD check → Defer update if changed |
| Update detected | Flag updateAvailable, apply at safe boundary |
| Corrupted cache | Parent triggers Redownload Vocabulary |
| Browser cache cleared | App still loads via Service Worker |

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

**End of Production Document — Phase 1.6-R++**
