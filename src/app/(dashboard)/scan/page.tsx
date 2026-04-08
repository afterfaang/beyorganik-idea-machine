"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Play,
  Loader2,
  ExternalLink,
  Globe,
  AtSign,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface BrandProfile {
  id: string;
  name: string;
  websiteUrl: string;
  instagramHandle: string;
}

interface Competitor {
  id: string;
  name: string;
  websiteUrl: string;
  instagramHandle: string;
}

interface ScanReport {
  id: string;
  type: string;
  status: string;
  summary: string | null;
  createdAt: string;
  completedAt: string | null;
}

interface EditForm {
  websiteUrl: string;
  instagramHandle: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  RUNNING: { label: "Devam Ediyor", color: "bg-yellow-100 text-yellow-700" },
  COMPLETED: { label: "Tamamlandi", color: "bg-green-100 text-green-700" },
  FAILED: { label: "Basarisiz", color: "bg-red-100 text-red-700" },
};

export default function ScanPage() {
  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [reports, setReports] = useState<ScanReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{
    type: "brand" | "competitor";
    id: string;
    name: string;
  } | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    websiteUrl: "",
    instagramHandle: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/settings/brand").then((r) => r.json()),
      fetch("/api/settings/competitors").then((r) => r.json()),
      fetch("/api/scan/reports").then((r) => r.json()),
    ])
      .then(([b, c, r]) => {
        setBrand(b);
        setCompetitors(c);
        setReports(r);
      })
      .catch(() => toast.error("Veriler yuklenemedi"))
      .finally(() => setLoading(false));
  }, []);

  const handleStartScan = async () => {
    setScanning(true);
    try {
      const res = await fetch("/api/scan/trigger", { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Tarama baslatilamadi");
      }
      toast.success("Tarama baslatildi! Tamamlaninca sonuclar gorunecek.");
      // Refresh reports
      const reportsRes = await fetch("/api/scan/reports");
      const reportsData = await reportsRes.json();
      setReports(reportsData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Tarama baslatilamadi";
      toast.error(message);
    } finally {
      setScanning(false);
    }
  };

  const openEditDialog = (
    type: "brand" | "competitor",
    id: string,
    name: string,
    websiteUrl: string,
    instagramHandle: string
  ) => {
    setEditTarget({ type, id, name });
    setEditForm({ websiteUrl, instagramHandle });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    setSaving(true);

    const url =
      editTarget.type === "brand"
        ? "/api/settings/brand"
        : `/api/settings/competitors/${editTarget.id}`;

    try {
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteUrl: editForm.websiteUrl,
          instagramHandle: editForm.instagramHandle,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Kaydedilemedi");
      }

      const updated = await res.json();

      if (editTarget.type === "brand") {
        setBrand((prev) =>
          prev
            ? {
                ...prev,
                websiteUrl: updated.websiteUrl ?? editForm.websiteUrl,
                instagramHandle:
                  updated.instagramHandle ?? editForm.instagramHandle,
              }
            : prev
        );
      } else {
        setCompetitors((prev) =>
          prev.map((c) =>
            c.id === editTarget.id
              ? {
                  ...c,
                  websiteUrl: updated.websiteUrl ?? editForm.websiteUrl,
                  instagramHandle:
                    updated.instagramHandle ?? editForm.instagramHandle,
                }
              : c
          )
        );
      }

      toast.success(`${editTarget.name} basariyla guncellendi`);
      setEditOpen(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Guncelleme basarisiz oldu";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40" />
        <Skeleton className="h-60" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Scan Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-green-600" />
            Tarama Kontrolleri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Brand */}
          {brand && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-100">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm text-green-800">
                  Marka: {brand.name}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-green-600 hover:text-green-800 hover:bg-green-100"
                  onClick={() =>
                    openEditDialog(
                      "brand",
                      brand.id,
                      brand.name,
                      brand.websiteUrl,
                      brand.instagramHandle
                    )
                  }
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex gap-4 mt-1 text-xs text-green-600">
                <span className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {brand.websiteUrl}
                </span>
                <span className="flex items-center gap-1">
                  <AtSign className="h-3 w-3" />
                  {brand.instagramHandle}
                </span>
              </div>
            </div>
          )}

          {/* Competitors */}
          {competitors.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Rakipler
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {competitors.map((c) => (
                  <div
                    key={c.id}
                    className="p-2 bg-gray-50 rounded-lg border text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">
                        {c.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                        onClick={() =>
                          openEditDialog(
                            "competitor",
                            c.id,
                            c.name,
                            c.websiteUrl,
                            c.instagramHandle
                          )
                        }
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {c.websiteUrl}
                      </span>
                      <span className="flex items-center gap-1">
                        <AtSign className="h-3 w-3" />
                        {c.instagramHandle}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={handleStartScan}
            disabled={scanning}
            className="bg-green-600 hover:bg-green-700"
          >
            {scanning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Tarama Baslatiliyor...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Manuel Tarama Baslat
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Scan History */}
      <Card>
        <CardHeader>
          <CardTitle>Tarama Gecmisi</CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">
              Henuz tarama yapilmamis.
            </p>
          ) : (
            <div className="space-y-2">
              {reports.map((report) => {
                const st = statusLabels[report.status] || {
                  label: report.status,
                  color: "bg-gray-100 text-gray-700",
                };
                return (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={`${st.color} text-xs`}>
                        {st.label}
                      </Badge>
                      <span className="text-sm text-gray-700">
                        {report.type === "MANUAL" ? "Manuel" : "Zamanlanmis"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(report.createdAt).toLocaleDateString("tr-TR")}{" "}
                        {new Date(report.createdAt).toLocaleTimeString("tr-TR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {report.status === "COMPLETED" && (
                      <Link href={`/scan/${report.id}`}>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="mr-1 h-3 w-3" />
                          Detay
                        </Button>
                      </Link>
                    )}
                    {report.status === "RUNNING" && (
                      <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editTarget?.name} - Linkleri Duzenle
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-website" className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                Website URL
              </Label>
              <Input
                id="edit-website"
                value={editForm.websiteUrl}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    websiteUrl: e.target.value,
                  }))
                }
                placeholder="https://example.com"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="edit-instagram"
                className="flex items-center gap-1.5"
              >
                <AtSign className="h-3.5 w-3.5" />
                Instagram Handle
              </Label>
              <Input
                id="edit-instagram"
                value={editForm.instagramHandle}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    instagramHandle: e.target.value,
                  }))
                }
                placeholder="@handle"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={saving}
            >
              Vazgec
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                "Kaydet"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
