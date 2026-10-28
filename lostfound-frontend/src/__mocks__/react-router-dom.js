const React = require("react");

const Link = ({ to, children, ...rest }) =>
  React.createElement("a", { href: to, ...rest }, children);

const useNavigate    = () => jest.fn();
const useParams      = () => ({});
const useSearchParams= () => [new URLSearchParams(), jest.fn()];
const useLocation    = () => ({ pathname: "/", search: "", hash: "" });

const MemoryRouter   = ({ children }) => React.createElement(React.Fragment, null, children);
const BrowserRouter  = ({ children }) => React.createElement(React.Fragment, null, children);
const Routes         = ({ children }) => React.createElement(React.Fragment, null, children);
const Route          = ({ element })  => element || null;
const Navigate       = ({ to })       => React.createElement("span", { "data-redirect": to });
const Outlet         = ()             => null;

module.exports = {
  Link, MemoryRouter, BrowserRouter, Routes, Route, Navigate, Outlet,
  useNavigate, useParams, useSearchParams, useLocation,
};
