import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getCurrentUser,
  loginAdmin,
  loginStore,
} from "../services/authService";

const AuthContext = createContext(null);
const TOKEN_KEY = "auto-order-token";
const USER_KEY = "auto-order-user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const expire = () => {
      setUser(null);
      localStorage.removeItem(USER_KEY);
    };
    window.addEventListener("auth-expired", expire);
    return () => window.removeEventListener("auth-expired", expire);
  }, []);
  const saveSession = useCallback((session, role) => {
    const token = session?.token || session?.accessToken;
    const currentUser = {
      ...(session?.user || session),
      role: session?.role || role,
    };
    if (token) localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
    setUser(currentUser);
    return currentUser;
  }, []);
  const login = useCallback(
    async (credentials, role = "STORE") => {
      setLoading(true);
      try {
        return saveSession(
          role === "ADMIN"
            ? await loginAdmin(credentials)
            : await loginStore(credentials),
          role,
        );
      } finally {
        setLoading(false);
      }
    },
    [saveSession],
  );
  const refreshUser = useCallback(async () => {
    const current = await getCurrentUser();
    saveSession(current, user?.role || "STORE");
    return current;
  }, [saveSession, user?.role]);
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);
  return (
    <AuthContext.Provider
      value={useMemo(
        () => ({ user, loading, login, logout, refreshUser }),
        [user, loading, login, logout, refreshUser],
      )}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
