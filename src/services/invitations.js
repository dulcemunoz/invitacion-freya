import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  increment,
  runTransaction,
} from "firebase/firestore";
import { db } from "../firebase";

async function tokenToId(token) {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function publicUrl(token) {
  const url = new URL(window.location.href);
  url.pathname = url.pathname.replace(/\/admin\/?$/, "/").replace(/\/$/, "/");
  url.search = `?invitacion=${encodeURIComponent(token)}`;
  url.hash = "";
  return url.toString();
}

export async function getPublicInvitation(token) {
  const id = await tokenToId(token);
  const snap = await getDoc(doc(db, "invitations", id));

  if (!snap.exists() || snap.data().active !== true) {
    throw new Error("La invitación no existe o fue desactivada.");
  }

  const data = snap.data();

  return {
    id: snap.id,
    familyName: data.familyName,
    maxGuests: data.maxGuests,
    confirmedCount: Number(data.confirmedCount || 0),
    responseSubmitted: data.responseSubmitted === true,
  };
}

export async function recordInvitationVisit(token, visitId) {
  const id = await tokenToId(token);
  const ref = doc(db, "invitations", id);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);

    if (!snap.exists() || snap.data().active !== true) {
      throw new Error("Invitación no disponible.");
    }

    const visitRef = doc(db, "invitations", id, "visits", visitId);
    const visit = await tx.get(visitRef);

    tx.update(ref, {
      viewCount: increment(1),
      ...(visit.exists() ? {} : { uniqueViewCount: increment(1) }),
      lastViewedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (!visit.exists()) {
      tx.set(visitRef, { createdAt: serverTimestamp() });
    }
  });
}

export async function submitGuestList(token, input) {
  const count = Number(input);

  if (!Number.isInteger(count) || count < 0) {
    throw new Error("Indica un número válido de asistentes.");
  }

  const id = await tokenToId(token);
  const ref = doc(db, "invitations", id);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);

    if (!snap.exists() || snap.data().active !== true) {
      throw new Error("Invitación no disponible.");
    }

    const data = snap.data();

    if (data.responseSubmitted === true) {
      throw new Error(
        "Esta familia ya registró su confirmación. No es posible enviar otra respuesta.",
      );
    }

    const maxGuests = Number(data.maxGuests);

    if (count > maxGuests) {
      throw new Error(`Esta invitación permite máximo ${maxGuests} personas.`);
    }

    tx.update(ref, {
      confirmedCount: count,
      responseSubmitted: true,
      responseSubmittedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  return {
    confirmedCount: count,
    responseSubmitted: true,
  };
}

export async function adminListInvitations() {
  const q = query(collection(db, "invitations"), orderBy("createdAt", "desc"));

  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => {
    const x = d.data();

    return {
      id: d.id,
      familyName: x.familyName,
      maxGuests: x.maxGuests,
      confirmedCount: Number(x.confirmedCount || 0),
      viewCount: x.viewCount || 0,
      uniqueViewCount: x.uniqueViewCount || 0,
      lastViewedAt: x.lastViewedAt?.toDate?.().toISOString?.() || "",
      active: x.active === true,
    };
  });
}

export async function adminCreateInvitation(familyName, maxGuests) {
  const name = String(familyName || "").trim();
  const count = Number(maxGuests);

  if (
    !name ||
    name.length > 100 ||
    !Number.isInteger(count) ||
    count < 1 ||
    count > 100
  ) {
    throw new Error("Indica una familia y un número de lugares entre 1 y 100.");
  }

  const random = new Uint8Array(32);
  crypto.getRandomValues(random);

  const token = [...random]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const id = await tokenToId(token);

  await setDoc(doc(db, "invitations", id), {
    familyName: name,
    maxGuests: count,
    confirmedCount: 0,
    viewCount: 0,
    uniqueViewCount: 0,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    responseSubmitted: false,
    responseSubmittedAt: null,
  });

  return {
    id,
    familyName: name,
    maxGuests: count,
    confirmedCount: 0,
    url: publicUrl(token),
  };
}

export async function adminSetInvitationActive(invitationId, active) {
  await updateDoc(doc(db, "invitations", invitationId), {
    active: Boolean(active),
    updatedAt: serverTimestamp(),
  });
}
