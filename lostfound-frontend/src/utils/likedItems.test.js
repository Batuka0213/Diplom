import { toggleLike, getLiked, getLikedIds, isLiked } from "./likedItems";

const ITEM_A = { _id: "aaa", title: "Утас", type: "lost",  image: "", location: "УБ", category: "phone" };
const ITEM_B = { _id: "bbb", title: "Цүнх", type: "found", image: "", location: "ДЦ", category: "bag"   };

beforeEach(() => localStorage.clear());

describe("getLiked()", () => {
  test("localStorage хоосон үед хоосон массив буцаана", () => {
    expect(getLiked()).toEqual([]);
  });

  test("localStorage эвдэрсэн үед хоосон массив буцаана", () => {
    localStorage.setItem("lf_liked", "{ эвдэрсэн json");
    expect(getLiked()).toEqual([]);
  });
});

describe("toggleLike()", () => {
  test("зүйл нэмнэ — true буцаана", () => {
    const result = toggleLike(ITEM_A);
    expect(result).toBe(true);
    expect(getLiked()).toHaveLength(1);
    expect(getLiked()[0]._id).toBe("aaa");
  });

  test("хоёр удаа дарахад хасна — false буцаана", () => {
    toggleLike(ITEM_A);
    const result = toggleLike(ITEM_A);
    expect(result).toBe(false);
    expect(getLiked()).toHaveLength(0);
  });

  test("хэд хэдэн зүйл нэмж болно", () => {
    toggleLike(ITEM_A);
    toggleLike(ITEM_B);
    expect(getLiked()).toHaveLength(2);
  });

  test("_id байхгүй зүйл → false буцаана, localStorage өөрчлөгдөхгүй", () => {
    const result = toggleLike({ title: "ID-гүй" });
    expect(result).toBe(false);
    expect(getLiked()).toHaveLength(0);
  });

  test("null оролт → false буцаана", () => {
    expect(toggleLike(null)).toBe(false);
  });
});

describe("getLikedIds()", () => {
  test("Set буцаана", () => {
    toggleLike(ITEM_A);
    const ids = getLikedIds();
    expect(ids).toBeInstanceOf(Set);
    expect(ids.has("aaa")).toBe(true);
    expect(ids.has("bbb")).toBe(false);
  });
});

describe("isLiked()", () => {
  test("нэмсэн зүйл → true", () => {
    toggleLike(ITEM_A);
    expect(isLiked("aaa")).toBe(true);
  });

  test("нэмээгүй зүйл → false", () => {
    expect(isLiked("aaa")).toBe(false);
  });
});
