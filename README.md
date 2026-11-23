# C.A.C.A — Campus Auction & Claim App

A real-time campus marketplace, token auction house, and geolocated Lost & Found platform built for **Universitatea Politehnica Timișoara (UPT)** students.

![C.A.C.A Sprint 1 Prototype](./UI%20-%20prototype.png)

---

## 1. Team & Scrum Roles

| Student | Name | Owned Modules & Use Cases |
| :--- | :--- | :--- |
| **Student A** | **Bărbatu Alex** | Marketplace listings (`UC-A1`, `UC-A2`), inverted-index keyword search (`UC-A3`), Lost & Found reports (`UC-A4`), live Leaflet map (`UC-A5`), 24h token boosts (`UC-A6`), public profiles (`UC-S3`), Seed script, GitHub Actions CI & Firebase Hosting deploys |
| **Student B** | **Magu Emanuel-Ionel** | Firebase Auth & route guards (`UC-S1`, `UC-S2`), price/swap offers (`UC-B1`, `UC-B2`), 24h item reservations (`UC-B3`), live token-escrow auctions with anti-sniping & sweeper closing (`UC-B4`, `UC-B5`), 1km geohash report matcher (`UC-B6`) |
| **Student C** | **Pop-Pavalean Spiridon** | Cloud Functions (2nd Gen), Outbox email queue (`mail/{id}`), real-time 1-on-1 chat (`UC-C1`), reviews + 10-token reward (`UC-C2`), Lost & Found claims & bounty handover (`UC-C3`), flagging & auto-hide (`UC-C4`), admin moderation (`UC-C5`), wallet & append-only ledger (`UC-C6`), Stripe Checkout sandbox (`UC-C7`) |

---

## 2. Tech Stack & Pinned Versions (Nov 2026)

* **Runtime & Build**: Node.js `24 LTS` (required for 2nd-gen Cloud Functions), Vite `8.x`, React `19.x`
* **Routing**: React Router `8.x` (**Important**: import everything from `"react-router"`, never `"react-router-dom"`)
* **Styling**: Tailwind CSS `4.x` (`@tailwindcss/vite`)
* **Backend & Emulators**: Firebase JS SDK `13.x`, Firebase CLI `15.x` (requires **Temurin JDK 21**), Firestore Standard (`us-central1`), Cloud Storage, Cloud Functions v2
* **Maps & Geolocation**: Leaflet `1.9.4`, `react-leaflet` `5.x`, `react-leaflet-cluster` `4.x`, `geofire-common`
* **Testing & CI**: Vitest, React Testing Library, `@firebase/rules-unit-testing`, Playwright, GitHub Actions

---

## 3. Repository & Folder Structure

Screens **never** import `firebase/*` directly. All UI components talk to `src/services/*` (Service / Repository pattern), which swaps cleanly from `src/mocks/data.js` in Sprint 1 to Firestore `onSnapshot` listeners in Sprint 2.

```text
SSD_Project/
├── .github/workflows/
│   └── ci.yml                  # Lint, build, unit tests & Firestore rules tests (Student A)
├── .vscode/                    # Shared Prettier format-on-save & extension recommendations
├── functions/src/              # 2nd-Gen Cloud Functions (Node 24)
│   ├── index.js                # Re-exports only (1 line per function)
│   ├── lib/                    # Admin init, wallet/ledger helper, queueEmail() (Student C)
│   ├── users/                  # Welcome email & 100-token signup bonus trigger (Student C)
│   ├── mail/                   # Outbox SMTP sender via Nodemailer (Student C)
│   ├── marketplace/            # Listing boosts (-20 tokens) & bounty locking (Student A)
│   ├── offers/                 # Offer accept/reject & 24h reservations (Student B)
│   ├── auctions/               # Escrow bidding, anti-sniping & auction closing (Student B)
│   ├── lostfound/              # 1km geohash matcher (B) & claim bounty payout (C)
│   ├── payments/               # Stripe Checkout session & signed webhook (Student C)
│   ├── reviews/                # Review rating aggregation & +10 token reward (Student C)
│   ├── moderation/             # 3-flag auto-hide trigger & admin removal (Student C)
│   └── sweeper.js              # Single 2-min scheduled job (auctions, reservations, boosts) (Student B)
├── src/
│   ├── lib/firebase.js         # The ONLY file that initializes Firebase & connects Emulators
│   ├── app/
│   │   ├── Layout.jsx          # Sticky navbar + <Outlet/> shell (Student A)
│   │   └── routes.jsx          # Declarative route table (Student A + B auth guards)
│   ├── components/             # Shared UI primitives (Button, Modal, Spinner, EmptyState) (Student C)
│   ├── hooks/                  # useAuth (B), useWallet (C), useCountdown (B)
│   ├── mocks/data.js           # Sprint 1 fake dataset matching exact Firestore collection fields
│   ├── services/               # Service (Repository) layer — the ONLY browser code importing firebase/*
│   │   ├── listings.js         # Marketplace CRUD, keyword builder & live observer (Student A)
│   │   └── reports.js          # Lost & Found CRUD, geohash generation & live observer (Student A)
│   └── features/               # Isolated feature screens (zero cross-team merge conflicts)
│       ├── marketplace/        # FeedPage, ListingDetailPage, NewListingPage (Student A)
│       ├── map/                # LostFoundMapPage (Student A)
│       ├── lostfound/          # NewReportPage (Student A)
│       ├── profile/            # ProfilePage (Student A)
│       ├── auth/               # Login, Register, RequireAuth, RequireAdmin (Student B)
│       ├── offers/             # OfferDialog, MyOffersPage, ReserveButton (Student B)
│       ├── auctions/           # AuctionPanel, BidBox (Student B)
│       ├── matches/            # PossibleMatchesPanel (Student B)
│       ├── chat/               # ChatList, ConversationPanel (Student C)
│       ├── wallet/             # WalletPage, LedgerTable, BuyTokens (Student C)
│       ├── reviews/            # ReviewModal (Student C)
│       ├── claims/             # ClaimModal, VerifyClaim (Student C)
│       └── admin/              # AdminQueuePage (Student C)
└── .env.example                # Public VITE_FIREBASE_* variable template
```

---

## 4. Architecture & State Diagrams

### 4.1 Service Layer & Observer Pattern
```mermaid
flowchart LR
    subgraph UI ["1. React Screens (src/features/*)"]
        Feed["FeedPage.jsx"]
        Detail["ListingDetailPage.jsx"]
        Map["LostFoundMapPage.jsx"]
    end

    subgraph Services ["2. Service Layer (src/services/*)"]
        LServ["listings.js<br/>subscribeListings()"]
        RServ["reports.js<br/>subscribeReports()"]
    end

    subgraph Data ["3. Data Source"]
        Mocks[("Sprint 1: src/mocks/data.js")]
        Firestore[("Sprint 2+: Cloud Firestore & Storage")]
    end

    Feed <-->|"onData callback + unsubscribe()"| LServ
    Detail -->|"createListing / markListingSold"| LServ
    Map <-->|"onData callback + unsubscribe()"| RServ

    LServ -.->|"Sprint 1"| Mocks
    RServ -.->|"Sprint 1"| Mocks
    LServ ===>|"Sprint 2+"| Firestore
    RServ ===>|"Sprint 2+"| Firestore
```

### 4.2 Live Auction Bidding & Token Escrow Sequence (UC-B4)
```mermaid
sequenceDiagram
    actor Bidder as Buyer (Browser)
    participant Fn as Cloud Function (placeBid)
    participant FS as Firestore Transaction
    participant Mail as mail/{id} Outbox

    Bidder->>Fn: httpsCallable("placeBid")({ listingId, amount })
    Fn->>FS: runTransaction() — Read listing, bidder wallet, prevBidder wallet
    alt Bid valid & before endsAt & available >= amount
        FS->>FS: Lock new bidder tokens (BID_LOCK)
        FS->>FS: Unlock previous bidder tokens (BID_UNLOCK)
        FS->>FS: Update listing.auction (highestBid, highestBidderId)
        opt Bid placed within last 2 minutes (Anti-Sniping)
            FS->>FS: Extend listing.auction.endsAt by +2 minutes
        end
        FS->>FS: Create listings/{id}/bids/{bidId} & notifications/{prevUid}
        FS->>Mail: Queue outbid_<bidId> email
        FS-->>Fn: Commit atomic transaction
        Fn-->>Bidder: { ok: true } (All open browsers update via onSnapshot)
    else Contention / Outbid / Insufficient tokens
        FS-->>Fn: Throw HttpsError("failed-precondition")
        Fn-->>Bidder: Display friendly error message
    end
```

### 4.3 Contested Object State Machines
```mermaid
stateDiagram-v2
    direction LR
    state "Listing Status" as L {
        [*] --> active
        active --> reserved : Buyer reserves (24h max 2)
        reserved --> active : 24h sweeper expires / cancelled
        reserved --> sold : Seller completes deal
        active --> sold : Offer accepted / Auction won / Marked sold
        active --> hidden : Flag count >= 3
        hidden --> active : Admin restores
        hidden --> removed : Admin removes
    }
```

### 4.4 Offer, Reservation & Auction State Machines (Student B)
A transition is only legal from the expected state. Every server handler re-reads the state inside its transaction, so a double-click on Accept or two sweeper runs at once change nothing the second time.

```mermaid
stateDiagram-v2
    direction LR
    [*] --> pending : Buyer sends offer (UC-B1)
    pending --> accepted : Seller accepts (UC-B2)
    pending --> rejected : Seller rejects, optional reason
    pending --> rejected : Another offer on the listing accepted
    accepted --> [*]
    rejected --> [*]
```

```mermaid
stateDiagram-v2
    direction LR
    [*] --> active : Buyer reserves (fixed price only, max 2 active, 24h)
    active --> completed : Seller completes the deal
    active --> cancelled : Buyer cancels
    active --> expired : Sweeper, expiresAt passed
    completed --> [*]
    cancelled --> [*]
    expired --> [*]
```

```mermaid
stateDiagram-v2
    direction LR
    [*] --> open : Seller publishes auction
    open --> open : Valid bid: BID_LOCK new, BID_UNLOCK previous, +2 min if in the last 2 min
    open --> closed : Sweeper after endsAt, with bids (AUCTION_PAY / AUCTION_EARN, chat opens)
    open --> relisted : Sweeper after endsAt, no bids
    closed --> [*]
    relisted --> [*]
```

---

## 5. Frozen Data Contracts

### `listings/{id}` (Owner: Student A)
* `sellerId`: `string` (`uid` from `useAuth()`)
* `sellerName`: `string`
* `type`: `"fixed" | "swap" | "auction"`
* `title`: `string`
* `description`: `string`
* `category`: `"electronics" | "books" | "clothing" | "accessories" | "keys_ids" | "bikes_gear" | "other"`
* `price`: `number` (in RON; `0` for auctions)
* `photoPaths`: `string[]` (Storage paths or URLs)
* `status`: `"active" | "reserved" | "sold" | "hidden" | "removed"`
* `searchKeywords`: `string[]` (normalised NFD lowercase words)
* `boostedUntil`: `Timestamp | ISO string` (initialized to epoch `new Date(0)` sentinel so `orderBy("boostedUntil", "desc")` includes unboosted listings)
* `flagCount`: `number`
* `createdAt`: `Timestamp | ISO string`
* `auction`: `null | { startPrice, minIncrement, endsAt, highestBid, highestBidderId, status: "open" | "closed", winnerId }`

### `reports/{id}` (Owner: Student A)
* `ownerId`: `string`
* `ownerName`: `string`
* `kind`: `"lost" | "found"`
* `category`: exact string from `CATEGORIES` in `src/mocks/data.js`
* `title`, `description`: `string`
* `eventDate`: `Timestamp | ISO string`
* `lat`, `lng`: `number`
* `geohash`: `string` (computed via `geohashForLocation([lat, lng])`)
* `photoPaths`: `string[]`
* `status`: `"open" | "resolved" | "hidden" | "removed"`
* `bounty`: `number` (tokens)
* `bountyStatus`: `"none" | "locked" | "paid"`

### `useAuth()` (Owner: Student B)
Wrap nothing yourself: `<AuthProvider>` is already around the whole app in `App.jsx`.
```js
import { useAuth } from "../../hooks/useAuth";
const { user, profile, isAdmin, loading, refreshClaims } = useAuth();
```
* `loading`: `true` until Firebase reports the first auth state. Show a spinner, never redirect, while it's `true`.
* `user`: Firebase Auth user (`uid`, `email`, `emailVerified`, `displayName`, `photoURL`) or `null`.
* `profile`: live `users/{uid}` document or `null`. It can be `null` for a moment right after signup, so fall back to `user.displayName`.
* `isAdmin`: `true` when the login token has the `admin` custom claim (set with C's `scripts/set-claim.mjs`; the user must sign out and in again).
* Route guards: put protected routes inside `<Route element={<RequireAuth />}>`, admin routes inside `<Route element={<RequireAdmin />}>` (see `src/app/routes.jsx`).

### `users/{uid}` (Created by: Student B · Edited by: Student A · Ratings: Student C)
* `username`: `string | null` (lowercase, unique via `usernames/{username}`; `null` for Google signups)
* `displayName`: `string` (1–60 chars)
* `photoURL`: `string | null`
* `faculty`: `string | null`
* `bio`: `string` (max 300)
* `ratingAvg`, `ratingCount`: `number` (start at `0`; only server code changes them)
* `createdAt`: `Timestamp`
* No email (stays in Firebase Auth) and no `role` (the admin flag is a custom claim). Creating this document is the signal for C's welcome-email and wallet trigger.

### `usernames/{username}` (Owner: Student B)
* `uid`: `string`. Written once, in the same transaction as `users/{uid}`; never updated or deleted.

### `offers/{id}` (Owner: Student B, proposed)
* `listingId`, `sellerId`, `buyerId`: `string`
* `listingTitle`, `sellerName`, `buyerName`: `string` (copied for list screens)
* `kind`: `"price" | "swap"`
* `amount`: `number | null` (RON, price offers) · `swapListingId`, `swapListingTitle`: `string | null` (swap offers)
* `message`: `string` (max 500)
* `status`: `"pending" | "accepted" | "rejected"` · `rejectReason`: `string | null`
* `createdAt`: `Timestamp`

### `reservations/{id}` (Owner: Student B, proposed; browser can only read its own)
* `listingId`, `listingTitle`, `sellerId`, `sellerName`, `buyerId`: `string`
* `status`: `"active" | "completed" | "expired" | "cancelled"`
* `expiresAt`, `createdAt`: `Timestamp`

---

## 6. Getting Started (All Teammates)

### Prerequisites
1. **Node.js 24 LTS** (`fnm install 24 && fnm default 24`)
2. **Temurin JDK 21** (`java -version` must be 21+ for Firebase CLI 15 emulators)
3. **Firebase CLI** (`npm install -g firebase-tools`)

### Run Locally
```bash
git clone [https://github.com/5pyr0s/SSD_Project.git](https://github.com/5pyr0s/SSD_Project.git)
cd SSD_Project
cp .env.example .env.local   # Fill in VITE_FIREBASE_* keys from shared vault
npm ci
npm run dev                  # Opens http://localhost:5173
```

### Run against the Firebase emulators
Sign-up, login and profile documents need the Auth and Firestore emulators (or the real project).
```bash
echo "VITE_USE_EMULATORS=true" >> .env.local   # leave VITE_FIREBASE_PROJECT_ID empty → "demo-caca"
npm run emulators            # Auth :9099, Firestore :8080, Emulator UI :4000
npm run dev                  # second terminal
```
If you fill `VITE_FIREBASE_PROJECT_ID` with the real project ID, start the emulators with `--project <that id>` instead, so the browser and emulators agree.

### Security rules tests
```bash
npm run test:rules           # starts the Firestore emulator, runs tests/rules/*.test.js
```

### Pre-PR Checks (Must pass before merging to `main`)
```bash
npm run lint
npm run build
npm test -- --run
```