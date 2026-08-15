"use client";

import React, { useState } from "react";
import Map, { Marker, MapMouseEvent } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { MAP_STYLE_URL, SIGNALEMENT_TYPES, TYPE_META } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { getNearestCommune } from "@/lib/utils/geoHelpers";
import { toast } from "sonner";

export function ReportFormWithMap() {
    const t = useTranslations("public");
    const tTypes = useTranslations("types");
    const supabase = createClient();
    const [markerCoords, setMarkerCoords] = useState<{
        latitude: number;
        longitude: number;
    } | null>(null);
    const [communeLabel, setCommuneLabel] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        type: "",
        description: "",
        adresse_texte: "",
    });

    const [loading, setLoading] = useState(false);

    const handleMapClick = (event: MapMouseEvent) => {
        const { lng, lat } = event.lngLat;
        setMarkerCoords({ latitude: lat, longitude: lng });
        const commune = getNearestCommune(lat, lng);
        setCommuneLabel(
            commune ? `${commune.nom} (${commune.wilayaCode})` : null
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!markerCoords) {
            toast.error(t("marker_required"));
            return;
        }

        if (!formData.type || !formData.description) {
            toast.error(t("fields_required"));
            return;
        }

        setLoading(true);
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
                toast.error(t("login_required"));
                return;
            }

            const commune = getNearestCommune(
                markerCoords.latitude,
                markerCoords.longitude
            );

            const { error } = await supabase.rpc("insert_signalement", {
                p_client_id: crypto.randomUUID(),
                p_user_id: user.id,
                p_type: formData.type,
                p_description: formData.description,
                p_adresse_texte: formData.adresse_texte || null,
                p_latitude: markerCoords.latitude,
                p_longitude: markerCoords.longitude,
                p_photos: [],
                p_statut: "en_attente",
                p_commune_code: commune?.communeCode ?? null,
                p_wilaya_code: commune?.wilayaCode ?? null,
            });

            if (error) throw error;

            toast.success(t("success_message"));
            setFormData({
                type: "",
                description: "",
                adresse_texte: "",
            });
            setMarkerCoords(null);
        } catch (err) {
            console.error(err);
            toast.error(t("error_message"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-white rounded-xl shadow-md border max-w-5xl mx-auto my-6">
            <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-xl font-bold text-[var(--color-fg)]">
                    {t("report_title")}
                </h2>
                <p className="text-sm text-[var(--color-muted)]">
                    {t("click_map_instruction")}
                </p>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        {t("type_label")}
                    </label>
                    <Select
                        value={formData.type}
                        onValueChange={(val) =>
                            setFormData({ ...formData, type: val })
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={t("type_placeholder")} />
                        </SelectTrigger>
                        <SelectContent>
                            {SIGNALEMENT_TYPES.map((value) => {
                                const meta = TYPE_META[value];
                                return (
                                    <SelectItem key={value} value={value}>
                                        <span className="inline-flex items-center gap-2">
                                            <span
                                                className="h-2.5 w-2.5 rounded-full inline-block"
                                                style={{
                                                    backgroundColor: meta?.color,
                                                }}
                                            />
                                            <span>{meta?.emoji}</span>
                                            {tTypes(value)}
                                        </span>
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        {t("description_label")}
                    </label>
                    <Textarea
                        placeholder={t("description_placeholder")}
                        value={formData.description}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                description: e.target.value,
                            })
                        }
                        rows={4}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        {t("address_label")}
                    </label>
                    <Input
                        placeholder={t("address_placeholder")}
                        value={formData.adresse_texte}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                adresse_texte: e.target.value,
                            })
                        }
                    />
                </div>

                <div className="bg-[var(--color-surface-2)] p-3 rounded-md text-xs text-[var(--color-muted)]">
                    {markerCoords ? (
                        <span className="text-[var(--st-ok)] font-medium">
                            {t("marker_set", {
                                lat: markerCoords.latitude.toFixed(4),
                                lng: markerCoords.longitude.toFixed(4),
                            })}
                            {communeLabel && (
                                <span className="block mt-1 text-[var(--color-fg)]">
                                    {communeLabel}
                                </span>
                            )}
                        </span>
                    ) : (
                        <span className="text-[var(--st-att)] font-medium">
                            {t("marker_not_set")}
                        </span>
                    )}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? t("submitting") : t("submit")}
                </Button>
            </form>

            <div className="h-[450px] md:h-full min-h-[400px] rounded-lg overflow-hidden border relative">
                <Map
                    initialViewState={{
                        latitude: 36.7538,
                        longitude: 3.0588,
                        zoom: 6,
                    }}
                    style={{ width: "100%", height: "100%" }}
                    mapStyle={MAP_STYLE_URL}
                    onClick={handleMapClick}
                >
                    {markerCoords && (
                        <Marker
                            latitude={markerCoords.latitude}
                            longitude={markerCoords.longitude}
                            anchor="bottom"
                        >
                            <div className="w-6 h-6 bg-[var(--st-no)] rounded-full border-2 border-[var(--color-border)] shadow-lg flex items-center justify-center text-[var(--color-primary-foreground)] text-xs font-bold">
                                📍
                            </div>
                        </Marker>
                    )}
                </Map>
                <div className="absolute top-3 left-3 bg-[var(--color-surface)]/90 backdrop-blur px-3 py-1 rounded shadow text-xs font-medium text-[var(--color-fg)] pointer-events-none">
                    {t("click_on_map")}
                </div>
            </div>
        </div>
    );
}
