// src/context/UiContext.jsx
import React, { createContext, useContext } from 'react';

const UiContext = createContext({});

export function UiProvider({ children }) {
  const value = {};
  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi() {
  return useContext(UiContext);
}
