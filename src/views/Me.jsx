import PlayerPage from "../components/PlayerPage.jsx";
import IdentityPicker from "../components/IdentityPicker.jsx";
import { useMe, useIdentity, setMe } from "../identity.js";
import { allRaiders } from "../lib/roster.js";
import { BnetLogin, AccountBar } from "../components/BnetVerify.jsx";

// SR raiders first, then anyone the raid logs know who hasn't soft-reserved yet.
function pickable(players) {
  const known = new Set(players.map((p) => p.name.toLowerCase()));
  return [...players, ...allRaiders().filter((r) => !known.has(r.name.toLowerCase()))];
}

export default function Me({ data }) {
  const me = useMe();
  const { verified, loading } = useIdentity();
  const player = me ? data.playerByName.get(me.toLowerCase()) : null;

  // Not chosen yet: log in with Battle.net, or pick a character by hand.
  if (!me) {
    return (
      <div className="view">
        <section className="me-hero">
          <h1>
            Who <span className="hero-accent">are</span> you?
          </h1>
          <p className="hero-sub">Your points, your raids, your rows highlighted across the site.</p>
          {!loading && (
            <div className="me-choose">
              <BnetLogin />
              <div className="me-or"><span>or</span></div>
              <div className="me-manual">
                <div className="me-manual-title">Just pick your character</div>
                <IdentityPicker players={pickable(data.players)} placeholder="Type your character name…" onPick={setMe} />
                <div className="bnet-sub">Saved on this device. Anyone can pick any name this way, so no reviews.</div>
              </div>
            </div>
          )}
        </section>
      </div>
    );
  }

  // Chosen: the same page as their raider profile, framed as "yours".
  return (
    <>
      <div className="view acct-wrap"><AccountBar /></div>
      <PlayerPage data={data} name={me} player={player} isMe onChangeMe={verified ? null : () => setMe(null)} />
    </>
  );
}
