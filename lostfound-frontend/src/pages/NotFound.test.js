import React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("../components/Navbar", () => () => <nav data-testid="navbar" />);

import NotFound from "./NotFound";

describe("NotFound (404) хуудас", () => {
  test("404 тоо харагдана", () => {
    render(<NotFound />);
    expect(screen.getByText("404")).toBeInTheDocument();
  });

  test("'Хуудас олдсонгүй' гарчиг харагдана", () => {
    render(<NotFound />);
    expect(screen.getByText("Хуудас олдсонгүй")).toBeInTheDocument();
  });

  test("Нүүр хуудас руу буцах линк байна", () => {
    render(<NotFound />);
    const link = screen.getByRole("link", { name: /нүүр хуудас руу буцах/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/home");
  });

  test("Navbar render хийгдсэн байна", () => {
    render(<NotFound />);
    expect(screen.getByTestId("navbar")).toBeInTheDocument();
  });
});
