"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Lightbulb,
  ArrowRightLeft,
  CheckCircle2,
  Zap,
  ExternalLink,
  Play,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  ideasThisWeek: number;
  convertedToTask: number;
  completedTasks: number;
  totalActiveIdeas: number;
  lastScan: {
    type: string;
    createdAt: string;
    summary: string | null;
  } | null;
  categoryDistribution: { category: string; count: number }[];
  topTasks: {
    id: string;
    title: string;
    status: string;
    priority: number | null;
    category: { id: string; name: string } | null;
  }[];
}

const statCards = [
  { key: "ideasThisWeek" as const, label: "Bu Hafta Fikirler", icon: Lightbulb, color: "text-green-600", bg: "bg-green-50" },
  { key: "convertedToTask" as const, label: "Goreve Donusen", icon: ArrowRightLeft, color: "text-blue-600", bg: "bg-blue-50" },
  { key: "completedTasks" as const, label: "Tamamlanan Gorevler", icon: CheckCircle2, color: "text-purple-600", bg: "bg-purple-50" },
  { key: "totalActiveIdeas" as const, label: "Aktif Fikirler", icon: Zap, color: "text-orange-600", bg: "bg-orange-50" },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-60" />
          <Skeleton className="h-60" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const maxCount = Math.max(...stats.categoryDistribution.map((c) => c.count), 1);

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((sc) => (
          <Card key={sc.key}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{sc.label}</p>
                  <p className="text-3xl font-bold mt-1">{stats[sc.key]}</p>
                </div>
                <div className={`p-3 rounded-lg ${sc.bg}`}>
                  <sc.icon className={`h-6 w-6 ${sc.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Last Scan Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Son Tarama Ozeti</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.lastScan ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                {stats.lastScan.summary || "Tarama ozeti bulunamadi."}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Badge variant="outline">{stats.lastScan.type}</Badge>
                <span>
                  {new Date(stats.lastScan.createdAt).toLocaleDateString("tr-TR")}
                </span>
              </div>
              <div className="flex gap-3 pt-2">
                <Link href="/scan">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Detayi Gor
                  </Button>
                </Link>
                <Link href="/scan">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    <Play className="mr-2 h-4 w-4" />
                    Yeni Tarama Baslat
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500 mb-3">Henuz tarama yapilmamis.</p>
              <Link href="/scan">
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  <Play className="mr-2 h-4 w-4" />
                  Ilk Taramayi Baslat
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Kategori Dagilimi</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.categoryDistribution.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Henuz fikir eklenmemis.
              </p>
            ) : (
              <div className="space-y-3">
                {stats.categoryDistribution.map((c) => (
                  <div key={c.category} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">{c.category}</span>
                      <span className="text-gray-500">{c.count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${(c.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Oncelikli Gorevler</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topTasks.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Aktif gorev bulunmuyor.
              </p>
            ) : (
              <div className="space-y-3">
                {stats.topTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {task.title}
                      </p>
                      {task.category && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {task.category.name}
                        </Badge>
                      )}
                    </div>
                    {task.priority && (
                      <span className="ml-2 text-xs font-medium text-gray-400">
                        P{task.priority}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
