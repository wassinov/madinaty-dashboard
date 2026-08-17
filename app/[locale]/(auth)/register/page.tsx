"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useTranslations, useLocale } from "next-intl";
import { validateRegister } from "@/lib/utils/registerValidation";

export default function RegisterPage() {
    const t = useTranslations("register");
    const locale = useLocale();
    const [nomComplet, setNomComplet] = useState("");
    const [email, setEmail] = useState("");
    const [telephone, setTelephone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();
    const supabase = createClient();

    const validate = () => {
        const key = validateRegister({
            nomComplet,
            email,
            telephone,
            password,
            confirmPassword,
        });
        if (key) setError(t(key));
        return key === null;
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        if (!validate()) {
            setLoading(false);
            return;
        }
        try {
            const { error: signUpError } = await supabase.auth.signUp({
                email: email.trim(),
                password,
                options: {
                    data: {
                        nom_complet: nomComplet.trim(),
                        telephone: telephone.trim() || null,
                    },
                },
            });
            if (signUpError) throw signUpError;

            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (session) {
                router.push(`/${locale}/espace`);
            } else {
                router.push(`/${locale}/login?registered=1`);
            }
            router.refresh();
        } catch (err) {
            const message =
                err instanceof Error ? err.message : t("error_generic");
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
            <Link
                href={`/${locale}`}
                className="absolute top-4 start-4 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-accent)] hover:bg-[var(--color-surface-2)]"
            >
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                {t("back_home")}
            </Link>
            <div className="w-full max-w-md bg-[var(--color-surface)] p-8 rounded-lg shadow-md border border-[var(--color-border)]">
                <Link href={`/${locale}`} title={t("back_home")}>
                    <BrandLogo size="xl" className="mb-4" />
                </Link>
                <h1 className="text-2xl font-bold text-center mb-2">
                    {t("title")}
                </h1>
                <p className="text-sm text-[var(--color-muted)] text-center mb-6">
                    {t("subtitle")}
                </p>
                <form onSubmit={handleRegister} className="space-y-4">
                    <input
                        type="text"
                        placeholder={t("field_name_label")}
                        value={nomComplet}
                        onChange={(e) => setNomComplet(e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-surface)] text-[var(--color-fg)] outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                        required
                    />
                    <input
                        type="email"
                        placeholder={t("field_email_label")}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-surface)] text-[var(--color-fg)] outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                        required
                    />
                    <input
                        type="tel"
                        placeholder={t("field_phone_label")}
                        value={telephone}
                        onChange={(e) => setTelephone(e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-surface)] text-[var(--color-fg)] outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                    <input
                        type="password"
                        placeholder={t("field_password_label")}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-surface)] text-[var(--color-fg)] outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                        required
                    />
                    <input
                        type="password"
                        placeholder={t("field_confirm_password_label")}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-surface)] text-[var(--color-fg)] outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                        required
                    />
                    {error && <p className="text-[var(--st-no)] text-sm">{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 px-4 bg-[var(--color-accent)] text-[var(--color-primary-foreground)] rounded-md hover:opacity-90 disabled:opacity-50"
                    >
                        {loading ? t("submitting") : t("submit")}
                    </button>
                </form>
                <p className="mt-4 text-center text-sm text-[var(--color-muted)]">
                    {t("login_prompt")}{" "}
                    <Link
                        href={`/${locale}/login`}
                        className="text-[var(--color-accent)] font-medium hover:underline"
                    >
                        {t("login_link")}
                    </Link>
                </p>
            </div>
        </div>
    );
}
