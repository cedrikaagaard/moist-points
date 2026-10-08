import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { BossIcon } from "./components.jsx";

// "Claude's analysis": optional, AI-written commentary on a raid night,
// written by the /raid-logs skill from `npm run raids:facts` and stored in
// src/raids/data/analysis/<night>.json. Clearly labelled, and only a faded
// preview until someone opens it, so it never takes over the page.
//   { night, model, generatedAt, headline, overview: [..],
//     wentWell: [{ text, encounterId? }], wipes: [{ encounterId, pull, title,
//     whatHappened, likelyCause, evidence: [..], avoid }],
//     bosses: [{ encounterId, name, notes: [{ tone: "good"|"bad"|"info", text }] }],
//     mechanics: [{ encounterId, verdict: "good"|"bad", text }] (older files) }
const files = import.meta.glob("./data/analysis/*.json", { import: "default" });

export function useAnalysis(night) {
  const [a, setA] = useState(null);
  useEffect(() => {
    let live = true;
    setA(null);
    files[`./data/analysis/${night}.json`]?.().then((d) => live && setA(d));
    return () => {
      live = false;
    };
  }, [night]);
  return a;
}

// encounterId: only show what's about that boss (night-boss page).
export default function Analysis({ night, encounterId, bossName }) {
  const a = useAnalysis(night);
  const [open, setOpen] = useState(false);
  const [short, setShort] = useState(false); // fits without a preview: just show it
  const body = useRef(null);
  useEffect(() => setOpen(false), [night, encounterId]);
  useLayoutEffect(() => {
    if (body.current) setShort(body.current.scrollHeight <= 190);
  }, [a, encounterId]);
  if (!a) return null;
  const forBoss = (x) => encounterId == null || x.encounterId === encounterId;
  const wins = (a.wentWell || []).filter(forBoss);
  const wipes = (a.wipes || []).filter(forBoss);
  const mech = (a.mechanics || []).filter(forBoss);
  const bosses = (a.bosses || []).filter(forBoss);
  if (encounterId != null && !wins.length && !wipes.length && !mech.length && !bosses.length) return null;

  const dot = (tone) => <i className={`rr-llm-dot ${tone || "info"}`} aria-label={tone === "good" ? "went well" : tone === "bad" ? "problem" : "note"} />;

  return (
    <div className={`rr-llm${open || short ? " open" : ""}`}>
      <div className="rr-llm-head">
        <span className="rr-llm-label">✨ Claude's analysis</span>
        <span className="rr-llm-note">AI-written from the logs · may be wrong</span>
      </div>
      <h3 className="rr-llm-title">{encounterId == null ? a.headline : `What Claude made of ${bossName}`}</h3>
      <div ref={body} className="rr-llm-body" inert={open || short ? undefined : ""} onClick={open || short ? undefined : () => setOpen(true)}>
        {encounterId == null && a.overview?.map((p, i) => <p key={i}>{p}</p>)}

        {wins.length > 0 && (
          <section>
            <h4>Highlights</h4>
            <ul className="rr-llm-list">
              {wins.map((w, i) => (
                <li key={i}>
                  {w.encounterId ? <BossIcon id={w.encounterId} name="" size={20} /> : dot("good")}
                  <span>{w.text}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {wipes.length > 0 && (
          <section>
            <h4>Wipes</h4>
            {wipes.map((w, i) => (
              <div key={i} className="rr-llm-wipe">
                <div className="rr-llm-card-head">
                  <BossIcon id={w.encounterId} name={w.title} size={26} />
                  <b>{w.title}</b>
                </div>
                <dl>
                  <dt>What happened</dt>
                  <dd>{w.whatHappened}</dd>
                  <dt>Most likely cause</dt>
                  <dd>{w.likelyCause}</dd>
                  {w.evidence?.length > 0 && (
                    <>
                      <dt>From the logs</dt>
                      <dd>
                        <ul>{w.evidence.map((e, j) => <li key={j}>{e}</li>)}</ul>
                      </dd>
                    </>
                  )}
                  <dt>Next time</dt>
                  <dd>{w.avoid}</dd>
                </dl>
              </div>
            ))}
          </section>
        )}

        {bosses.length > 0 && (
          <section>
            {encounterId == null && <h4>Boss by boss</h4>}
            <div className={encounterId == null ? "rr-llm-bosses" : undefined}>
              {bosses.map((b) => (
                <div key={b.encounterId} className={encounterId == null ? "rr-llm-boss" : undefined}>
                  {encounterId == null && (
                    <div className="rr-llm-card-head">
                      <BossIcon id={b.encounterId} name={b.name} size={22} />
                      <b>{b.name}</b>
                    </div>
                  )}
                  <ul className="rr-llm-list">
                    {b.notes.map((n, i) => (
                      <li key={i}>
                        {dot(n.tone)}
                        <span>{n.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {mech.length > 0 && (
          <section>
            <h4>Mechanics</h4>
            <ul className="rr-llm-list">
              {mech.map((m, i) => (
                <li key={i}>
                  {dot(m.verdict === "good" ? "good" : "bad")}
                  <span>{m.text}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        <div className="rr-llm-foot">
          Written by {a.model || "an AI"} from this night's logs{a.generatedAt ? ` on ${a.generatedAt.slice(0, 10)}` : ""}. Numbers come from the logs; the explanations are its best guess.
        </div>
      </div>
      {short ? (
        <div className="rr-llm-gap" />
      ) : (
        <button type="button" className="rr-llm-toggle" onClick={() => setOpen(!open)} aria-expanded={open}>
          {open ? "Show less ↑" : "Read the full analysis ↓"}
        </button>
      )}
    </div>
  );
}
