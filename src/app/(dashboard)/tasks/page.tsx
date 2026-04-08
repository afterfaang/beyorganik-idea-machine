"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { Loader2, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: number | null;
  order: number;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  ideaId: string | null;
  idea: { id: string; title: string } | null;
  createdAt: string;
}

type Column = {
  id: string;
  title: string;
  tasks: Task[];
};

const COLUMNS: { id: string; title: string }[] = [
  { id: "TODO", title: "Yapilacak" },
  { id: "IN_PROGRESS", title: "Devam Ediyor" },
  { id: "DONE", title: "Tamamlandi" },
];

const priorityColors: Record<number, string> = {
  1: "bg-gray-200",
  2: "bg-blue-200",
  3: "bg-yellow-200",
  4: "bg-orange-200",
  5: "bg-red-200",
};

export default function TasksPage() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchTasks = useCallback(() => {
    fetch("/api/tasks")
      .then((res) => res.json())
      .then((tasks: Task[]) => {
        const cols: Column[] = COLUMNS.map((col) => ({
          ...col,
          tasks: tasks
            .filter((t) => t.status === col.id)
            .sort((a, b) => a.order - b.order),
        }));
        setColumns(cols);
      })
      .catch(() => toast.error("Gorevler yuklenemedi"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    // Optimistic update
    const newColumns = [...columns];
    const srcCol = newColumns.find((c) => c.id === source.droppableId);
    const dstCol = newColumns.find((c) => c.id === destination.droppableId);
    if (!srcCol || !dstCol) return;

    const [moved] = srcCol.tasks.splice(source.index, 1);
    moved.status = destination.droppableId;
    dstCol.tasks.splice(destination.index, 0, moved);

    // Recalculate orders
    dstCol.tasks.forEach((t, i) => (t.order = i));
    if (srcCol !== dstCol) {
      srcCol.tasks.forEach((t, i) => (t.order = i));
    }

    setColumns(newColumns);

    try {
      await fetch(`/api/tasks/${draggableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: destination.droppableId,
          order: destination.index,
        }),
      });
    } catch {
      toast.error("Gorev tasinamadi");
      fetchTasks();
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setEditDescription(task.description || "");
  };

  const handleSaveDescription = async () => {
    if (!selectedTask) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: editDescription }),
      });
      if (!res.ok) throw new Error();
      toast.success("Aciklama guncellendi");
      fetchTasks();
      setSelectedTask(null);
    } catch {
      toast.error("Guncelleme basarisiz");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Gorev silindi");
      fetchTasks();
      setSelectedTask(null);
    } catch {
      toast.error("Silme basarisiz");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
          {columns.map((col) => (
            <div key={col.id} className="flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900">{col.title}</h2>
                <Badge variant="outline">{col.tasks.length}</Badge>
              </div>
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 rounded-lg p-3 space-y-2 min-h-[200px] transition-colors ${
                      snapshot.isDraggingOver
                        ? "bg-green-50 border-2 border-dashed border-green-300"
                        : "bg-gray-100"
                    }`}
                  >
                    {col.tasks.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => handleTaskClick(task)}
                            className={`bg-white rounded-lg p-3 shadow-sm border cursor-pointer transition-shadow hover:shadow-md ${
                              snapshot.isDragging
                                ? "shadow-lg ring-2 ring-green-300"
                                : "border-gray-200"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-sm font-medium text-gray-900 leading-snug">
                                {task.title}
                              </h3>
                              {task.priority && (
                                <span
                                  className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                    priorityColors[task.priority] || "bg-gray-200"
                                  }`}
                                >
                                  {task.priority}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              {task.category && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {task.category.name}
                                </Badge>
                              )}
                              <span className="text-xs text-gray-400 ml-auto">
                                {new Date(task.createdAt).toLocaleDateString(
                                  "tr-TR"
                                )}
                              </span>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Task Detail Dialog */}
      <Dialog
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              {selectedTask?.category && (
                <Badge variant="secondary">{selectedTask.category.name}</Badge>
              )}
              {selectedTask?.priority && (
                <Badge variant="outline">Oncelik: {selectedTask.priority}</Badge>
              )}
            </div>
            {selectedTask?.idea && (
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                Kaynak fikir: {selectedTask.idea.title}
              </div>
            )}
            <div>
              <Label className="text-sm">Aciklama</Label>
              <Textarea
                className="mt-1"
                rows={4}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Gorev aciklamasi..."
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteTask}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Sil
            </Button>
            <div className="flex gap-2">
              <DialogClose render={<Button variant="outline" />}>
                Iptal
              </DialogClose>
              <Button
                onClick={handleSaveDescription}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Kaydet
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
