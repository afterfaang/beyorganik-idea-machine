"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Users,
  Tags,
  Clock,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Save,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ==================== TYPES ====================

interface BrandProfile {
  id?: string;
  name: string;
  description: string;
  targetAudience: string;
  toneOfVoice: string;
  websiteUrl: string;
  instagramHandle: string;
  sector: string;
}

interface Competitor {
  id: string;
  name: string;
  description: string | null;
  strengths: string | null;
  weaknesses: string | null;
  websiteUrl: string;
  instagramHandle: string;
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
  isDefault: boolean;
  isCustom: boolean;
  order: number;
}

// ==================== BRAND TAB ====================

function BrandTab() {
  const [brand, setBrand] = useState<BrandProfile>({
    name: "",
    description: "",
    targetAudience: "",
    toneOfVoice: "",
    websiteUrl: "",
    instagramHandle: "",
    sector: "Organik Gida E-Ticaret",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings/brand")
      .then((r) => r.json())
      .then((data) => {
        if (data && data.id) setBrand(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/brand", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brand),
      });
      if (!res.ok) throw new Error();
      toast.success("Marka profili kaydedildi");
    } catch {
      toast.error("Kaydetme basarisiz");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton className="h-96" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Marka Profili</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Marka Adi</Label>
            <Input
              value={brand.name}
              onChange={(e) => setBrand({ ...brand, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Sektor</Label>
            <Input
              value={brand.sector}
              onChange={(e) => setBrand({ ...brand, sector: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Aciklama</Label>
          <Textarea
            rows={3}
            value={brand.description}
            onChange={(e) =>
              setBrand({ ...brand, description: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Hedef Kitle</Label>
          <Textarea
            rows={2}
            value={brand.targetAudience}
            onChange={(e) =>
              setBrand({ ...brand, targetAudience: e.target.value })
            }
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Ses Tonu</Label>
            <Input
              value={brand.toneOfVoice}
              onChange={(e) =>
                setBrand({ ...brand, toneOfVoice: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Website URL</Label>
            <Input
              value={brand.websiteUrl}
              onChange={(e) =>
                setBrand({ ...brand, websiteUrl: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Instagram</Label>
            <Input
              value={brand.instagramHandle}
              onChange={(e) =>
                setBrand({ ...brand, instagramHandle: e.target.value })
              }
            />
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-green-600 hover:bg-green-700"
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Kaydet
        </Button>
      </CardContent>
    </Card>
  );
}

// ==================== COMPETITORS TAB ====================

function CompetitorsTab() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Competitor | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    strengths: "",
    weaknesses: "",
    websiteUrl: "",
    instagramHandle: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchCompetitors = () => {
    fetch("/api/settings/competitors")
      .then((r) => r.json())
      .then(setCompetitors)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCompetitors();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({
      name: "",
      description: "",
      strengths: "",
      weaknesses: "",
      websiteUrl: "",
      instagramHandle: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (c: Competitor) => {
    setEditing(c);
    setForm({
      name: c.name,
      description: c.description || "",
      strengths: c.strengths || "",
      weaknesses: c.weaknesses || "",
      websiteUrl: c.websiteUrl,
      instagramHandle: c.instagramHandle,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editing
        ? `/api/settings/competitors/${editing.id}`
        : "/api/settings/competitors";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success(editing ? "Rakip guncellendi" : "Rakip eklendi");
      setDialogOpen(false);
      fetchCompetitors();
    } catch {
      toast.error("Islem basarisiz");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/settings/competitors/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Rakip silindi");
      fetchCompetitors();
    } catch {
      toast.error("Silme basarisiz");
    }
  };

  if (loading) return <Skeleton className="h-60" />;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Rakipler</CardTitle>
        <Button size="sm" onClick={openNew} className="bg-green-600 hover:bg-green-700">
          <Plus className="mr-1 h-4 w-4" />
          Yeni Rakip Ekle
        </Button>
      </CardHeader>
      <CardContent>
        {competitors.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">
            Henuz rakip eklenmemis.
          </p>
        ) : (
          <div className="space-y-3">
            {competitors.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-sm text-gray-900">{c.name}</p>
                  <div className="flex gap-3 mt-1 text-xs text-gray-500">
                    <span>{c.websiteUrl}</span>
                    <span>{c.instagramHandle}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(c)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(c.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Rakip Duzenle" : "Yeni Rakip Ekle"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Isim</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Aciklama</Label>
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Guclu Yanlari</Label>
                <Textarea
                  rows={2}
                  value={form.strengths}
                  onChange={(e) =>
                    setForm({ ...form, strengths: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Zayif Yanlari</Label>
                <Textarea
                  rows={2}
                  value={form.weaknesses}
                  onChange={(e) =>
                    setForm({ ...form, weaknesses: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Website URL</Label>
                <Input
                  value={form.websiteUrl}
                  onChange={(e) =>
                    setForm({ ...form, websiteUrl: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Instagram</Label>
                <Input
                  value={form.instagramHandle}
                  onChange={(e) =>
                    setForm({ ...form, instagramHandle: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Iptal
            </DialogClose>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Guncelle" : "Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ==================== CATEGORIES TAB ====================

function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", icon: "" });
  const [saving, setSaving] = useState(false);

  const fetchCategories = () => {
    fetch("/api/settings/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const defaultCats = categories.filter((c) => c.isDefault && !c.isCustom);
  const customCats = categories.filter((c) => c.isCustom);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", icon: "" });
    setDialogOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({ name: c.name, icon: c.icon || "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editing
        ? `/api/settings/categories/${editing.id}`
        : "/api/settings/categories";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          icon: form.icon || null,
          order: editing?.order ?? categories.length,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(editing ? "Kategori guncellendi" : "Kategori eklendi");
      setDialogOpen(false);
      fetchCategories();
    } catch {
      toast.error("Islem basarisiz");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/settings/categories/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Silinemedi");
      }
      toast.success("Kategori silindi");
      fetchCategories();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Silme basarisiz";
      toast.error(message);
    }
  };

  if (loading) return <Skeleton className="h-60" />;

  return (
    <div className="space-y-6">
      {/* Default Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-gray-400" />
            Varsayilan Kategoriler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {defaultCats.map((c) => (
              <Badge key={c.id} variant="secondary" className="text-sm py-1 px-3">
                {c.icon && <span className="mr-1">{c.icon}</span>}
                {c.name}
              </Badge>
            ))}
            {defaultCats.length === 0 && (
              <p className="text-sm text-gray-500">
                Varsayilan kategori bulunamadi.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Custom Categories */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Ozel Kategoriler</CardTitle>
          <Button size="sm" onClick={openNew} className="bg-green-600 hover:bg-green-700">
            <Plus className="mr-1 h-4 w-4" />
            Yeni Kategori
          </Button>
        </CardHeader>
        <CardContent>
          {customCats.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Henuz ozel kategori eklenmemis.
            </p>
          ) : (
            <div className="space-y-2">
              {customCats.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    {c.icon && <span>{c.icon}</span>}
                    <span className="text-sm font-medium text-gray-900">
                      {c.name}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(c)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(c.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Kategori Duzenle" : "Yeni Kategori Ekle"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Isim</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Ikon (Emoji, opsiyonel)</Label>
              <Input
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="Ornegin: 📦"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Iptal
            </DialogClose>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Guncelle" : "Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== SCAN SETTINGS TAB ====================

function ScanSettingsTab() {
  const [autoScan, setAutoScan] = useState(false);
  const [scanDay, setScanDay] = useState("1"); // Monday
  const [scanTime, setScanTime] = useState("09:00");

  // These settings would typically be stored in DB;
  // for now, this is a local-only UI placeholder.

  const handleSave = () => {
    toast.success("Tarama ayarlari kaydedildi");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tarama Ayarlari</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">
              Otomatik Tarama
            </p>
            <p className="text-xs text-gray-500">
              Belirtilen gun ve saatte otomatik tarama baslat
            </p>
          </div>
          <Switch checked={autoScan} onCheckedChange={setAutoScan} />
        </div>

        {autoScan && (
          <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-green-200">
            <div className="space-y-2">
              <Label>Tarama Gunu</Label>
              <Select value={scanDay} onValueChange={(v) => v && setScanDay(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Pazartesi</SelectItem>
                  <SelectItem value="2">Sali</SelectItem>
                  <SelectItem value="3">Carsamba</SelectItem>
                  <SelectItem value="4">Persembe</SelectItem>
                  <SelectItem value="5">Cuma</SelectItem>
                  <SelectItem value="6">Cumartesi</SelectItem>
                  <SelectItem value="0">Pazar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tarama Saati</Label>
              <Input
                type="time"
                value={scanTime}
                onChange={(e) => setScanTime(e.target.value)}
              />
            </div>
          </div>
        )}

        <Button
          onClick={handleSave}
          className="bg-green-600 hover:bg-green-700"
        >
          <Save className="mr-2 h-4 w-4" />
          Kaydet
        </Button>
      </CardContent>
    </Card>
  );
}

// ==================== MAIN SETTINGS PAGE ====================

export default function SettingsPage() {
  return (
    <Tabs defaultValue="brand" className="space-y-6">
      <TabsList>
        <TabsTrigger value="brand" className="gap-2">
          <Building2 className="h-4 w-4" />
          Marka Profili
        </TabsTrigger>
        <TabsTrigger value="competitors" className="gap-2">
          <Users className="h-4 w-4" />
          Rakipler
        </TabsTrigger>
        <TabsTrigger value="categories" className="gap-2">
          <Tags className="h-4 w-4" />
          Kategoriler
        </TabsTrigger>
        <TabsTrigger value="scan" className="gap-2">
          <Clock className="h-4 w-4" />
          Tarama Ayarlari
        </TabsTrigger>
      </TabsList>

      <TabsContent value="brand">
        <BrandTab />
      </TabsContent>
      <TabsContent value="competitors">
        <CompetitorsTab />
      </TabsContent>
      <TabsContent value="categories">
        <CategoriesTab />
      </TabsContent>
      <TabsContent value="scan">
        <ScanSettingsTab />
      </TabsContent>
    </Tabs>
  );
}
