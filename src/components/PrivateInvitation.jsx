import { useEffect, useMemo, useState } from "react";
import { getPublicInvitation, recordInvitationVisit, submitGuestList } from "../services/invitations";
import "./PrivateInvitation.css";

function getVisitId(token) {
  const key = `freya_invite_visit_${token}`;
  try {
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(key, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export default function PrivateInvitation() {
  const token = useMemo(() => new URLSearchParams(window.location.search).get("invitacion"), []);
  const [invitation, setInvitation] = useState(null);
  const [guests, setGuests] = useState([]);
  const [status, setStatus] = useState("loading");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getPublicInvitation(token);
        if (cancelled) return;
        setInvitation(data);
        setGuests(data.guests?.length
          ? data.guests.map((guest) => ({ name: guest.name || "", attending: Boolean(guest.attending) }))
          : Array.from({ length: data.maxGuests }, () => ({ name: "", attending: false })));
        setStatus("ready");
        await recordInvitationVisit(token, getVisitId(token));
      } catch (error) {
        if (!cancelled) {
          setMessage(error.message || "No fue posible abrir esta invitación.");
          setStatus("error");
        }
      }
    }
    if (token) load();
    else setStatus("error");
    return () => { cancelled = true; };
  }, [token]);

  function updateGuest(index, patch) {
    setGuests((current) => current.map((guest, i) => i === index ? { ...guest, ...patch } : guest));
  }

  async function save(event) {
    event.preventDefault();
    setMessage("");
    const namedGuests = guests.filter((guest) => guest.name.trim());
    const attendingWithoutName = guests.some((guest) => guest.attending && !guest.name.trim());
    if (attendingWithoutName) {
      setMessage("Escribe el nombre de cada persona que asistirá.");
      return;
    }
    if (namedGuests.length > invitation.maxGuests) {
      setMessage(`Esta invitación permite un máximo de ${invitation.maxGuests} personas.`);
      return;
    }
    setSaving(true);
    try {
      const result = await submitGuestList(token, namedGuests.map((guest) => ({
        name: guest.name.trim(),
        attending: Boolean(guest.attending),
      })));
      setInvitation((current) => ({ ...current, guests: result.guests }));
      setGuests(result.guests.map((guest) => ({ name: guest.name, attending: guest.attending })));
      setMessage("Tu confirmación quedó registrada. ¡Gracias!");
    } catch (error) {
      setMessage(error.message || "No se pudo guardar la confirmación.");
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading") return <main className="private-invite"><p>Preparando tu invitación…</p></main>;
  if (status === "error") return <main className="private-invite"><h1>Invitación no disponible</h1><p>{message || "El enlace no es válido o fue desactivado. Contacta a la familia de Freya."}</p></main>;

  const attendingCount = guests.filter((guest) => guest.name.trim() && guest.attending).length;
  return (
    <main className="private-invite">
      <section className="private-invite__card">
        <p className="private-invite__eyebrow">XV años · 28 de noviembre de 2026</p>
        <h1>Freya Marlene</h1>
        <p className="private-invite__intro">Tu presencia hará este día aún más especial.</p>
        <div className="private-invite__quota">
          <strong>{invitation.maxGuests}</strong>
          <span>lugares reservados para {invitation.familyName}</span>
        </div>
        <form onSubmit={save}>
          <h2>¿Quiénes nos acompañarán?</h2>
          <p className="private-invite__hint">Registra los nombres y marca si cada persona asistirá. Puedes usar hasta {invitation.maxGuests} lugares.</p>
          <div className="private-invite__guest-list">
            {guests.map((guest, index) => (
              <div className="private-invite__guest" key={index}>
                <label>
                  <span>Nombre de la persona {index + 1}</span>
                  <input
                    value={guest.name}
                    maxLength={100}
                    onChange={(event) => updateGuest(index, { name: event.target.value })}
                    placeholder={`Nombre ${index + 1}`}
                  />
                </label>
                <label className="private-invite__attending">
                  <input
                    type="checkbox"
                    checked={guest.attending}
                    onChange={(event) => updateGuest(index, { attending: event.target.checked })}
                    disabled={!guest.name.trim()}
                  />
                  <span>Asistirá</span>
                </label>
              </div>
            ))}
          </div>
          <p className="private-invite__counter">{attendingCount} de {invitation.maxGuests} asistentes confirmados</p>
          <button className="private-invite__button" type="submit" disabled={saving}>
            {saving ? "Guardando…" : "Guardar confirmación"}
          </button>
          {message && <p className="private-invite__message" role="status">{message}</p>}
        </form>
        <p className="private-invite__footer">Parroquia 17:45 · Recepción 19:00 · Vestimenta formal</p>
      </section>
    </main>
  );
}
