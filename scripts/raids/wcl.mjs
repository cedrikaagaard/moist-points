// Minimal Warcraft Logs v2 API client: client-credentials token + GraphQL.
import { TOKEN_URL, API_URL } from "./config.mjs";

let token = null;

async function getToken() {
  if (token) return token;
  const id = process.env.WCL_CLIENT_ID;
  const secret = process.env.WCL_CLIENT_SECRET;
  if (!id || !secret || secret === "PASTE_SECRET_HERE") {
    throw new Error("Missing WCL_CLIENT_ID / WCL_CLIENT_SECRET - fill them in .env.local");
  }
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`WCL token request failed: ${res.status} ${await res.text()}`);
  token = (await res.json()).access_token;
  return token;
}

export async function gql(query, variables = {}) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await getToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || body?.errors) {
    const msg = body?.errors?.map((e) => e.message).join("; ") || `${res.status}`;
    throw new Error(`WCL query failed: ${msg}`);
  }
  return body.data;
}

export async function rateLimit() {
  const d = await gql(`{ rateLimitData { limitPerHour pointsSpentThisHour pointsResetIn } }`);
  return d.rateLimitData;
}
