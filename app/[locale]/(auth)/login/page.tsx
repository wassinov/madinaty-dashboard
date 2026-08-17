"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { Activity, ArrowLeft, BarChart3, Megaphone, ShieldCheck } from "lucide-react";
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

    const features = [
        { icon: Activity, title: t("feature_1_title"), text: t("feature_1_text") },
        { icon: BarChart3, title: t("feature_2_title"), text: t("feature_2_text") },
        { icon: Megaphone, title: t("feature_3_title"), text: t("feature_3_text") },
    ];

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
        <div className="flex min-h-screen bg-[var(--color-bg)]">
            {/* Panneau marque — valeurs du produit (desktop) */}
            <div className="hidden lg:flex w-[44%] xl:w-1/2 flex-col justify-between bg-[var(--color-navy)] p-10 text-[var(--color-on-navy)]">
                <div>
                    <BrandLogo size="lg" align="left" />
                    <h1 className="mt-10 text-3xl xl:text-4xl font-bold leading-tight">
                        {t("welcome_title")}
                    </h1>
                    <p className="mt-3 max-w-md text-[var(--color-on-navy-muted)]">
                        {t("welcome_text")}
                    </p>
                    <ul className="mt-10 space-y-6">
                        {features.map((f) => (
                            <li key={f.title} className="flex gap-3">
                                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-navy-2)] text-[var(--d-eau)]">
                                    <f.icon className="h-5 w-5" />
                                </span>
                                <div>
                                    <p className="font-semibold">{f.title}</p>
                                    <p className="text-sm text-[var(--color-on-navy-muted)]">
                                        {f.text}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <p className="flex items-center gap-2 text-sm text-[var(--color-on-navy-muted)]">
                        <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--d-eau)]" />
                        {t("security_note")}
                    </p>
                    <p className="mt-4 text-xs text-[var(--color-on-navy-muted)]/70">
                        © {new Date().getFullYear()} Madinaty
                    </p>
                </div>
            </div>

            {/* Zone de connexion */}
            <div className="relative flex flex-1 items-center justify-center px-4 py-10">
                <Link
                    href={`/${locale}`}
                    className="absolute top-4 start-4 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-accent)] hover:bg-[var(--color-surface-2)]"
                >
                    <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                    {t("back_home")}
                </Link>
                <div className="w-full max-w-md bg-[var(--color-surface)] p-8 rounded-lg shadow-md border border-[var(--color-border)]">
                    <Link href={`/${locale}`} title={t("back_home")}>
                        <BrandLogo size="xl" className="mb-6" />
                    </Link>
                    <h2 className="text-xl font-bold text-center mb-1">
                        {t("title")}
                    </h2>
                    <p className="text-sm text-[var(--color-muted)] text-center mb-6">
                        {t("subtitle")}
                    </p>
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
        </div>
    );
}