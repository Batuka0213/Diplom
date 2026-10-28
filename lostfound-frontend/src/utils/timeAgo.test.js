import { timeAgo } from "./timeAgo";

const ago = (ms) => new Date(Date.now() - ms).toISOString();

describe("timeAgo()", () => {
  test("null/undefined үед '—' буцаана", () => {
    expect(timeAgo(null)).toBe("—");
    expect(timeAgo(undefined)).toBe("—");
    expect(timeAgo("")).toBe("—");
  });

  test("30 секундын өмнө → 'Дөнгөж саяхан'", () => {
    expect(timeAgo(ago(30_000))).toBe("Дөнгөж саяхан");
  });

  test("5 минутын өмнө → '5 минутын өмнө'", () => {
    expect(timeAgo(ago(5 * 60_000))).toBe("5 минутын өмнө");
  });

  test("59 минутын өмнө → '59 минутын өмнө'", () => {
    expect(timeAgo(ago(59 * 60_000))).toBe("59 минутын өмнө");
  });

  test("3 цагийн өмнө → '3 цагийн өмнө'", () => {
    expect(timeAgo(ago(3 * 3_600_000))).toBe("3 цагийн өмнө");
  });

  test("2 хоногийн өмнө → '2 хоногийн өмнө'", () => {
    expect(timeAgo(ago(2 * 86_400_000))).toBe("2 хоногийн өмнө");
  });

  test("2 долоо хоногийн өмнө → '2 долоо хоногийн өмнө'", () => {
    expect(timeAgo(ago(14 * 86_400_000))).toBe("2 долоо хоногийн өмнө");
  });

  test("2 сарын өмнө → '2 сарын өмнө'", () => {
    expect(timeAgo(ago(60 * 86_400_000))).toBe("2 сарын өмнө");
  });

  test("2 жилийн өмнө → '2 жилийн өмнө'", () => {
    expect(timeAgo(ago(730 * 86_400_000))).toBe("2 жилийн өмнө");
  });
});
