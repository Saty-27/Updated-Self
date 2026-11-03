import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "./api";
import { io } from "socket.io-client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("cookie-session");
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    apiFetch("/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => {
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!user || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const getSocketUrl = () => {
      const envUrl = import.meta.env.VITE_API_URL;
      const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      
      if (isLocalhost) {
        const base = envUrl || `http://localhost:5055`;
        return base.replace(/\/api$/, "");
      }
      
      if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
        return envUrl.replace(/\/api$/, "");
      }
      
      return window.location.origin;
    };

    const socketInstance = io(getSocketUrl(), {
      withCredentials: true,
      transports: ["websocket", "polling"]
    });

    /* The server routes live messages through a registry that maps a
       user to their current socket ids, and it only learns the mapping
       from "user_connected". Socket.IO reconnects on its own after any
       drop — a server restart, the laptop sleeping, a flaky network —
       and comes back with a NEW socket id. Announcing only once would
       leave the server holding a dead id, so every message it tried to
       deliver would go nowhere and chat would appear to stop working
       until a full page reload. Re-announce on every connect. */
    const announce = () => socketInstance.emit("user_connected", { userId: user._id });
    socketInstance.on("connect", announce);
    /* Covers the case where the socket connected before this ran. */
    if (socketInstance.connected) announce();

    setSocket(socketInstance);

    return () => {
      socketInstance.off("connect", announce);
      socketInstance.disconnect();
    };
  }, [user, token]);

  const login = async (email, password) => {
    const data = await apiFetch("/auth/login", { method: "POST", body: { email, password } });
    setToken("cookie-session");
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const data = await apiFetch("/auth/register", { method: "POST", body: payload });
    if (data.token) {
      setToken("cookie-session");
      setUser(data.user);
    }
    return data;
  };

  const verifyOtp = async (payload) => {
    const data = await apiFetch("/auth/verify-otp", { method: "POST", body: payload });
    setToken("cookie-session");
    setUser(data.user);
    return data.user;
  };

  const resendOtp = (payload) => apiFetch("/auth/resend-otp", { method: "POST", body: payload });

  const forgotPassword = (payload) => apiFetch("/auth/forgot-password", { method: "POST", body: payload });

  const verifyForgotOtp = (payload) => apiFetch("/auth/verify-forgot-otp", { method: "POST", body: payload });

  const resetPassword = (payload) => apiFetch("/auth/reset-password", { method: "POST", body: payload });

  const requestAdminPasswordReset = (payload) => apiFetch("/auth/password-reset-request", { method: "POST", body: payload });

  const changePassword = (payload) => apiFetch("/auth/change-password", { method: "PUT", body: payload });

  const updateProfile = async (payload) => {
    const data = await apiFetch("/auth/profile", { method: "PUT", body: payload });
    setUser(data.user);
    return data.user;
  };

  /* Google hands the browser an ID token; the server verifies it and
     answers with our own JWT, exactly as a password sign-in would. */
  const loginWithGoogle = async (credential) => {
    const data = await apiFetch("/auth/google", { method: "POST", body: { credential } });
    setToken("cookie-session");
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    await apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      socket,
      login,
      loginWithGoogle,
      register,
      verifyOtp,
      resendOtp,
      forgotPassword,
      verifyForgotOtp,
      resetPassword,
      requestAdminPasswordReset,
      changePassword,
      updateProfile,
      logout,
      isAuthenticated: Boolean(user)
    }),
    [user, token, loading, socket]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
