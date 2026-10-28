import React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("@react-oauth/google", () => ({
  GoogleOAuthProvider: ({ children }) => <>{children}</>,
}));

jest.mock("./components/Navbar",      () => () => <nav data-testid="navbar" />);
jest.mock("./components/Footer",      () => () => <footer data-testid="footer" />);
jest.mock("./components/ScrollToTop", () => () => null);
jest.mock("./components/TopBar",      () => () => null);
jest.mock("./components/FAB",         () => () => null);

jest.mock("./pages/Home",        () => () => <div data-testid="page-home">Нүүр</div>);
jest.mock("./pages/Login",       () => () => <div data-testid="page-login" />);
jest.mock("./pages/Register",    () => () => <div data-testid="page-register" />);
jest.mock("./pages/AddItem",     () => () => <div data-testid="page-add" />);
jest.mock("./pages/LostItems",   () => () => <div data-testid="page-lost" />);
jest.mock("./pages/FoundItems",  () => () => <div data-testid="page-found" />);
jest.mock("./pages/ItemDetail",  () => () => <div data-testid="page-detail" />);
jest.mock("./pages/Admin",       () => () => <div data-testid="page-admin" />);
jest.mock("./pages/Leaderboard", () => () => <div data-testid="page-leader" />);
jest.mock("./pages/Archive",     () => () => <div data-testid="page-archive" />);
jest.mock("./pages/SavedItems",  () => () => <div data-testid="page-saved" />);
jest.mock("./pages/NotFound",    () => () => <div data-testid="page-404">404</div>);

import App from "./App";

describe("App компонент", () => {
  test("алдаагүй render хийгдэнэ", () => {
    const { container } = render(<App />);
    expect(container).toBeInTheDocument();
  });

  test("Footer render хийгдсэн байна", () => {
    render(<App />);
    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });

  test("Нүүр хуудас component render хийгдсэн байна", () => {
    render(<App />);
    expect(screen.getAllByTestId("page-home").length).toBeGreaterThan(0);
  });
});
