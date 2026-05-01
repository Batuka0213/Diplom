const KEY = "lf_recent";
const MAX = 5;

export const addRecentlyViewed = (item) => {
  if (!item?._id) return;
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || "[]");
    const snap = {
      _id:      item._id,
      title:    item.title,
      type:     item.type,
      image:    item.image,
      location: item.location,
    };
    const updated = [snap, ...list.filter(i => i._id !== item._id)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {}
};

export const getRecentlyViewed = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
  catch { return []; }
};
