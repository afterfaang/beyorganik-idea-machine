"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Globe,
  AtSign,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ScanEntry {
  id: string;
  brandName: string;
  sourceType: string;
  sourceUrl: string;
  rawContent: string | null;
  analysis: string | null;
  highlights: string[] | null;
}

interface ScanReport {
  id: string;
  type: string;
  status: string;
  summary: string | null;
  insights: Record<string, unknown> | null;
  entries: ScanEntry[];
  createdAt: string;
  completedAt: string | null;
}

export default function ScanDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [report, setReport] = useState<ScanReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/scan/reports/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setReport)
      .catch(() => toast.error("Rapor yuklenemedi"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Rapor bulunamadi.</p>
        <Link href="/scan">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tarama Listesine Don
          </Button>
        </Link>
      </div>
    );
  }

  // Group entries by brand
  const brandEntries = report.entries.reduce<Record<string, ScanEntry[]>>(
    (acc, entry) => {
      if (!acc[entry.brandName]) acc[entry.brandName] = [];
      acc[entry.brandName].push(entry);
      return acc;
    },
    {}
  );

  // Extract opportunities from insights if available
  const opportunities =
    report.insights && Array.isArray((report.insights as Record<string, unknown>).opportunities)
      ? ((report.insights as Record<string, unknown>).opportunities as string[])
      : [];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/scan">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Tarama Listesi
        </Button>
      </Link>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Tarama Ozeti</CardTitle>
          <div className="flex gap-2 text-xs text-gray-400">
            <Badge variant="outline">
              {report.type === "MANUAL" ? "Manuel" : "Zamanlanmis"}
            </Badge>
            <span>
              {new Date(report.createdAt).toLocaleDateString("tr-TR")}{" "}
              {new Date(report.createdAt).toLocaleTimeString("tr-TR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 leading-relaxed">
            {report.summary || "Ozet bulunamadi."}
          </p>
        </CardContent>
      </Card>

      {/* Brand-by-Brand Analysis */}
      {Object.entries(brandEntries).map(([brandName, entries]) => (
        <Card key={brandName}>
          <CardHeader>
            <CardTitle className="text-base">{brandName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="p-4 bg-gray-50 rounded-lg space-y-2"
              >
                <div className="flex items-center gap-2">
                  {entry.sourceType === "website" ? (
                    <Globe className="h-4 w-4 text-gray-500" />
                  ) : (
                    <AtSign className="h-4 w-4 text-pink-500" />
                  )}
                  <span className="text-xs font-medium text-gray-600 uppercase">
                    {entry.sourceType === "website"
                      ? "Website Analizi"
                      : "Instagram Analizi"}
                  </span>
                  <span className="text-xs text-gray-400">{entry.sourceUrl}</span>
                </div>
                {entry.analysis && (
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {entry.analysis}
                  </p>
                )}
                {entry.highlights &&
                  Array.isArray(entry.highlights) &&
                  entry.highlights.length > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-gray-500">
                        One Cikanlar:
                      </span>
                      <ul className="mt-1 space-y-1">
                        {entry.highlights.map((h, i) => (
                          <li
                            key={i}
                            className="text-xs text-gray-600 flex items-start gap-1"
                          >
                            <Lightbulb className="h-3 w-3 mt-0.5 text-yellow-500 shrink-0" />
                            {String(h)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Opportunities */}
      {opportunities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Firsatlar</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {opportunities.map((opp, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-gray-700"
                >
                  <Sparkles className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                  {opp}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Generate Ideas from Scan */}
      <div className="flex justify-center pt-4">
        <Link href="/ideas">
          <Button className="bg-green-600 hover:bg-green-700">
            <Sparkles className="mr-2 h-4 w-4" />
            Bu Taramaya Dayali Fikir Uret
          </Button>
        </Link>
      </div>
    </div>
  );
}
