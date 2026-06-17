import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface UserContextType {
  username: string | null;
  displayName: string | null;
  setUsername: (name: string | null) => void;
  setDisplayName: (name: string | null) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType>({
  username: null,
  displayName: null,
  setUsername: () => {},
  setDisplayName: () => {},
  logout: () => {},
});

const STORAGE_KEY = "dora_username";
const DISPLAY_NAME_KEY = "dora_display_name";

export function UserProvider({ children }: { children: ReactNode }) {
  const [username, setUsernameState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const [displayName, setDisplayNameState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(DISPLAY_NAME_KEY) || localStorage.getItem(STORAGE_KEY) || "Prakriti";
    } catch {
      return "Prakriti";
    }
  });

  const setUsername = (name: string | null) => {
    setUsernameState(name);
    try {
      if (name) {
        localStorage.setItem(STORAGE_KEY, name);
        if (!localStorage.getItem(DISPLAY_NAME_KEY)) {
          setDisplayName(name);
        }
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // localStorage unavailable
    }
  };

  const setDisplayName = (name: string | null) => {
    setDisplayNameState(name);
    try {
      if (name) {
        localStorage.setItem(DISPLAY_NAME_KEY, name);
      } else {
        localStorage.removeItem(DISPLAY_NAME_KEY);
      }
    } catch {
      // localStorage unavailable
    }
  };

  const logout = () => {
    setUsername(null);
    setDisplayName(null);
  };

  return (
    <UserContext.Provider value={{ username, displayName, setUsername, setDisplayName, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
