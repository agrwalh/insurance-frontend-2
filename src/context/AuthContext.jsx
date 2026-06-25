import { createContext, useState, useEffect } from "react";
import { authApi } from "../api/authApi";

export const AuthContext = createContext(null);

const VALID_ROLES = ["ADMIN", "AGENT", "CUSTOMER"];

function isValidStoredUser(value) {
  return (
    value &&
    typeof value === "object" &&
    typeof value.email === "string" &&
    value.email.length > 0 &&
    typeof value.fullName === "string" &&
    VALID_ROLES.includes(value.role)
  );
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (savedToken && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (isValidStoredUser(parsed)) {
          setUser(parsed);
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await authApi.login({ email, password });
    const data = response.data.data;

    const loggedInUser = {
      email: data.email,
      fullName: data.fullName,
      role: data.role,
    };

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(loggedInUser));
    setUser(loggedInUser);

    return loggedInUser;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
