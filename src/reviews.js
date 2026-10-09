// The logged-in player's private raid reviews (/api/reviews, see
// netlify/functions/auth.mjs). Fetched once, only for Battle.net-verified
// visitors; the review page itself lives in src/raids/MyReviews.jsx.
import { useEffect, useState } from "react";
import { useIdentity } from "./identity.js";

let loaded = null;
let pending = null;

export function useMyReviews() {
  const { verified } = useIdentity();
  const [data, setData] = useState(loaded);
  useEffect(() => {
    if (!verified) return;
    if (loaded) return setData(loaded);
    pending ??= fetch("/api/reviews", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : { reviews: [] }))
      .catch(() => ({ reviews: [] }))
      .then((d) => (loaded = d.reviews || []));
    pending.then(setData);
  }, [verified]);
  return verified ? data : null; // null = not logged in or still loading
}

// Reviews of one character, newest first.
export const reviewsOf = (all, name) => (all || []).filter((r) => r.player.toLowerCase() === (name || "").toLowerCase());
