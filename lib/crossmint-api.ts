"use server";

// Server actions for all Crossmint API calls.
// These run on the server side (Next.js server actions) so the API key is not exposed to the client.
// Every request requires a Stytch session JWT passed from the client.

import type {
  AgenticEnrollmentResponse,
  AgentResponse,
  CardCredentials,
  Mandate,
  OrderIntentResponse,
  PaymentMethodResponse,
} from "@/lib/crossmint-types";

const BASE_URL = "https://staging.crossmint.com/api/unstable";
const API_KEY = process.env.NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY ?? "";

// ─── Payment methods ────────────────────────────────────────────────────────

/** List all saved payment methods for the authenticated user. */
export async function fetchPaymentMethods(jwt: string): Promise<PaymentMethodResponse[]> {
  const res = await fetch(`${BASE_URL}/payment-methods`, {
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": API_KEY,
      Authorization: `Bearer ${jwt}`,
    },
  });

  if (!res.ok) throw new Error(`Failed to fetch payment methods (${res.status})`);
  return res.json();
}

/** Delete a saved payment method. */
export async function removePaymentMethod(jwt: string, paymentMethodId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/payment-methods/${paymentMethodId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": API_KEY,
      Authorization: `Bearer ${jwt}`,
    },
  });

  if (!res.ok) throw new Error(`Failed to delete payment method (${res.status})`);
}

// ─── Agents ─────────────────────────────────────────────────────────────────

/** List all agents for the authenticated user. */
export async function fetchAgents(jwt: string): Promise<AgentResponse[]> {
  const res = await fetch(`${BASE_URL}/agents`, {
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": API_KEY,
      Authorization: `Bearer ${jwt}`,
    },
  });

  if (!res.ok) throw new Error(`Failed to fetch agents (${res.status})`);
  return res.json();
}

/** Create a new agent. An agent is required before issuing any virtual cards. */
export async function createNewAgent(jwt: string, name: string, description?: string): Promise<AgentResponse> {
  const res = await fetch(`${BASE_URL}/agents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": API_KEY,
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ metadata: { name, description } }),
  });

  if (!res.ok) throw new Error(`Failed to create agent (${res.status})`);
  return res.json();
}

// ─── Order intents (virtual cards) ──────────────────────────────────────────

/** List all order intents (issued virtual cards) for the authenticated user. */
export async function fetchOrderIntents(jwt: string): Promise<OrderIntentResponse[]> {
  const res = await fetch(`${BASE_URL}/order-intents`, {
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": API_KEY,
      Authorization: `Bearer ${jwt}`,
    },
  });

  if (!res.ok) throw new Error(`Failed to fetch order intents (${res.status})`);
  return res.json();
}

// ─── Batch fetch ────────────────────────────────────────────────────────────
// Next.js serializes concurrent server action calls from the client, so
// fetching cards, agents, and intents as separate calls runs sequentially.
// This single action fetches all data in parallel on the server side.

export async function fetchAllData(jwt: string): Promise<{
  cards: PaymentMethodResponse[];
  agents: AgentResponse[];
  orderIntents: OrderIntentResponse[];
}> {
  const [cards, agents, orderIntents] = await Promise.all([
    fetchPaymentMethods(jwt),
    fetchAgents(jwt),
    fetchOrderIntents(jwt).catch(() => [] as OrderIntentResponse[]),
  ]);
  return { cards, agents, orderIntents };
}

// ─── Agentic enrollment ─────────────────────────────────────────────────────
// Before an agent can use a payment method, the card must be enrolled.
// Enrollment requires passkey verification from the user.

/** Check the agentic enrollment status for a payment method. */
export async function checkEnrollment(jwt: string, paymentMethodId: string): Promise<AgenticEnrollmentResponse> {
  try {
    const res = await fetch(`${BASE_URL}/payment-methods/${paymentMethodId}/agentic-enrollment`, {
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": API_KEY,
        Authorization: `Bearer ${jwt}`,
      },
    });

    if (!res.ok) throw new Error(`Failed to check enrollment (${res.status})`);
    return res.json();
  } catch {
    return { status: "not_started" };
  }
}

/** Start agentic enrollment for a payment method. Returns a pending enrollment that needs passkey verification. */
export async function enrollPaymentMethod(jwt: string, paymentMethodId: string, email: string): Promise<AgenticEnrollmentResponse> {
  const res = await fetch(`${BASE_URL}/payment-methods/${paymentMethodId}/agentic-enrollment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": API_KEY,
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) throw new Error(`Failed to enroll payment method (${res.status})`);
  return res.json();
}

// ─── Virtual card issuance ──────────────────────────────────────────────────

/**
 * Create an order intent (virtual card) with spending mandates.
 * The order intent may require passkey verification before becoming active.
 */
export async function createNewOrderIntent(jwt: string, agentId: string, paymentMethodId: string, mandates: Mandate[]): Promise<OrderIntentResponse> {
  const res = await fetch(`${BASE_URL}/order-intents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": API_KEY,
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({
      agentId,
      payment: { paymentMethodId },
      mandates,
    }),
  });

  if (!res.ok) throw new Error(`Failed to create order intent (${res.status})`);
  return res.json();
}

/**
 * Fetch virtual card credentials (card number, expiration, CVC) for an active order intent.
 * Requires merchant info to generate the credentials.
 */
export async function fetchCardCredentials(
  jwt: string,
  orderIntentId: string,
  merchant: { name: string; url: string; countryCode: string },
): Promise<CardCredentials> {
  const res = await fetch(`${BASE_URL}/order-intents/${orderIntentId}/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": API_KEY,
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ merchant }),
  });

  if (!res.ok) throw new Error(`Failed to fetch card credentials (${res.status})`);
  return res.json();
}
