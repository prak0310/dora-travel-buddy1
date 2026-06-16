import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface UserContextType {
  username: string | null;
  setUsername: (name: string | null) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType>({
  username: null,
  setUsername: () => {},
  logout: () => {},
});

const STORAGE_KEY = "dora_username";

export function UserProvider({ children }: { children: ReactNode }) {
  const [username, setUsernameState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const setUsername = (name: string | null) => {
    setUsernameState(name);
    try {
      if (name) {
        localStorage.setItem(STORAGE_KEY, name);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // localStorage unavailable
    }
  };

  const logout = () => setUsername(null);

  return (
    <UserContext.Provider value={{ username, setUsername, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
