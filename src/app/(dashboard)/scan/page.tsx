"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Play, Loader2, ExternalLink, Globe, AtSign } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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
              <h3 className="font-medium text-sm text-green-800">
                Marka: {brand.name}
              </h3>
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
                    <span className="font-medium text-gray-800">{c.name}</span>
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
    </div>
  );
}
