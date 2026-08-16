"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { createClient } from "@/lib/supabase/client";
import { useTranslations, useLocale } from "next-intl";
import { ADMIN_ROLES } from "@/lib/constants/roles";
import type { UserRole } from "@/types/database";

export default function LoginPage() {
    const t = useTranslations("login");
    const locale = useLocale();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [registered, setRegistered] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        try {
            if (new URLSearchParams(window.location.search).get("registered") === "1") {
                // eslint-disable-next-line react-hooks/set-state-in-effect -- source externe (URL), pattern documenté
                setRegistered(true);
            }
        } catch {}
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;

            const {
                data: { user },
            } = await supabase.auth.getUser();
            const { data: profile } = user
                ? await supabase
                      .from("profils")
                      .select("role")
                      .eq("id", user.id)
                      .maybeSingle()
                : { data: null };

            const role = profile?.role ?? "citoyen";
            if (ADMIN_ROLES.includes(role as UserRole)) {
                router.push(`/${locale}/admin`);
            } else {
                router.push(`/${locale}/espace`);
            }
            router.refresh();
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Erreur de connexion";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
            <div className="w-full max-w-md bg-[var(--color-surface)] p-8 rounded-lg shadow-md border border-[var(--color-border)]">
                <BrandLogo size="xl" className="mb-6" />
                <form onSubmit={handleLogin} className="space-y-4">
                    <input
                        type="email"
                        placeholder={t("email_placeholder")}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-surface)] text-[var(--color-fg)] outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                        required
                    />
                    <input
                        type="password"
                        placeholder={t("password_placeholder")}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-surface)] text-[var(--color-fg)] outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                        required
                    />
                    {error && <p className="text-[var(--st-no)] text-sm">{error}</p>}
                    {registered && !error && (
                        <p className="text-[var(--st-ok)] text-sm">
                            {t("registered_success")}
                        </p>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 px-4 bg-[var(--color-accent)] text-[var(--color-primary-foreground)] rounded-md hover:opacity-90 disabled:opacity-50"
                    >
                        {loading ? t("submitting") : t("submit")}
                    </button>
                </form>
                <p className="mt-4 text-center text-sm text-[var(--color-muted)]">
                    {t("register_prompt")}{" "}
                    <Link
                        href={`/${locale}/register`}
                        className="text-[var(--color-accent)] font-medium hover:underline"
                    >
                        {t("register_link")}
                    </Link>
                </p>
            </div>
        </div>
    );
}