import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { ErrorBox, Logo, Spinner } from "../components/ui";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, usuario } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  if (usuario) return <Navigate to="/admin" replace />;

  const enviar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    setError(null); setCargando(true);
    try {
      await login(String(d.get("email")), String(d.get("password")));
      nav((loc.state as { from?: string })?.from ?? "/admin", { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="grid-bg absolute inset-0 [mask-image:radial-gradient(circle_at_center,black,transparent_65%)]" />
      <form onSubmit={enviar} className="card animate-rise relative w-full max-w-sm space-y-5 p-8">
        <Logo />
        <div>
          <h1 className="font-display text-2xl font-extrabold">Panel administrativo</h1>
          <p className="text-sm text-ink-400">Ingresa con tu cuenta de AutoPart Pro.</p>
        </div>
        <div><label className="label" htmlFor="email">Correo</label><input id="email" name="email" type="email" required className="input" autoComplete="username" /></div>
        <div><label className="label" htmlFor="password">Contraseña</label><input id="password" name="password" type="password" required className="input" autoComplete="current-password" /></div>
        {error && <ErrorBox mensaje={error} />}
        <button className="btn-primary w-full py-3" disabled={cargando}>{cargando ? <Spinner className="text-ink-950" /> : <LogIn className="size-4" />}Ingresar</button>
      </form>
    </div>
  );
}
