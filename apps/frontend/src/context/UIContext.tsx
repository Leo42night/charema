// untuk mengelola state UI seperti fokus input dan visibilitas navbar di seluruh aplikasi
import { createContext, useContext, useState, type ReactNode } from 'react';

interface UIContextType {
  isInputFocused: boolean;
  setInputFocus: (focused: boolean) => void;
  isNavbarVisible: boolean;
  setNavbarVisible: (visible: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [isInputFocused, setInputFocus] = useState(false);
  const [isNavbarVisible, setNavbarVisible] = useState(true);

  return (
    <UIContext.Provider value={{ isInputFocused, setInputFocus, isNavbarVisible, setNavbarVisible }}>
      {children}
    </UIContext.Provider>
  );
}

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within UIProvider');
  return context;
};