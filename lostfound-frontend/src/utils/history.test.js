import {
  saveDeleted, getDeleted, clearDeleted,
  saveReturned, getReturned,
} from "./history";

const ITEM = { _id: "x1", title: "Түлхүүр", type: "lost", status: "pending" };

beforeEach(() => localStorage.clear());

/* ── Deleted ── */
describe("saveDeleted() / getDeleted()", () => {
  test("localStorage хоосон үед хоосон массив буцаана", () => {
    expect(getDeleted()).toEqual([]);
  });

  test("зүйл хадгална, deletedAt талбар нэмэгдэнэ", () => {
    saveDeleted(ITEM);
    const list = getDeleted();
    expect(list).toHaveLength(1);
    expect(list[0]._id).toBe("x1");
    expect(list[0].deletedAt).toBeDefined();
  });

  test("давхардсан _id-г солино (хуучин нь арилна)", () => {
    saveDeleted(ITEM);
    saveDeleted(ITEM);
    expect(getDeleted()).toHaveLength(1);
  });

  test("хамгийн сүүлийн нь эхэнд байна", () => {
    const A = { ...ITEM, _id: "a1" };
    const B = { ...ITEM, _id: "b2" };
    saveDeleted(A);
    saveDeleted(B);
    expect(getDeleted()[0]._id).toBe("b2");
  });
});

describe("clearDeleted()", () => {
  test("бүгдийг устгана", () => {
    saveDeleted(ITEM);
    clearDeleted();
    expect(getDeleted()).toEqual([]);
  });
});

/* ── Returned ── */
describe("saveReturned() / getReturned()", () => {
  test("localStorage хоосон үед хоосон массив буцаана", () => {
    expect(getReturned()).toEqual([]);
  });

  test("зүйл хадгална, status=returned, returnedAt нэмэгдэнэ", () => {
    saveReturned(ITEM);
    const list = getReturned();
    expect(list).toHaveLength(1);
    expect(list[0].status).toBe("returned");
    expect(list[0].returnedAt).toBeDefined();
  });

  test("давхардсан _id-г солино", () => {
    saveReturned(ITEM);
    saveReturned(ITEM);
    expect(getReturned()).toHaveLength(1);
  });
});
