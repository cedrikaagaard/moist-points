// Hall of Shame on the home page: everyone who has killed Mr. Bigglesworth,
// Kel'Thuzad's cat. Data from scripts/raids/bigglesworth.mjs.
import data from "./data/bigglesworth.json";
import { classColor, fmtDate } from "./assets.js";
import { Player } from "./components.jsx";
import { href } from "../router.js";
import "./raids.css";

const CAT = "https://wow.zamimg.com/images/wow/icons/large/ability_hunter_pet_cat.jpg";
const how = (w) => (!w || w === "Melee" ? "in melee" : `with ${w}`);

export default function HallOfShame() {
  const kills = data.kills || [];
  if (!kills.length) return null;
  const by = new Map();
  for (const k of kills) {
    const e = by.get(k.killer) || { name: k.killer, cls: k.class, n: 0, last: k };
    e.n++;
    if (k.date > e.last.date) e.last = k;
    by.set(k.killer, e);
  }
  const board = [...by.values()].sort((a, b) => b.n - a.n || b.last.date.localeCompare(a.last.date));
  const worst = board[0];
  const latest = kills[0];
  return (
    <section className="panel shame">
      <div className="shame-head">
        <img src={CAT} alt="" width="56" height="56" className="shame-cat" />
        <div>
          <div className="rr-kicker shame-kicker">Hall of Shame</div>
          <h2>Who killed Mr. Bigglesworth?</h2>
          <p className="muted">
            Kel'Thuzad's cat. He sits in the corner and has never hurt anyone. {kills.length} times in Moist's logs, {board.length} different raiders killed him
            anyway.
          </p>
        </div>
      </div>

      <div className="shame-grid">
        <div className="shame-worst" style={{ "--c": classColor(worst.cls) }}>
          <div className="shame-label">Worst offender</div>
          <div className="shame-worst-name">
            <Player name={worst.name} cls={worst.cls} size={22} />
          </div>
          <div className="shame-worst-n">
            <b>{worst.n}</b> cats
          </div>
          <div className="muted shame-small">
            Most recently {fmtDate(worst.last.date, { day: "numeric", month: "short", year: "numeric" })}, {how(worst.last.with)}
          </div>
        </div>

        <ol className="shame-board">
          {board.slice(0, 10).map((e, i) => (
            <li key={e.name}>
              <span className="shame-rank muted">{i + 1}</span>
              <Player name={e.name} cls={e.cls} size={16} />
              <span className="shame-paws" aria-hidden="true" />
              <b className="shame-n">{e.n}</b>
            </li>
          ))}
        </ol>

        <div className="shame-recent">
          <div className="shame-label">Latest crimes</div>
          <ul>
            {kills.slice(0, 6).map((k, i) => (
              <li key={i}>
                <Player name={k.killer} cls={k.class} size={14} />{" "}
                <span className="muted">
                  {how(k.with)}
                  {k.pet ? ` (via ${k.pet})` : ""} ·{" "}
                  {k.night ? <a href={href("raids", k.night)}>{fmtDate(k.date, { day: "numeric", month: "short" })}</a> : fmtDate(k.date, { day: "numeric", month: "short" })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="muted shame-foot">
        Last cat death: {fmtDate(latest.date, { day: "numeric", month: "long", year: "numeric" })}. Counted from the full combat logs: the raider who landed the killing
        blow, once per raid.
      </div>
    </section>
  );
}
