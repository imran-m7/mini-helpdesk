import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authApi } from "../api/auth";
import { tokenStorage } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // only "loading" if there is a saved token we still need to check
  const [loading, setLoading] = useState(() => Boolean(tokenStorage.get()));

  // on page load: if a token was saved, ask the backend who we are
  useEffect(() => {
    if (!tokenStorage.get()) return;
    authApi
      .me()
      .then(setUser)
      .catch(() => tokenStorage.clear()) // expired or invalid token, delete it
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { access_token } = await authApi.login({ email, password }); // get token from backend
    tokenStorage.set(access_token);
    const me = await authApi.me(); // get user info after logging in
    setUser(me);
    return me;
  }, []);

  const register = useCallback(
    async (fullName, email, password) => {
      await authApi.register({ full_name: fullName, email, password });
      return login(email, password); // log in right after registering
    },
    [login]
  );

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    isAgent: user?.role === "agent", // will not crash if user is null, will be false... also if true user is agent
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>; // provide the context to children
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>"); // if page is not wrapped in <AuthProvider>, throw an error
  return context;
}