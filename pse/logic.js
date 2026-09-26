// ============================================================
//  pse/logic.js — הלוגיקה הייחודית לבורסת הנקודות (PSE)
//  משותף בין index.html / auth.html / app.html / admin.html
// ============================================================

import { db, COLLECTIONS, POINTS_SITES } from "../shared/firebase.js";
import {
    collection, getDocs, doc, getDoc, setDoc, updateDoc,
    addDoc, query, orderBy, limit, where, serverTimestamp, runTransaction, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const PCOL = COLLECTIONS.pse;

/* ------------------------------------------------------------------
   1. שאיבת "עולם הנקודות" — כל החברים בכל האתרים, גולמי
------------------------------------------------------------------- */
export async function fetchAllSitesFriends() {
    // { liri: [{id,points}], shanan: [{id,points}], ... }
    const result = {};
    for (const site of POINTS_SITES) {
        const snap = await getDocs(collection(db, COLLECTIONS[site.key].friends));
        result[site.key] = snap.docs.map(d => ({ id: d.id, points: d.data().points || 0 }));
    }
    return result;
}

/* ------------------------------------------------------------------
   2. מסמכי "משתתפים" — מיפוי אדם אחד -> מזהה בכל אתר
   pse_participants/{participantId} = { name, links: { liri: "יונתן"|null, shanan: null }, confirmed: bool }
------------------------------------------------------------------- */
export async function fetchParticipants() {
    const snap = await getDocs(collection(db, PCOL.participants));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// אלגוריתם ניחוש התאמות: משווה מילים בשם (טוקנים), חושב חפיפה
function tokenize(name) {
    return name.trim().toLowerCase().split(/\s+/).filter(Boolean);
}
export function guessMatches(friendsBySite) {
    // בונה רשימת "מועמדים" מכל אתר: {site, id}
    const candidates = [];
    for (const site of POINTS_SITES) {
        (friendsBySite[site.key] || []).forEach(f => candidates.push({ site: site.key, id: f.id, tokens: tokenize(f.id) }));
    }
    // מקבץ לפי חפיפת טוקנים (union-find פשוט)
    const groups = [];
    candidates.forEach(cand => {
        let placed = false;
        for (const g of groups) {
            const overlap = g.some(m => m.tokens.some(t => cand.tokens.includes(t)));
            if (overlap && !g.some(m => m.site === cand.site)) { g.push(cand); placed = true; break; }
        }
        if (!placed) groups.push([cand]);
    });
    return groups.map((g, i) => ({
        suggestionId: "sugg_" + i,
        name: g.find(m => m.tokens.length > 0)?.id || g[0].id,
        links: Object.fromEntries(g.map(m => [m.site, m.id])),
    }));
}

/* ------------------------------------------------------------------
   3. חישוב סה"כ נקודות חי לכל משתתף (סכום פני כל האתרים המקושרים)
------------------------------------------------------------------- */
export function computeTotals(participants, friendsBySite) {
    return participants.map(p => {
        let total = 0;
        const breakdown = {};
        for (const site of POINTS_SITES) {
            const linkedId = p.links?.[site.key];
            const pts = linkedId ? (friendsBySite[site.key]?.find(f => f.id === linkedId)?.points || 0) : 0;
            breakdown[site.key] = pts;
            total += pts;
        }
        return { id: p.id, name: p.name, total, breakdown };
    }).sort((a, b) => b.total - a.total);
}

/* ------------------------------------------------------------------
   4. תנודות אחרונות בשוק — מאחד את 3 ה-history collections, ממיין לפי זמן
------------------------------------------------------------------- */
export async function fetchRecentMoves(n = 3) {
    let all = [];
    for (const site of POINTS_SITES) {
        const q = query(collection(db, COLLECTIONS[site.key].history), orderBy("timestamp", "desc"), limit(n + 2));
        const snap = await getDocs(q);
        snap.docs.forEach(d => {
            const x = d.data();
            all.push({ site: site.key, siteLabel: site.label, name: x.name, points: x.points, t: x.timestamp?.toMillis?.() || 0, date: x.timestamp?.toDate?.() || new Date() });
        });
    }
    // צריך את הפרש הנקודות מהרשומה הקודמת של אותו אדם/אתר כדי לדעת אם +/-
    const bySiteName = {};
    all.sort((a, b) => a.t - b.t);
    const withDelta = all.map(m => {
        const key = m.site + "::" + m.name;
        const prev = bySiteName[key];
        bySiteName[key] = m.points;
        const delta = prev === undefined ? m.points : m.points - prev;
        return { ...m, delta };
    });
    return withDelta.sort((a, b) => b.t - a.t).slice(0, n);
}

/* ------------------------------------------------------------------
   5. משתמשי הבורסה
------------------------------------------------------------------- */
export async function getUserProfile(uid) {
    const snap = await getDoc(doc(db, PCOL.users, uid));
    return snap.exists() ? { id: uid, ...snap.data() } : null;
}

export async function createPendingUser(uid, { firstName, lastName, email }) {
    await setDoc(doc(db, PCOL.users, uid), {
        firstName, lastName, email,
        status: "pending",
        freePoints: 30,
        createdAt: serverTimestamp(),
    });
}

/* ------------------------------------------------------------------
   6. השקעות
   pse_investments/{id} = { investorUid, participantId, participantName,
                             initialAmount, baseTotal, active, createdAt, stoppedAt }
   ערך נוכחי של השקעה = initialAmount * (currentTotal / baseTotal)   [baseTotal=0 -> יחס 1]
------------------------------------------------------------------- */
export function currentInvestmentValue(inv, currentTotal) {
    if (!inv.baseTotal || inv.baseTotal === 0) return inv.initialAmount;
    return inv.initialAmount * (currentTotal / inv.baseTotal);
}

export async function fetchAllInvestments() {
    const snap = await getDocs(collection(db, PCOL.investments));
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(i => i.active);
}

export async function fetchUserInvestments(uid) {
    const snap = await getDocs(query(collection(db, PCOL.investments)));
    return snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(inv => inv.investorUid === uid);
}

export async function createInvestment(uid, participant, amount) {
    await runTransaction(db, async (tx) => {
        const userRef = doc(db, PCOL.users, uid);
        const userSnap = await tx.get(userRef);
        const user = userSnap.data();
        if (amount <= 0 || amount > user.freePoints) throw new Error("סכום לא תקין");
        tx.update(userRef, { freePoints: user.freePoints - amount });
        const invRef = doc(collection(db, PCOL.investments));
        tx.set(invRef, {
            investorUid: uid,
            participantId: participant.id,
            participantName: participant.name,
            initialAmount: amount,
            baseTotal: participant.total,
            active: true,
            createdAt: serverTimestamp(),
        });
    });
}

export async function stopInvestment(uid, invId, currentTotal) {
    await runTransaction(db, async (tx) => {
        const invRef = doc(db, PCOL.investments, invId);
        const invSnap = await tx.get(invRef);
        const inv = invSnap.data();
        if (inv.investorUid !== uid || !inv.active) return;
        const value = currentInvestmentValue(inv, currentTotal);
        const userRef = doc(db, PCOL.users, uid);
        const userSnap = await tx.get(userRef);
        const user = userSnap.data();
        tx.update(userRef, { freePoints: user.freePoints + value });
        tx.update(invRef, { active: false, stoppedAt: serverTimestamp(), finalValue: value });
    });
}

/* ------------------------------------------------------------------
   5b. ניהול משתמשים (אדמין)
------------------------------------------------------------------- */
export async function fetchAllUsers() {
    const snap = await getDocs(collection(db, PCOL.users));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function approveUser(uid) {
    await updateDoc(doc(db, PCOL.users, uid), { status: "approved" });
}
export async function rejectUser(uid) {
    // מוחק את פרופיל הבקשה. חשבון ה-Auth עצמו לא נמחק (דורש הרשאת שרת/Admin SDK) —
    // אך ללא פרופיל pse_users המשתמש לא יוכל להיכנס לאף מסך.
    await updateDoc(doc(db, PCOL.users, uid), { status: "rejected" });
}
export async function suspendUser(uid, note) {
    await updateDoc(doc(db, PCOL.users, uid), { status: "suspended", suspendNote: note || "" });
}

/* ------------------------------------------------------------------
   5c. פרסום מיפויי משתתפים (אחרי אישור אדמין ל-guessMatches)
------------------------------------------------------------------- */
export async function saveParticipants(groups) {
    for (const g of groups) {
        await setDoc(doc(db, PCOL.participants, g.name), { name: g.name, links: g.links, confirmed: true }, { merge: true });
    }
}

export function findUnmatchedFriends(participants, friendsBySite) {
    const linkedIds = new Set();
    participants.forEach(p => Object.values(p.links || {}).forEach(id => id && linkedIds.add(id)));
    const unmatched = [];
    for (const site of POINTS_SITES) {
        (friendsBySite[site.key] || []).forEach(f => { if (!linkedIds.has(f.id)) unmatched.push({ site: site.key, id: f.id }); });
    }
    return unmatched;
}

/* ------------------------------------------------------------------
   6b. היסטוריית משתתף מאוחדת (חוצה-אתרים) — לבניית גרף הסטטיסטיקות
   מחזיר timeline ממויין: [{ t, siteTotals:{liri,shanan,...}, combinedTotal }]
   וכן series נפרדות per-site לתצוגת "הפרדת סוגים"
------------------------------------------------------------------- */
export async function fetchParticipantHistory(participant) {
    const events = [];
    for (const site of POINTS_SITES) {
        const linkedId = participant.links?.[site.key];
        if (!linkedId) continue;
        const q = query(collection(db, COLLECTIONS[site.key].history), where("name", "==", linkedId), orderBy("timestamp", "asc"));
        const snap = await getDocs(q);
        snap.docs.forEach(d => {
            const x = d.data();
            events.push({ site: site.key, points: x.points, t: x.timestamp?.toMillis?.() || 0 });
        });
    }
    events.sort((a, b) => a.t - b.t);
    const running = {};
    POINTS_SITES.forEach(s => running[s.key] = 0);
    const timeline = events.map(e => {
        running[e.site] = e.points;
        const combinedTotal = Object.values(running).reduce((a, b) => a + b, 0);
        return { t: e.t, siteTotals: { ...running }, combinedTotal };
    });
    // נקודת "עכשיו" עם הטוטאל החי
    timeline.push({ t: Date.now(), siteTotals: { ...running }, combinedTotal: participant.total ?? Object.values(running).reduce((a,b)=>a+b,0) });
    return timeline;
}

export function buildInvestmentSeries(investment, timeline) {
    const startT = investment.createdAt?.toMillis?.() ?? investment.createdAt ?? 0;
    return timeline
        .filter(pt => pt.t >= startT)
        .map(pt => ({ x: pt.t, y: currentInvestmentValue(investment, pt.combinedTotal) }));
}

/* ------------------------------------------------------------------
   7. גרף עם "גרור לזום" (drag-to-zoom) — במקום כפתורי טווח
   מוסיף שכבת overlay שקופה מעל ה-canvas ומאזינה לגרירה
------------------------------------------------------------------- */
export function attachDragZoom(chart, canvasEl, onRangeChange) {
    const wrapper = canvasEl.parentElement;
    wrapper.style.position = "relative";
    const overlay = document.createElement("div");
    overlay.style.cssText = "position:absolute;inset:0;cursor:crosshair;";
    wrapper.appendChild(overlay);

    let startX = null, selDiv = null;

    overlay.addEventListener("pointerdown", (e) => {
        const rect = overlay.getBoundingClientRect();
        startX = e.clientX - rect.left;
        selDiv = document.createElement("div");
        selDiv.style.cssText = `position:absolute;top:0;bottom:0;left:${startX}px;width:0;
            background:var(--gold, #c9a227);opacity:0.15;border-inline:1px solid var(--gold,#c9a227);pointer-events:none;`;
        overlay.appendChild(selDiv);
    });
    overlay.addEventListener("pointermove", (e) => {
        if (startX === null || !selDiv) return;
        const rect = overlay.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const left = Math.min(startX, x), width = Math.abs(x - startX);
        selDiv.style.left = left + "px";
        selDiv.style.width = width + "px";
    });
    const finish = (e) => {
        if (startX === null) return;
        const rect = overlay.getBoundingClientRect();
        const endX = (e.clientX !== undefined ? e.clientX - rect.left : startX);
        if (selDiv) selDiv.remove();
        const xScale = chart.scales.x;
        if (Math.abs(endX - startX) > 8) {
            const t1 = xScale.getValueForPixel(Math.min(startX, endX));
            const t2 = xScale.getValueForPixel(Math.max(startX, endX));
            chart.options.scales.x.min = t1;
            chart.options.scales.x.max = t2;
            chart.update();
            onRangeChange?.(t1, t2);
        }
        startX = null; selDiv = null;
    };
    overlay.addEventListener("pointerup", finish);
    overlay.addEventListener("pointerleave", finish);

    return {
        reset() {
            delete chart.options.scales.x.min;
            delete chart.options.scales.x.max;
            chart.update();
            onRangeChange?.(null, null);
        }
    };
}
