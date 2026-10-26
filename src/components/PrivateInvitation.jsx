
import { useEffect, useMemo, useState } from "react";
import {
  getPublicInvitation,
  recordInvitationVisit,
  submitGuestList,
} from "../services/invitations";
import "./PrivateInvitation.css";

const EVENT_DATE = new Date("2026-11-28T17:45:00-06:00");

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

function calculateTime() {
  const remaining = Math.max(0, EVENT_DATE.getTime() - Date.now());

  return {
    days: Math.floor(remaining / 86400000),
    hours: Math.floor((remaining / 3600000) % 24),
    minutes: Math.floor((remaining / 60000) % 60),
    seconds: Math.floor((remaining / 1000) % 60),
  };
}

function Countdown() {
  const [time, setTime] = useState(calculateTime);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTime(calculateTime());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="mini-countdown" aria-label="Cuenta regresiva">
      {[
        ["days", "días"],
        ["hours", "horas"],
        ["minutes", "minutos"],
        ["seconds", "segundos"],
      ].map(([key, label]) => (
        <div className="mini-countdown__item" key={key}>
          <strong>{String(time[key]).padStart(2, "0")}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

function MiniDivider() {
  return (
    <div className="mini-divider" aria-hidden="true">
      <span />
      <i>✧</i>
      <span />
    </div>
  );
}

export default function PrivateInvitation() {
  const token = useMemo(
    () => new URLSearchParams(window.location.search).get("invitacion"),
    []
  );

  const [invitation, setInvitation] = useState(null);
  const [attendingCount, setAttendingCount] = useState(0);
  const [responseSubmitted, setResponseSubmitted] = useState(false);
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
        setAttendingCount(data.confirmedCount);
        setResponseSubmitted(data.responseSubmitted);
        setStatus("ready");

        await recordInvitationVisit(token, getVisitId(token));
      } catch (error) {
        if (!cancelled) {
          setMessage(
            error.message || "No fue posible abrir esta invitación."
          );
          setStatus("error");
        }
      }
    }

    if (token) load();
    else {
      setMessage("El enlace de invitación no es válido.");
      setStatus("error");
    }

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function save(event) {
    event.preventDefault();
    setMessage("");

    if (responseSubmitted) {
      setMessage("Tu familia ya registró su confirmación.");
      return;
    }

    const count = Number(attendingCount);

    if (
      !Number.isInteger(count) ||
      count < 0 ||
      count > invitation.maxGuests
    ) {
      setMessage(
        `Puedes confirmar de 0 a ${invitation.maxGuests} personas.`
      );
      return;
    }

    setSaving(true);

    try {
      const result = await submitGuestList(token, count);

      setAttendingCount(result.confirmedCount);
      setResponseSubmitted(true);

      setInvitation((current) => ({
        ...current,
        confirmedCount: result.confirmedCount,
        responseSubmitted: true,
      }));

      setMessage("¡Gracias! Tu confirmación quedó registrada.");
    } catch (error) {
      setMessage(
        error.message || "No se pudo guardar la confirmación."
      );
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading") {
    return (
      <main className="private-invite">
        <section className="private-invite__card">
          <p>Preparando tu invitación…</p>
        </section>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="private-invite">
        <section className="private-invite__card">
          <p className="mini-eyebrow">XV años · Freya Marlene</p>
          <h1>Invitación no disponible</h1>
          <MiniDivider />
          <p>{message}</p>
        </section>
      </main>
    );
  }

  const available = invitation.maxGuests - invitation.confirmedCount;

  return (
    <main className="private-invite">
      <div className="mini-decoration mini-decoration--left" aria-hidden="true">
        ❧
      </div>
      <div className="mini-decoration mini-decoration--right" aria-hidden="true">
        ❧
      </div>

      <section className="private-invite__card mini-card">
        <div className="mini-top-ornament" aria-hidden="true">
          <span>✧</span>
          <span>❦</span>
          <span>✧</span>
        </div>

        <p className="mini-eyebrow">Una invitación especial para</p>

        <h1>Freya Marlene</h1>

        <p className="mini-subtitle">Mis XV años</p>

        <MiniDivider />

        <p className="mini-intro">
          Nos encantará compartir contigo una noche llena de alegría,
          cariño y momentos inolvidables.
        </p>

        <div className="mini-date">
          <span>SÁBADO</span>
          <strong>28</strong>
          <span>NOVIEMBRE · 2026</span>
          <p>La celebración comienza a las 17:45 hrs.</p>
        </div>

        <section className="mini-section">
          <p className="mini-eyebrow">Reserva la fecha</p>
          <h2>La cuenta regresiva comienza</h2>
          <Countdown />
        </section>

        <MiniDivider />

        <section className="mini-section mini-family">
          <p className="mini-eyebrow">Con cariño</p>
          <p className="mini-family__label">Mis padres</p>
          <p className="mini-family__names">Mara <span>y</span> Roman</p>
          <p className="mini-family__label">Mi madrina</p>
          <p className="mini-family__names">Dulce Maria</p>
        </section>

        <section className="mini-section mini-details">
          <p className="mini-eyebrow">Detalles para tu visita</p>
          <h2>Te esperamos</h2>

          <article className="mini-detail">
            <span className="mini-detail__icon" aria-hidden="true">♧</span>
            <div>
              <h3>Ceremonia eucarística</h3>
              <p>17:45 hrs.</p>
              <a
                href="https://share.google/VJlHec0eA0R3uA7Ib"
                target="_blank"
                rel="noreferrer"
              >
                Parroquia de San Lorenzo Diácono y Mártir ↗
              </a>
            </div>
          </article>

          <article className="mini-detail">
            <span className="mini-detail__icon" aria-hidden="true">❦</span>
            <div>
              <h3>Recepción</h3>
              <p>19:00 hrs.</p>
              <a
                href="https://share.google/hwiALi7eAysCPAbKz"
                target="_blank"
                rel="noreferrer"
              >
                Salón de eventos Riverside ↗
              </a>
            </div>
          </article>

          <article className="mini-detail mini-detail--parking">
            <span className="mini-detail__icon" aria-hidden="true">P</span>
            <div>
              <h3>Valet parking</h3>
              <p>Para mayor comodidad durante el evento.</p>
              <strong>Costo: $60.00</strong>
            </div>
          </article>
        </section>

        <section className="mini-section mini-colors">
          <p className="mini-eyebrow">Un detalle importante</p>
          <h2>Colores reservados</h2>
          <p>Te agradecemos reservar estos tonos para la celebración.</p>

          <div className="mini-swatches">
            <div>
              <span className="mini-swatch mini-swatch--lilac" />
              <span>Lila</span>
            </div>
            <div>
              <span className="mini-swatch mini-swatch--gray" />
              <span>Gris</span>
            </div>
          </div>
        </section>

        <section className="mini-rsvp">
          <p className="mini-eyebrow">Tu presencia es especial</p>
          <h2>¿Nos acompañas?</h2>
          <p>
            {invitation.familyName}, confirma cuántas personas asistirán
            utilizando los lugares asignados a tu familia.
          </p>

          <div className="mini-quota">
            <div>
              <span>Cupo familiar</span>
              <strong>{invitation.maxGuests}</strong>
            </div>
            <div>
              <span>Confirmados</span>
              <strong>{invitation.confirmedCount}</strong>
            </div>
            <div>
              <span>Disponibles</span>
              <strong>{available}</strong>
            </div>
          </div>

          <form onSubmit={save} className="mini-rsvp__form">
            <label htmlFor="attending-count">
              ¿Cuántas personas asistirán?
            </label>

            <input
              id="attending-count"
              type="number"
              min="0"
              max={invitation.maxGuests}
              step="1"
              required
              disabled={responseSubmitted}
              value={attendingCount}
              onChange={(event) => {
                const value = event.target.value;
                setAttendingCount(value === "" ? "" : Number(value));
              }}
            />

            <p className="mini-rsvp__hint">
              Puedes confirmar menos lugares, pero no superar el cupo máximo.
            </p>

            <button
              className="private-invite__button mini-submit"
              type="submit"
              disabled={saving || responseSubmitted || attendingCount === ""}
            >
              {saving
                ? "Guardando confirmación…"
                : responseSubmitted
                  ? "Confirmación registrada ✓"
                  : "Confirmar asistencia"}
            </button>

            {message && (
              <p className="private-invite__message mini-message" role="status">
                {message}
              </p>
            )}
          </form>
        </section>

        <footer className="mini-footer">
          <div className="mini-footer__ornament">✧ ─── ♡ ─── ✧</div>
          <p>Una noche para recordar, un sueño hecho realidad.</p>
          <strong>Freya Marlene</strong>
          <span>28 · 11 · 2026</span>
        </footer>
      </section>
    </main>
  );
}
