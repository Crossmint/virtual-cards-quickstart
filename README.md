# Virtual Cards Quickstart

Issue virtual credit cards through Crossmint's Agentic Payments API. This quickstart demonstrates the full flow: authenticate a user, save a payment method, enroll it for agent-initiated payments, and issue virtual cards with spending limits.

## How it works

```
1. Authenticate        User logs in via Stytch (Google OAuth)
2. Create Agent        An agent is created to manage virtual card issuance
3. Save Card           User adds a physical card via Crossmint's embedded UI
4. Agentic Enrollment  Card is enrolled for agent-initiated payments (passkey verification)
5. Issue Virtual Card  Agent creates an order intent with spending mandates
6. Get Credentials     Virtual card number, expiration, and CVC are retrieved
```

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/)
- A [Crossmint](https://www.crossmint.com/) account with a **client-side API key**
- A [Stytch](https://stytch.com/) account with **Google OAuth** enabled

## Setup

1. Clone the repo and install dependencies:

```bash
cd virtual-cards-quickstart
pnpm install
```

2. Copy the environment file and fill in your keys:

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN=your-stytch-public-token
NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY=your-crossmint-client-api-key
```

3. Configure Stytch redirect URLs:

   In your [Stytch dashboard](https://stytch.com/dashboard/redirect-urls), add `http://localhost:3000/login` as a redirect URL for both **Login** and **Signup** under OAuth.

4. Start the dev server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
app/
  layout.tsx             Root layout — wraps the app with Stytch and Crossmint providers
  page.tsx               Dashboard route — redirects to /login if not authenticated
  login/page.tsx         Stytch login + OAuth token exchange

lib/
  crossmint-api.ts       Server actions for all Crossmint API calls

components/
  agent-section.tsx       Agent display / create / delete
  save-card-section.tsx   Save a payment method + agentic enrollment verification
  saved-cards-list.tsx    List saved payment methods with delete/issue actions
  issue-virtual-card.tsx  Form to create an order intent with spending mandates
  order-intents-list.tsx  List issued virtual cards and fetch their credentials
  powered-by-crossmint.tsx  Branding link
```

## Key concepts

### Agents

An agent represents an entity authorized to initiate payments on behalf of a user. You create one agent per user, and it is referenced when issuing virtual cards.

**API:** `POST /agents` — see `createNewAgent()` in `lib/crossmint-api.ts`

### Payment methods & agentic enrollment

After a user saves a card through Crossmint's embedded UI, it must be **enrolled for agentic payments**. This involves a passkey verification step that authorizes the agent to use the card.

**API:** `POST /payment-methods/{id}/agentic-enrollment` — see `enrollPaymentMethod()` in `lib/crossmint-api.ts`

### Order intents (virtual cards)

An order intent represents a virtual card issued against a saved payment method. It includes **mandates** — rules that constrain how the card can be used:

- `maxAmount` — maximum spend per transaction, day, month, or year
- `description` — free-text description of the intended use

Once verified, virtual card credentials (card number, expiration, CVC) can be fetched.

**API:** `POST /order-intents` and `POST /order-intents/{id}/credentials` — see `createNewOrderIntent()` and `fetchCardCredentials()` in `lib/crossmint-api.ts`

## API reference

All Crossmint API calls live in `lib/crossmint-api.ts` as Next.js server actions — the staging API doesn't allow CORS, so every call is proxied through the server. The base URL is `https://staging.crossmint.com/api/unstable`. Every request requires:

- `X-API-KEY` header with your client API key
- `Authorization: Bearer {jwt}` header with the Stytch session JWT
