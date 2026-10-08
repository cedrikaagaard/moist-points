import { useEffect, useState } from "react";
import { BossIcon } from "./components.jsx";

// "Magic LLM analysis": optional, AI-written commentary on a raid night,
// written by the /raid-logs skill from `npm run raids:facts` and stored in
// src/raids/data/analysis/<night>.json. Always collapsed and clearly labelled,
// so nobody has to read it.
//   { night, model, generatedAt, headline, overview: [..],
//     wentWell: [{ text, encounterId? }], wipes: [{ encounterId, pull, title,
//     whatHappened, likelyCause, evidence: [..], avoid }],
//     mechanics: [{ encounterId, verdict: "good"|"bad", text }] }
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
  if (!a) return null;
  const forBoss = (x) => encounterId == null || x.encounterId === encounterId;
  const wins = (a.wentWell || []).filter(forBoss);
  const wipes = (a.wipes || []).filter(forBoss);
  const mech = (a.mechanics || []).filter(forBoss);
  if (encounterId != null && !wins.length && !wipes.length && !mech.length) return null;

  return (
    <details className="rr-llm">
      <summary>
        <span className="rr-llm-badge">✨ Magic LLM analysis</span>
        <span className="rr-llm-what">
          {encounterId == null ? a.headline : `What the AI made of ${bossName}`}
        </span>
        <span className="rr-llm-note muted">AI-written from the logs · may be wrong · click to open</span>
      </summary>
      <div className="rr-llm-body">
        {encounterId == null && a.overview?.map((p, i) => <p key={i}>{p}</p>)}

        {wipes.length > 0 && (
          <section>
            <h3>Wipes</h3>
            {wipes.map((w, i) => (
              <div key={i} className="rr-llm-wipe">
                <div className="rr-llm-wipe-head">
                  <BossIcon id={w.encounterId} name={w.title} size={32} />
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

        {wins.length > 0 && (
          <section>
            <h3>What went well</h3>
            <ul className="rr-llm-list">
              {wins.map((w, i) => (
                <li key={i}>
                  {w.encounterId && <BossIcon id={w.encounterId} name="" size={20} />}
                  <span>{w.text}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {mech.length > 0 && (
          <section>
            <h3>Mechanics</h3>
            <ul className="rr-llm-list">
              {mech.map((m, i) => (
                <li key={i} className={m.verdict === "good" ? "good" : "bad"}>
                  {m.encounterId && <BossIcon id={m.encounterId} name="" size={20} />}
                  <span>{m.text}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        <div className="rr-llm-foot muted">
          Written by {a.model || "an AI"} from this night's logs{a.generatedAt ? ` on ${a.generatedAt.slice(0, 10)}` : ""}. Numbers come from the logs; the explanations are its best guess.
        </div>
      </div>
    </details>
  );
}
