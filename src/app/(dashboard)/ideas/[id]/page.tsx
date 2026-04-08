"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRightLeft,
  Archive,
  Sparkles,
  Loader2,
  Calendar,
  Tag,
  BarChart3,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface Category {
  id: string;
  name: string;
}

interface Idea {
  id: string;
  title: string;
  description: string;
  detailLevel: string;
  categoryId: string;
  category: Category;
  impactScore: number | null;
  easeScore: number | null;
  priorityScore: number | null;
  status: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

const detailLevelLabels: Record<string, string> = {
  QUICK: "Hizli",
  DETAILED: "Detayli",
  ACTION_PLAN: "Aksiyon Plani",
};

const sourceLabels: Record<string, string> = {
  MANUAL: "Manuel",
  SCAN_BASED: "Tarama",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Aktif",
  ARCHIVED: "Arsivlenmis",
  CONVERTED_TO_TASK: "Goreve Donusturuldu",
};

function renderMarkdown(text: string) {
  // Simple markdown renderer for sections
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("## ")) {
      elements.push(
        <h2
          key={key++}
          className="text-lg font-bold text-gray-900 mt-6 mb-2 first:mt-0"
        >
          {line.replace("## ", "")}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={key++} className="text-md font-semibold text-gray-800 mt-4 mb-1">
          {line.replace("### ", "")}
        </h3>
      );
    } else if (line.startsWith("# ")) {
      elements.push(
        <h1 key={key++} className="text-xl font-bold text-gray-900 mt-6 mb-2">
          {line.replace("# ", "")}
        </h1>
      );
    } else if (/^\d+\.\s/.test(line)) {
      elements.push(
        <div key={key++} className="flex gap-2 ml-2 mb-1">
          <span className="text-green-600 font-medium shrink-0">
            {line.match(/^\d+\./)?.[0]}
          </span>
          <span className="text-gray-700 text-sm">
            {line.replace(/^\d+\.\s*/, "")}
          </span>
        </div>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <div key={key++} className="flex gap-2 ml-4 mb-1">
          <span className="text-green-500 mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-green-500" />
          <span className="text-gray-700 text-sm">
            {line.replace(/^[-*]\s*/, "")}
          </span>
        </div>
      );
    } else if (line.startsWith("**") && line.endsWith("**")) {
      elements.push(
        <p key={key++} className="font-semibold text-gray-800 mt-2 mb-1 text-sm">
          {line.replace(/\*\*/g, "")}
        </p>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={key++} className="h-2" />);
    } else {
      // Render inline bold markers
      const parts = line.split(/(\*\*.*?\*\*)/g);
      elements.push(
        <p key={key++} className="text-gray-700 text-sm leading-relaxed mb-1">
          {parts.map((part, idx) =>
            part.startsWith("**") && part.endsWith("**") ? (
              <strong key={idx} className="font-semibold text-gray-900">
                {part.replace(/\*\*/g, "")}
              </strong>
            ) : (
              <span key={idx}>{part}</span>
            )
          )}
        </p>
      );
    }
  }

  return elements;
}

export default function IdeaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [idea, setIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(true);
  const [enhancing, setEnhancing] = useState(false);

  useEffect(() => {
    fetch(`/api/ideas/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Fikir bulunamadi");
        return res.json();
      })
      .then((data) => setIdea(data))
      .catch(() => {
        toast.error("Fikir yuklenemedi");
        router.push("/ideas");
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleEnhance = async () => {
    if (!idea) return;
    setEnhancing(true);
    try {
      const res = await fetch(`/api/ideas/${id}/enhance`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Detaylandirma basarisiz");
      }
      const updated = await res.json();
      setIdea(updated);
      toast.success("Fikir basariyla detaylandirildi!");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Detaylandirma basarisiz";
      toast.error(message);
    } finally {
      setEnhancing(false);
    }
  };

  const handleArchive = async () => {
    if (!idea) return;
    try {
      const res = await fetch(`/api/ideas/${id}/archive`, { method: "PATCH" });
      if (!res.ok) throw new Error();
      toast.success("Fikir arsivlendi");
      router.push("/ideas");
    } catch {
      toast.error("Arsivleme basarisiz");
    }
  };

  const handleConvertToTask = async () => {
    if (!idea) return;
    try {
      const res = await fetch(`/api/ideas/${id}/to-task`, { method: "POST" });
      if (!res.ok) throw new Error();
      toast.success("Fikir goreve donusturuldu!");
      router.push("/ideas");
    } catch {
      toast.error("Donusturme basarisiz");
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Fikir bulunamadi.</p>
        <Link href="/ideas">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri Don
          </Button>
        </Link>
      </div>
    );
  }

  const isEnhanced = idea.detailLevel === "ACTION_PLAN";
  const hasMarkdownSections = idea.description.includes("## ");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/ideas">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri Don
          </Button>
        </Link>
        <div className="flex gap-2">
          {idea.status === "ACTIVE" && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleConvertToTask}
                className="text-xs"
              >
                <ArrowRightLeft className="mr-1 h-3.5 w-3.5" />
                Task&apos;e Donustur
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleArchive}
                className="text-xs text-gray-500"
              >
                <Archive className="mr-1 h-3.5 w-3.5" />
                Arsivle
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Title & Meta */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="text-xl leading-snug">{idea.title}</CardTitle>
            <Badge
              className={
                idea.status === "ACTIVE"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : idea.status === "ARCHIVED"
                    ? "bg-gray-100 text-gray-600 border-gray-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
              }
              variant="outline"
            >
              {statusLabels[idea.status] || idea.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Kategori</p>
                <p className="font-medium">{idea.category.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Detay Seviyesi</p>
                <p className="font-medium">
                  {detailLevelLabels[idea.detailLevel] || idea.detailLevel}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Kaynak</p>
                <p className="font-medium">
                  {sourceLabels[idea.source] || idea.source}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Olusturulma</p>
                <p className="font-medium">
                  {new Date(idea.createdAt).toLocaleDateString("tr-TR")}
                </p>
              </div>
            </div>
          </div>

          {/* Scores */}
          {(idea.impactScore != null || idea.easeScore != null) && (
            <>
              <Separator className="my-4" />
              <div className="flex gap-6 text-sm">
                {idea.impactScore != null && (
                  <div>
                    <span className="text-gray-500">Etki Puani:</span>{" "}
                    <span className="font-semibold text-green-700">
                      {idea.impactScore}/5
                    </span>
                  </div>
                )}
                {idea.easeScore != null && (
                  <div>
                    <span className="text-gray-500">Kolaylik Puani:</span>{" "}
                    <span className="font-semibold text-green-700">
                      {idea.easeScore}/5
                    </span>
                  </div>
                )}
                {idea.priorityScore != null && (
                  <div>
                    <span className="text-gray-500">Oncelik:</span>{" "}
                    <span className="font-semibold text-green-700">
                      {idea.priorityScore.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* AI Enhance Button */}
      {idea.status === "ACTIVE" && !isEnhanced && (
        <Card className="border-dashed border-green-300 bg-green-50/50">
          <CardContent className="py-6 flex flex-col items-center gap-3">
            <Sparkles className="h-8 w-8 text-green-600" />
            <p className="text-sm text-gray-600 text-center max-w-md">
              Bu fikri AI ile detaylandirarak kapsamli bir uygulama planina
              donusturebilirsiniz.
            </p>
            <Button
              onClick={handleEnhance}
              disabled={enhancing}
              className="bg-green-600 hover:bg-green-700"
            >
              {enhancing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Detaylandiriliyor...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI ile Detaylandir
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Re-enhance option for already enhanced ideas */}
      {idea.status === "ACTIVE" && isEnhanced && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEnhance}
            disabled={enhancing}
            className="text-xs"
          >
            {enhancing ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Yeniden detaylandiriliyor...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                Yeniden Detaylandir
              </>
            )}
          </Button>
        </div>
      )}

      {/* Description / Enhanced Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {hasMarkdownSections ? (
              <>
                <Sparkles className="h-4 w-4 text-green-600" />
                Detayli Uygulama Plani
              </>
            ) : (
              "Aciklama"
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasMarkdownSections ? (
            <div className="space-y-0">{renderMarkdown(idea.description)}</div>
          ) : (
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
              {idea.description}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
