import PlayerPage from "../components/PlayerPage.jsx";
import IdentityPicker from "../components/IdentityPicker.jsx";
import { useMe, useIdentity, setMe } from "../identity.js";
import { allRaiders } from "../lib/roster.js";
import BnetVerify from "../components/BnetVerify.jsx";

// SR raiders first, then anyone the raid logs know who hasn't soft-reserved yet.
function pickable(players) {
  const known = new Set(players.map((p) => p.name.toLowerCase()));
  return [...players, ...allRaiders().filter((r) => !known.has(r.name.toLowerCase()))];
}

export default function Me({ data }) {
  const me = useMe();
  const { verified } = useIdentity();
  const player = me ? data.playerByName.get(me.toLowerCase()) : null;

  // Not chosen yet → prompt to pick a character.
  if (!me) {
    return (
      <div className="view">
        <section className="me-hero">
          <h1>
            Who <span className="hero-accent">are</span> you?
          </h1>
          <p className="hero-sub">
            Pick your character to see your points, your best bets, and get your rows highlighted
            across the site. It's saved on this device, or verify with Battle.net below to prove which characters are yours.
          </p>
          <div className="me-hero-pick">
            <IdentityPicker
              players={pickable(data.players)}
              autoFocus
              placeholder="Type your character name…"
              onPick={setMe}
            />
          </div>
          <BnetVerify />
        </section>
      </div>
    );
  }

  // Chosen: the same page as their raider profile, framed as "yours".
  return (
    <>
      <div className="view bnet-wrap"><BnetVerify /></div>
      <PlayerPage data={data} name={me} player={player} isMe onChangeMe={verified ? null : () => setMe(null)} />
    </>
  );
}
