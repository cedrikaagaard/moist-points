import { useIdentity, setMe } from "../identity.js";

// A quiet line on My Page: verify which characters are yours with Battle.net,
// and once verified, switch between your own characters.
export default function BnetVerify() {
  const id = useIdentity();
  const q = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const error = q.get("bnet") === "error" ? q.get("reason") || "unknown error" : null;
  if (id.loading) return null;

  if (!id.verified) {
    return (
      <div className="bnet-line">
        {error ? <span className="bnet-error">Battle.net login failed ({error}).</span> : <span className="muted">Not verified.</span>}{" "}
        <a href="/api/auth/login">Verify your characters with Battle.net</a>
      </div>
    );
  }
  return (
    <div className="bnet-line">
      <span className="bnet-ok">✓ Verified with Battle.net</span>
      {id.owned.length > 1 && (
        <span className="bnet-chars">
          <span className="muted">your characters:</span>
          {id.owned.map((name) => (
            <button key={name} type="button" className={`bnet-char${name === id.me ? " active" : ""}`} onClick={() => setMe(name)}>
              {name}
            </button>
          ))}
        </span>
      )}
      {id.owned.length === 0 && <span className="muted">· no characters on Firemaw found on this account</span>}
      <a href="/api/auth/logout" className="muted">log out</a>
    </div>
  );
}
