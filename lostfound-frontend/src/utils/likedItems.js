const KEY = "lf_liked";

export const toggleLike = (item) => {
  if (!item?._id) return false;
  const list = getLiked();
  const exists = list.some(i => i._id === item._id);
  if (exists) {
    localStorage.setItem(KEY, JSON.stringify(list.filter(i => i._id !== item._id)));
    return false;
  }
  const snap = { _id: item._id, title: item.title, type: item.type, image: item.image, location: item.location };
  localStorage.setItem(KEY, JSON.stringify([snap, ...list]));
  return true;
};

export const getLiked    = () => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } };
export const getLikedIds = () => new Set(getLiked().map(i => i._id));
export const isLiked     = (id) => getLikedIds().has(id);
