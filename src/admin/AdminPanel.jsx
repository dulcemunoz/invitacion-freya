import { useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../firebase";
import { adminCreateInvitation, adminListInvitations, adminSetInvitationActive } from "../services/invitations";
import * as XLSX from "xlsx";
import "./AdminPanel.css";

const INITIAL_FAMILIES = [
  ["Arellano Rayón", 4], ["Luján Velázquez", 5], ["Dulce", 10], ["Freya", 30],
  ["Rodríguez", 4], ["Arenas", 5], ["Velázquez", 5], ["Romi", 10],
  ["Pérez", 4], ["Banco", 10],
];

export default function AdminPanel() {
  const [user, setUser] = useState(auth.currentUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [invitations, setInvitations] = useState([]);
  const [familyName, setFamilyName] = useState("");
  const [maxGuests, setMaxGuests] = useState(4);
  const [newLink, setNewLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    setLoading(true);
    setError("");
    try { setInvitations(await adminListInvitations()); }
    catch (e) { setError(e.message || "No se pudieron cargar las invitaciones."); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      if (nextUser) refresh();
      else setInvitations([]);
    });
    return unsubscribe;
  }, []);

  async function login(event) {
    event.preventDefault(); setError("");
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await credential.user.getIdToken(true);
      setUser(credential.user);
      await refresh();
    } catch (e) { setError("No se pudo iniciar sesión. Verifica tus datos y que tu usuario tenga permisos de administrador."); }
  }

  async function create(event) {
    event.preventDefault(); setError(""); setNewLink("");
    try {
      const result = await adminCreateInvitation(familyName.trim(), Number(maxGuests));
      setNewLink(result.url);
      setFamilyName("");
      await refresh();
    } catch (e) { setError(e.message || "No se pudo crear la invitación."); }
  }

  async function toggle(invitation) {
    try {
      await adminSetInvitationActive(invitation.id, !invitation.active);
      await refresh();
    } catch (e) { setError(e.message || "No se pudo actualizar el estado."); }
  }

  function exportExcel() {
    const rows = invitations.map((item) => ({
      Familia: item.familyName,
      "Boletos asignados": item.maxGuests,
      "Personas registradas": item.guests?.length || 0,
      "Asistentes confirmados": item.guests?.filter((g) => g.attending).length || 0,
      "No asistirán": item.guests?.filter((g) => !g.attending).length || 0,
      Visitas: item.viewCount || 0,
      "Visitas únicas aprox.": item.uniqueViewCount || 0,
      "Última visita": item.lastViewedAt || "",
      Estado: item.active ? "Activa" : "Desactivada",
      Invitados: (item.guests || []).map((g) => `${g.name}: ${g.attending ? "Asiste" : "No asiste"}`).join(" | "),
    }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Invitaciones");
    XLSX.writeFile(workbook, "XV-Freya-Marlene-confirmaciones.xlsx");
  }

  if (!user) return (
    <main className="admin-shell">
      <form className="admin-login" onSubmit={login}>
        <p className="admin-kicker">XV años · Freya Marlene</p>
        <h1>Administración</h1>
        <label>Correo electrónico<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" /></label>
        <label>Contraseña<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /></label>
        <button type="submit">Iniciar sesión</button>
        {error && <p role="alert" className="admin-error">{error}</p>}
      </form>
    </main>
  );

  const totalTickets = invitations.reduce((sum, item) => sum + item.maxGuests, 0);
  const totalConfirmed = invitations.reduce((sum, item) => sum + (item.guests || []).filter((g) => g.attending).length, 0);
  const totalViews = invitations.reduce((sum, item) => sum + (item.viewCount || 0), 0);

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div><p className="admin-kicker">XV años · Freya Marlene</p><h1>Panel de invitaciones</h1></div>
        <div className="admin-actions"><button onClick={refresh}>Actualizar</button><button onClick={exportExcel}>Exportar Excel</button><button className="admin-secondary" onClick={() => signOut(auth)}>Cerrar sesión</button></div>
      </header>
      {error && <p className="admin-error" role="alert">{error}</p>}
      <section className="admin-stats">
        <article><span>Invitaciones</span><strong>{invitations.length}</strong></article>
        <article><span>Boletos asignados</span><strong>{totalTickets}</strong></article>
        <article><span>Confirmados</span><strong>{totalConfirmed}</strong></article>
        <article><span>Visitas</span><strong>{totalViews}</strong></article>
      </section>
      <section className="admin-create">
        <h2>Crear invitación privada</h2>
        <form onSubmit={create}>
          <label>Familia o destinatario<input value={familyName} onChange={(e) => setFamilyName(e.target.value)} required maxLength={100} /></label>
          <label>Máximo de boletos<input type="number" min="1" max="100" value={maxGuests} onChange={(e) => setMaxGuests(e.target.value)} required /></label>
          <button type="submit" disabled={loading}>Generar enlace</button>
        </form>
        {newLink && <div className="admin-new-link"><strong>Enlace privado generado</strong><input readOnly value={newLink} onFocus={(e) => e.target.select()} /><button onClick={() => navigator.clipboard.writeText(newLink)}>Copiar enlace</button><p>Guárdalo ahora: el token original solo se muestra al generarlo.</p></div>}
      </section>
      <section className="admin-table-wrap">
        <h2>Familias y confirmaciones</h2>
        {loading ? <p>Cargando…</p> : (
          <table className="admin-table">
            <thead><tr><th>Familia</th><th>Boletos</th><th>Personas</th><th>Confirmados</th><th>Visitas</th><th>Únicas aprox.</th><th>Estado</th><th>Acción</th></tr></thead>
            <tbody>{invitations.map((item) => (
              <tr key={item.id}>
                <td>{item.familyName}</td><td>{item.maxGuests}</td><td>{item.guests?.length || 0}</td>
                <td>{item.guests?.filter((g) => g.attending).length || 0}</td><td>{item.viewCount || 0}</td><td>{item.uniqueViewCount || 0}</td>
                <td>{item.active ? "Activa" : "Desactivada"}</td>
                <td><button className="admin-small" onClick={() => toggle(item)}>{item.active ? "Desactivar" : "Activar"}</button></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </section>
      <section className="admin-family-seed">
        <h2>Familias acordadas</h2>
        <p>Lista de referencia inicial. Puedes crear estas invitaciones individualmente y verificar los cupos antes de compartir los enlaces.</p>
        <ul>{INITIAL_FAMILIES.map(([name, count]) => <li key={name}>{name}: {count} boletos</li>)}</ul>
      </section>
    </main>
  );
}
