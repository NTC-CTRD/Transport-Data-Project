import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<
  AuthContextType | undefined
>(undefined);

const API_URL = "http://127.0.0.1:8000";

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("access_token")
  );

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedToken =
      localStorage.getItem("access_token");

    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  const login = async (
    email: string,
    password: string
  ) => {
    const response = await fetch(
      `${API_URL}/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();

      throw new Error(
        error || "Login failed"
      );
    }

    const data: LoginResponse =
      await response.json();

    localStorage.setItem(
      "access_token",
      data.access_token
    );

    setToken(data.access_token);
  };

  const logout = () => {
    localStorage.removeItem(
      "access_token"
    );

    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}