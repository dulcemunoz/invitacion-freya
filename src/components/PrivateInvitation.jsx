import { useEffect, useMemo, useState } from "react";
import {
  getPublicInvitation,
  recordInvitationVisit,
  submitGuestList,
} from "../services/invitations";
import "./PrivateInvitation.css";
import "../App.css";

const EVENT_DATE = new Date("2026-11-28T17:45:00-06:00");

const CHURCH_URL = "https://share.google/VJlHec0eA0R3uA7Ib";

const RECEPTION_URL = "https://share.google/hwiALi7eAysCPAbKz";

// generic invitation
function Butterfly({ className = "" }) {
  return (
    <svg
      className={`butterfly ${className}`}
      viewBox="0 0 100 90"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="wingColor" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E9DFFF" />
          <stop offset="55%" stopColor="#B9A1D9" />
          <stop offset="100%" stopColor="#80649F" />
        </linearGradient>
      </defs>

      <g className="wing wing-left">
        <path
          d="M49 44 C28 4 4 8 12 37 C17 52 34 53 49 48 Z"
          fill="url(#wingColor)"
          stroke="#725486"
          strokeWidth="1.8"
        />
        <path
          d="M47 48 C24 38 15 56 29 67 C40 73 47 59 49 51 Z"
          fill="#C7B0E1"
          stroke="#725486"
          strokeWidth="1.5"
        />
        <path
          d="M18 25 Q30 25 43 44 M25 48 L43 49 M34 61 L46 53"
          stroke="#F8F0FF"
          strokeWidth="1.5"
        />
      </g>

      <g className="wing wing-right">
        <path
          d="M51 44 C72 4 96 8 88 37 C83 52 66 53 51 48 Z"
          fill="url(#wingColor)"
          stroke="#725486"
          strokeWidth="1.8"
        />
        <path
          d="M53 48 C76 38 85 56 71 67 C60 73 53 59 51 51 Z"
          fill="#C7B0E1"
          stroke="#725486"
          strokeWidth="1.5"
        />
        <path
          d="M82 25 Q70 25 57 44 M75 48 L57 49 M66 61 L54 53"
          stroke="#F8F0FF"
          strokeWidth="1.5"
        />
      </g>

      <path
        d="M50 37 Q45 22 39 20 M50 37 Q55 22 61 20"
        stroke="#725486"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <ellipse cx="50" cy="49" rx="2.7" ry="13" fill="#755A87" />
    </svg>
  );
}

function Chandelier() {
  return (
    <svg
      className="chandelier"
      viewBox="0 0 220 190"
      fill="none"
      aria-hidden="true"
    >
      <g stroke="#B89A62" strokeWidth="1.4">
        <path d="M110 0 V27" />
        <path d="M96 26 Q110 36 124 26" />
        <path d="M110 28 C110 54 79 57 60 75" />
        <path d="M110 28 C110 54 141 57 160 75" />
        <path d="M60 75 Q110 108 160 75" />
        <path d="M60 75 L44 104 Q110 139 176 104 L160 75" />
        <path d="M44 104 Q110 124 176 104" />
        <path d="M72 87 L65 120 M148 87 L155 120" />
        <path d="M87 97 L83 135 M133 97 L137 135" />
        <path d="M110 103 V151" />
        <path d="M44 104 L35 124 M176 104 L185 124" />
      </g>
      <g fill="#FFF9E9" stroke="#B89A62" strokeWidth="1">
        <path d="M31 123 L35 134 L39 123 L35 118 Z" />
        <path d="M61 120 L65 132 L69 120 L65 115 Z" />
        <path d="M79 135 L83 147 L87 135 L83 130 Z" />
        <path d="M106 151 L110 164 L114 151 L110 146 Z" />
        <path d="M133 135 L137 147 L141 135 L137 130 Z" />
        <path d="M151 120 L155 132 L159 120 L155 115 Z" />
        <path d="M181 123 L185 134 L189 123 L185 118 Z" />
      </g>
      <g fill="#F5DFA7">
        <circle cx="35" cy="114" r="4" />
        <circle cx="65" cy="111" r="4" />
        <circle cx="83" cy="126" r="4" />
        <circle cx="110" cy="141" r="4" />
        <circle cx="137" cy="126" r="4" />
        <circle cx="155" cy="111" r="4" />
        <circle cx="185" cy="114" r="4" />
      </g>
    </svg>
  );
}

function Countdown() {
  const calculateTime = () => {
    const difference = EVENT_DATE.getTime() - Date.now();
    const remaining = Math.max(0, difference);
    return {
      days: Math.floor(remaining / 86400000),
      hours: Math.floor((remaining / 3600000) % 24),
      minutes: Math.floor((remaining / 60000) % 60),
      seconds: Math.floor((remaining / 1000) % 60),
    };
  };

  const [time, setTime] = useState(calculateTime);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTime(calculateTime());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="countdown" aria-label="Cuenta regresiva">
      {[
        ["days", "días"],
        ["hours", "horas"],
        ["minutes", "minutos"],
        ["seconds", "segundos"],
      ].map(([key, label]) => (
        <div className="countdown-item" key={key}>
          <strong>{String(time[key]).padStart(2, "0")}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

function MusicControl() {
  const [playing, setPlaying] = useState(false);
  const toggleMusic = async () => {
    const audio = document.getElementById("invitation-music");
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  };

  return (
    <>
      <audio id="invitation-music" loop>
        <source src="/musica-instrumental.mp3" type="audio/mpeg" />
      </audio>
      <button
        className="music-button"
        onClick={toggleMusic}
        aria-label={playing ? "Pausar música" : "Reproducir música"}
      >
        <span>{playing ? "Ⅱ" : "♫"}</span>
        {playing ? "Pausar música" : "Escuchar música"}
      </button>
    </>
  );
}

function SectionTitle({ eyebrow, children }) {
  return (
    <div className="section-title">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2>{children}</h2>
      <div className="gold-divider">
        <span />
        <i>✧</i>
        <span />
      </div>
    </div>
  );
}

function LocationCard({ icon, title, time, name, address, url }) {
  return (
    <article className="location-card">
      <div className="location-icon" aria-hidden="true">
        {icon}
      </div>
      <p className="location-kicker">{title}</p>
      <p className="location-time">{time}</p>
      <h3>{name}</h3>
      <p className="location-address">{address}</p>
      <a
        className="button button-location"
        href={url}
        target="_blank"
        rel="noreferrer"
      >
        <span aria-hidden="true">⌖</span> Consultar ubicación
      </a>
    </article>
  );
}
// private invitation
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
    [],
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
          setMessage(error.message || "No fue posible abrir esta invitación.");
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

    if (!Number.isInteger(count) || count < 0 || count > invitation.maxGuests) {
      setMessage(`Puedes confirmar de 0 a ${invitation.maxGuests} personas.`);
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
      setMessage(error.message || "No se pudo guardar la confirmación.");
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

  return (
    <>
      <main className="invitation">
        <div className="architecture" aria-hidden="true">
          <div className="marble-arch">
            <div className="arch-inner" />
          </div>
          <div className="arch-pillar pillar-left" />
          <div className="arch-pillar pillar-right" />
          <div className="marble-floor" />
        </div>
        <Chandelier />
        <Butterfly className="butterfly-one" />
        <Butterfly className="butterfly-two" />
        <Butterfly className="butterfly-three" />
        <Butterfly className="butterfly-four" />
        <Butterfly className="butterfly-five" />
        <div className="botanical botanical-left" aria-hidden="true">
          <span>❧</span>
          <span>❧</span>
          <span>✧</span>
        </div>
        <div className="botanical botanical-right" aria-hidden="true">
          <span>❧</span>
          <span>❧</span>
          <span>✧</span>
        </div>
        <div className="invitation-content">
          <header className="hero">
            <p className="hero-eyebrow">Familia {invitation.familyName}</p>
            <p className="hero-intro">
              Están cordialmente invitados a celebrar mis
            </p>
            <h1>XV Años</h1>
            <p className="quince-name">Freya Marlene</p>
            <div className="hero-ornament">
              <span />✧<span />
            </div>
            <p className="hero-date">
              Sábado <strong>28</strong> Noviembre 2026
            </p>
            <p className="hero-caption">
              Una noche de magia, sueños y momentos que vivirán por siempre en
              mi corazón.
            </p>
            <MusicControl />
          </header>
          <section className="special-section">
            <SectionTitle eyebrow="Con cariño, para ti">
              Una nueva etapa comienza
            </SectionTitle>
            <p className="intro-copy">
              Hoy comienza un capítulo maravilloso en mi historia. Acompáñame a
              celebrar mis quince años, rodeada de las personas que hacen mi
              mundo más bonito. Tu presencia será el detalle más especial.
            </p>
            <div className="family-grid">
              <div className="family-person">
                <span className="family-label">Mis padres</span>
                <p>Mara</p>
                <span className="family-and">y</span>
                <p>Roman</p>
              </div>
              <div className="family-separator" />
              <div className="family-person">
                <span className="family-label">Mi madrina</span>
                <p>Dulce Maria</p>
              </div>
            </div>
          </section>
          <section className="date-section">
            <SectionTitle eyebrow="Reserva la fecha">
              La cuenta regresiva ha comenzado
            </SectionTitle>
            <p className="date-number">28</p>
            <p className="date-month">NOVIEMBRE · 2026</p>
            <Countdown />
          </section>
          <section className="events-section">
            <SectionTitle eyebrow="Será un gusto recibirte">
              Ceremonia y recepción
            </SectionTitle>
            <div className="events-row">
              <LocationCard
                icon="⛪︎"
                title="Ceremonia eucarística"
                time="17:45 hrs."
                name="Parroquia de San Lorenzo Diácono y Mártir"
                address="Primero Rtno. Manzana 020, San Lorenzo, 56140 Texcoco de Mora, Méx."
                url={CHURCH_URL}
              />
              <LocationCard
                icon="❦"
                title="La Recepción"
                time="19:00 hrs."
                name={
                  <>
                    Salón de eventos
                    <br />
                    Riverside
                  </>
                }
                address="Miguel Alemán Manzana 022, La Trinidad, 56170 Texcoco de Mora, Méx."
                url={RECEPTION_URL}
              />
            </div>
          </section>
          <section className="details-section">
            <SectionTitle eyebrow="Información adicional">
              Para tu comodidad
            </SectionTitle>
            <article className="detail-card">
              <span className="detail-icon" aria-hidden="true">
                Ⓟ
              </span>
              <h3>Valet parking</h3>
              <p>
                Para que disfrutes de la celebración con tranquilidad,
                contaremos con servicio de valet parking durante el evento.
              </p>
              <strong className="detail-highlight">Costo: $60.00</strong>
            </article>
          </section>
          <section className="colors-section">
            <SectionTitle eyebrow="Un detalle importante">
              Colores reservados
            </SectionTitle>
            <p className="colors-copy">
              Con mucho cariño, te pido evitar los tonos lila y gris en tu
              vestimenta, ya que estarán destinados a detalles especiales de
              esta ocasión. ¡Gracias por ayudarme a mantener la armonía de este
              día tan esperado!
            </p>
            <div className="reserved-colors">
              <div className="reserved-color">
                <span className="color-swatch lilac" />
                <span>Lila</span>
              </div>
              <div className="reserved-color">
                <span className="color-swatch gray" />
                <span>Gris</span>
              </div>
            </div>
          </section>
          <section className="rsvp-section">
            <Butterfly className="rsvp-butterfly" />
            <SectionTitle eyebrow={`Familia ${invitation?.familyName}`}>
              ¡Espero contar contigo!
            </SectionTitle>
            <p className="rsvp-copy">
              Confirma cuántas personas asistirán utilizando los lugares
              asignados a tu familia.
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
                Indica el número de asistentes de tu familia. Puedes confirmar una cantidad menor al cupo asignado, pero no exceder el máximo permitido.
              </p>
              <button
                className="button button-location"
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
                <p
                  className="private-invite__message mini-message"
                  role="status"
                >
                  {message}
                </p>
              )}
            </form>
          </section>
          <footer className="invitation-footer">
            <div className="footer-flourish">✧ ───── ♡ ───── ✧</div>
            <p className="footer-script">
              Tu compañía convertirá esta noche en un recuerdo eterno.
            </p>
            <p className="footer-name">Freya Marlene</p>
            <p className="footer-date">28 · 11 · 2026</p>
          </footer>
        </div>
      </main>
    </>
  );
}
