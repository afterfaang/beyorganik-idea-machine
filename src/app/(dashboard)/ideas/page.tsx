"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Lightbulb,
  Archive,
  ArrowRightLeft,
  Loader2,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Filters
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sourceFilter, setSourceFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("createdAt");

  // Generation form
  const [genCategoryId, setGenCategoryId] = useState<string>("");
  const [genDetailLevel, setGenDetailLevel] = useState<string>("QUICK");
  const [genCount, setGenCount] = useState<string>("3");
  const [genContext, setGenContext] = useState("");
  const [genIncludeScan, setGenIncludeScan] = useState(false);

  const fetchIdeas = useCallback(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (sourceFilter) params.set("source", sourceFilter);
    if (sortBy) params.set("sortBy", sortBy);
    params.set("limit", "100");

    fetch(`/api/ideas?${params}`)
      .then((res) => res.json())
      .then((data) => {
        let filtered = data.ideas || [];
        if (selectedCategories.length > 0) {
          filtered = filtered.filter((i: Idea) =>
            selectedCategories.includes(i.categoryId)
          );
        }
        setIdeas(filtered);
      })
      .catch(() => toast.error("Fikirler yuklenemedi"))
      .finally(() => setLoading(false));
  }, [statusFilter, sourceFilter, sortBy, selectedCategories]);

  useEffect(() => {
    fetch("/api/settings/categories")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data);
        if (data.length > 0 && !genCategoryId) {
          setGenCategoryId(data[0].id);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const handleGenerate = async () => {
    if (!genCategoryId) {
      toast.error("Lutfen bir kategori secin");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/ideas/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: genCategoryId,
          detailLevel: genDetailLevel,
          count: parseInt(genCount),
          additionalContext: genContext || undefined,
          includeScanData: genIncludeScan,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Fikir uretilemedi");
      }
      toast.success("Fikirler basariyla uretildi!");
      setGenContext("");
      fetchIdeas();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Fikir uretilemedi";
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      const res = await fetch(`/api/ideas/${id}/archive`, { method: "PATCH" });
      if (!res.ok) throw new Error();
      toast.success("Fikir arsivlendi");
      fetchIdeas();
    } catch {
      toast.error("Arsivleme basarisiz");
    }
  };

  const handleConvertToTask = async (id: string) => {
    try {
      const res = await fetch(`/api/ideas/${id}/to-task`, { method: "POST" });
      if (!res.ok) throw new Error();
      toast.success("Fikir goreve donusturuldu!");
      fetchIdeas();
    } catch {
      toast.error("Donusturme basarisiz");
    }
  };

  const handleScoreChange = async (
    id: string,
    field: "impactScore" | "easeScore",
    value: number
  ) => {
    try {
      const res = await fetch(`/api/ideas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setIdeas((prev) => prev.map((i) => (i.id === id ? updated : i)));
    } catch {
      toast.error("Puan guncellenemedi");
    }
  };

  const toggleCategory = (catId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  };

  return (
    <div className="flex gap-6">
      {/* Left Panel - Filters */}
      <div className="w-64 shrink-0 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <SlidersHorizontal className="h-4 w-4" />
              Filtreler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Categories */}
            <div>
              <Label className="text-xs font-semibold text-gray-500 uppercase">
                Kategoriler
              </Label>
              <div className="mt-2 space-y-2">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`cat-${cat.id}`}
                      checked={selectedCategories.includes(cat.id)}
                      onCheckedChange={() => toggleCategory(cat.id)}
                    />
                    <label
                      htmlFor={`cat-${cat.id}`}
                      className="text-sm text-gray-700 cursor-pointer"
                    >
                      {cat.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <Label className="text-xs font-semibold text-gray-500 uppercase">
                Durum
              </Label>
              <div className="mt-2 space-y-2">
                {[
                  { value: "", label: "Tumu" },
                  { value: "ACTIVE", label: "Aktif" },
                  { value: "CONVERTED_TO_TASK", label: "Goreve Donen" },
                  { value: "ARCHIVED", label: "Arsivlenmis" },
                ].map((opt) => (
                  <div key={opt.value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      id={`status-${opt.value}`}
                      name="status"
                      checked={statusFilter === opt.value}
                      onChange={() => setStatusFilter(opt.value)}
                      className="accent-green-600"
                    />
                    <label
                      htmlFor={`status-${opt.value}`}
                      className="text-sm text-gray-700 cursor-pointer"
                    >
                      {opt.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Source */}
            <div>
              <Label className="text-xs font-semibold text-gray-500 uppercase">
                Kaynak
              </Label>
              <div className="mt-2 space-y-2">
                {[
                  { value: "", label: "Tumu" },
                  { value: "MANUAL", label: "Manuel" },
                  { value: "SCAN_BASED", label: "Tarama" },
                ].map((opt) => (
                  <div key={opt.value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      id={`source-${opt.value}`}
                      name="source"
                      checked={sourceFilter === opt.value}
                      onChange={() => setSourceFilter(opt.value)}
                      className="accent-green-600"
                    />
                    <label
                      htmlFor={`source-${opt.value}`}
                      className="text-sm text-gray-700 cursor-pointer"
                    >
                      {opt.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div>
              <Label className="text-xs font-semibold text-gray-500 uppercase">
                Siralama
              </Label>
              <Select value={sortBy} onValueChange={(v) => v && setSortBy(v)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Tarih</SelectItem>
                  <SelectItem value="priorityScore">Oncelik</SelectItem>
                  <SelectItem value="impactScore">Etki</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Link href="/ideas/archive">
              <Button variant="outline" size="sm" className="w-full mt-2">
                <Archive className="mr-2 h-4 w-4" />
                Arsiv
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Main Area */}
      <div className="flex-1 space-y-6">
        {/* Generation Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-green-600" />
              Fikir Uret
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <Label className="text-xs">Kategori</Label>
                <Select value={genCategoryId} onValueChange={(v) => v && setGenCategoryId(v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sec...">
                      {categories.find((c) => c.id === genCategoryId)?.name || "Sec..."}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Detay Seviyesi</Label>
                <Select value={genDetailLevel} onValueChange={(v) => v && setGenDetailLevel(v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="QUICK">Hizli</SelectItem>
                    <SelectItem value="DETAILED">Detayli</SelectItem>
                    <SelectItem value="ACTION_PLAN">Aksiyon Plani</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Adet</Label>
                <Select value={genCount} onValueChange={(v) => v && setGenCount(v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="includeScan"
                    checked={genIncludeScan}
                    onCheckedChange={(c) => setGenIncludeScan(c === true)}
                  />
                  <label htmlFor="includeScan" className="text-xs text-gray-700">
                    Tarama verisini dahil et
                  </label>
                </div>
              </div>
            </div>
            <Textarea
              placeholder="Ek baglam veya yonlendirme (opsiyonel)..."
              value={genContext}
              onChange={(e) => setGenContext(e.target.value)}
              rows={2}
              className="mb-4"
            />
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-green-600 hover:bg-green-700"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uretiliyor...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Fikir Uret
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Ideas Grid */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : ideas.length === 0 ? (
          <div className="text-center py-12">
            <Lightbulb className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-500">
              Henuz fikir bulunamadi. Yukaridaki formu kullanarak fikir uretin.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {ideas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onArchive={handleArchive}
                onConvert={handleConvertToTask}
                onScoreChange={handleScoreChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function IdeaCard({
  idea,
  onArchive,
  onConvert,
  onScoreChange,
}: {
  idea: Idea;
  onArchive: (id: string) => void;
  onConvert: (id: string) => void;
  onScoreChange: (
    id: string,
    field: "impactScore" | "easeScore",
    value: number
  ) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const truncated =
    idea.description.length > 150 && !expanded
      ? idea.description.slice(0, 150) + "..."
      : idea.description;

  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/ideas/${idea.id}`}
            className="font-semibold text-gray-900 text-sm leading-snug hover:text-green-700 hover:underline transition-colors"
          >
            {idea.title}
          </Link>
          {idea.priorityScore != null && (
            <Badge
              variant="outline"
              className="shrink-0 bg-green-50 text-green-700 border-green-200"
            >
              P{idea.priorityScore.toFixed(1)}
            </Badge>
          )}
        </div>

        <p className="text-sm text-gray-600 leading-relaxed">
          {truncated}
          {idea.description.length > 150 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="ml-1 text-green-600 hover:underline text-xs"
            >
              {expanded ? "Kisalt" : "Devamini oku"}
            </button>
          )}
        </p>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="text-xs">
            {idea.category.name}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {detailLevelLabels[idea.detailLevel] || idea.detailLevel}
          </Badge>
          <Badge
            variant="outline"
            className={
              idea.source === "SCAN_BASED"
                ? "text-xs bg-blue-50 text-blue-700 border-blue-200"
                : "text-xs"
            }
          >
            {sourceLabels[idea.source] || idea.source}
          </Badge>
          <span className="text-xs text-gray-400 ml-auto">
            {new Date(idea.createdAt).toLocaleDateString("tr-TR")}
          </span>
        </div>

        {/* Scores */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-12">Etki</span>
            <Slider
              min={1}
              max={5}
              step={1}
              value={[idea.impactScore ?? 3]}
              onValueCommitted={(val) => {
                const arr = Array.isArray(val) ? val : [val];
                onScoreChange(idea.id, "impactScore", arr[0]);
              }}
              className="flex-1"
            />
            <span className="text-xs font-medium w-4 text-right">
              {idea.impactScore ?? "-"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-12">Kolaylik</span>
            <Slider
              min={1}
              max={5}
              step={1}
              value={[idea.easeScore ?? 3]}
              onValueCommitted={(val) => {
                const arr = Array.isArray(val) ? val : [val];
                onScoreChange(idea.id, "easeScore", arr[0]);
              }}
              className="flex-1"
            />
            <span className="text-xs font-medium w-4 text-right">
              {idea.easeScore ?? "-"}
            </span>
          </div>
        </div>

        {/* Actions */}
        {idea.status === "ACTIVE" && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onConvert(idea.id)}
              className="text-xs"
            >
              <ArrowRightLeft className="mr-1 h-3 w-3" />
              Task&apos;e Donustur
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onArchive(idea.id)}
              className="text-xs text-gray-500"
            >
              <Archive className="mr-1 h-3 w-3" />
              Arsivle
            </Button>
          </div>
        )}
        {idea.status === "CONVERTED_TO_TASK" && (
          <Badge className="bg-blue-100 text-blue-700 text-xs">
            Goreve donusturuldu
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
