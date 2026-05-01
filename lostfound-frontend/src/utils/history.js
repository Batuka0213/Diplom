const DELETED_KEY  = "lf_deleted";
const RETURNED_KEY = "lf_returned";
const MAX = 100;

/* ── Deleted ── */
export const saveDeleted = (item) => {
  try {
    const list = JSON.parse(localStorage.getItem(DELETED_KEY) || "[]");
    const updated = [
      { ...item, deletedAt: new Date().toISOString() },
      ...list.filter(i => i._id !== item._id),
    ].slice(0, MAX);
    localStorage.setItem(DELETED_KEY, JSON.stringify(updated));
  } catch {}
};

export const getDeleted = () => {
  try { return JSON.parse(localStorage.getItem(DELETED_KEY) || "[]"); }
  catch { return []; }
};

export const clearDeleted = () => localStorage.removeItem(DELETED_KEY);

/* ── Returned ── */
export const saveReturned = (item) => {
  try {
    const list = JSON.parse(localStorage.getItem(RETURNED_KEY) || "[]");
    const updated = [
      { ...item, status: "returned", returnedAt: new Date().toISOString() },
      ...list.filter(i => i._id !== item._id),
    ].slice(0, MAX);
    localStorage.setItem(RETURNED_KEY, JSON.stringify(updated));
  } catch {}
};

export const getReturned = () => {
  try { return JSON.parse(localStorage.getItem(RETURNED_KEY) || "[]"); }
  catch { return []; }
};
