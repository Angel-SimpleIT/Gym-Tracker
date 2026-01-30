"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { LogIn, Mail, Phone } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/dashboard`,
            },
        });

        if (error) {
            setMessage(error.message);
        } else {
            setMessage("¡Revisa tu correo! Te enviamos un enlace de acceso.");
        }
        setLoading(false);
    };

    const handleDemoLogin = () => {
        localStorage.setItem('demo_access', 'true');
        router.push('/dashboard');
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm text-center"
            >
                <div className="w-20 h-20 bg-black dark:bg-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl">
                    <LogIn className="text-white dark:text-black" size={32} />
                </div>

                <h1 className="text-4xl font-black tracking-tighter mb-4 font-outfit">
                    Gym Tracker
                </h1>
                <p className="text-neutral-500 mb-12 font-medium">
                    Entra sin contraseñas. Rápido y directo.
                </p>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="relative">
                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                        <input
                            type="email"
                            placeholder="tu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full h-16 pl-14 pr-6 rounded-3xl bg-neutral-100 dark:bg-neutral-900 border-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all font-semibold"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="tap-target w-full h-16 bg-black dark:bg-white text-white dark:text-black rounded-3xl font-bold text-lg shadow-xl shadow-black/10 dark:shadow-white/5 disabled:opacity-50"
                    >
                        {loading ? "Enviando..." : "Enviar Enlace"}
                    </button>

                    <button
                        type="button"
                        onClick={handleDemoLogin}
                        className="w-full h-14 bg-neutral-100 dark:bg-neutral-900 text-neutral-500 rounded-3xl font-bold text-sm hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors border border-dashed border-neutral-300 dark:border-white/5"
                    >
                        Acceso para Pruebas (Sin Email)
                    </button>
                </form>

                {message && (
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 py-3 px-4 rounded-2xl"
                    >
                        {message}
                    </motion.p>
                )}

                <div className="mt-12 pt-12 border-t border-neutral-100 dark:border-neutral-900">
                    <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mb-4">
                        O inicia con
                    </p>
                    <div className="flex gap-4 justify-center">
                        <button className="w-14 h-14 rounded-2xl bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
                            <Phone size={24} />
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
