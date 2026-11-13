import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, tokenStore } from "../lib/api";
import type { Usuario } from "../lib/types";

interface AuthCtx {
  usuario: Usuario | null;
  cargando: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUsuario(null);
  }, []);

  useEffect(() => {
    if (!tokenStore.get()) { setCargando(false); return; }
    api<Usuario>("/auth/me", { auth: true })
      .then(setUsuario)
      .catch(() => tokenStore.clear())
      .finally(() => setCargando(false));
    const onLogout = () => setUsuario(null);
    window.addEventListener("autopart:logout", onLogout);
    return () => window.removeEventListener("autopart:logout", onLogout);
  }, []);

  const login = async (email: string, password: string) => {
    const r = await api<{ token: string; usuario: Usuario }>("/auth/login", { method: "POST", body: { email, password } });
    tokenStore.set(r.token);
    setUsuario(r.usuario);
  };

  return <Ctx.Provider value={{ usuario, cargando, login, logout }}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth fuera de AuthProvider");
  return c;
}
