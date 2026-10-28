import React from "react";
import { render, screen } from "@testing-library/react";
import SkeletonCard from "./SkeletonCard";

describe("SkeletonCard компонент", () => {
  test("алдаагүй render хийгдэнэ", () => {
    const { container } = render(<SkeletonCard />);
    expect(container.firstChild).toBeInTheDocument();
  });

  test("item-card класстай div агуулна", () => {
    const { container } = render(<SkeletonCard />);
    expect(container.querySelector(".item-card")).toBeInTheDocument();
  });

  test("олон skeleton элемент агуулна", () => {
    const { container } = render(<SkeletonCard />);
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(2);
  });

  test("pointerEvents none байна (товч дарах боломжгүй)", () => {
    const { container } = render(<SkeletonCard />);
    const card = container.querySelector(".item-card");
    expect(card).toHaveStyle("pointer-events: none");
  });
});
