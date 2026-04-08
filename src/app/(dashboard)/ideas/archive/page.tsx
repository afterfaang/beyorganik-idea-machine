"use client";

import { useEffect, useState } from "react";
import { Archive, RotateCcw, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

interface Idea {
  id: string;
  title: string;
  description: string;
  detailLevel: string;
  category: { id: string; name: string };
  createdAt: string;
}

export default function ArchivePage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchArchived = () => {
    fetch("/api/ideas?status=ARCHIVED&limit=100")
      .then((res) => res.json())
      .then((data) => setIdeas(data.ideas || []))
      .catch(() => toast.error("Arsiv yuklenemedi"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchArchived();
  }, []);

  const handleRestore = async (id: string) => {
    try {
      const res = await fetch(`/api/ideas/${id}/restore`, { method: "PATCH" });
      if (!res.ok) throw new Error();
      toast.success("Fikir geri getirildi");
      fetchArchived();
    } catch {
      toast.error("Geri getirme basarisiz");
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/ideas/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Fikir kalici olarak silindi");
      fetchArchived();
    } catch {
      toast.error("Silme basarisiz");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Archive className="h-5 w-5 text-gray-400" />
        <h2 className="text-lg font-semibold text-gray-900">
          Arsivlenen Fikirler
        </h2>
        <Badge variant="outline">{ideas.length}</Badge>
      </div>

      {ideas.length === 0 ? (
        <div className="text-center py-12">
          <Archive className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">Arsivde fikir bulunmuyor.</p>
        </div>
      ) : (
        ideas.map((idea) => (
          <Card key={idea.id}>
            <CardContent className="py-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm text-gray-900 truncate">
                  {idea.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {idea.description}
                </p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {idea.category.name}
                  </Badge>
                  <span className="text-xs text-gray-400">
                    {new Date(idea.createdAt).toLocaleDateString("tr-TR")}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRestore(idea.id)}
                >
                  <RotateCcw className="mr-1 h-3 w-3" />
                  Geri Getir
                </Button>
                <Dialog>
                  <DialogTrigger
                    render={
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      />
                    }
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Kalici Sil
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Fikri Kalici Olarak Sil</DialogTitle>
                      <DialogDescription>
                        &quot;{idea.title}&quot; fikrini kalici olarak silmek
                        istediginize emin misiniz? Bu islem geri alinamaz.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose
                        render={<Button variant="outline" />}
                      >
                        Iptal
                      </DialogClose>
                      <Button
                        variant="destructive"
                        onClick={() => handleDelete(idea.id)}
                        disabled={deletingId === idea.id}
                      >
                        {deletingId === idea.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Evet, Sil
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
