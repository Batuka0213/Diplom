import React, { createContext, useContext, useState } from "react";
import { translations } from "../i18n";

const LangContext = createContext();

export function LangProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem("lang") || "mn");

  const t = (section) => translations[lang]?.[section] || translations.mn[section] || {};

  const changeLang = (code) => {
    setLang(code);
    localStorage.setItem("lang", code);
  };

  return (
    <LangContext.Provider value={{ lang, t, changeLang }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
