"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/ideas": "Fikirler",
  "/ideas/archive": "Arsiv",
  "/tasks": "Gorev Tahtasi",
  "/scan": "Tarama",
  "/settings": "Ayarlar",
};

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const title =
    pageTitles[pathname] ||
    (pathname.startsWith("/scan/") ? "Tarama Detayi" : "Beyorganik");

  return (
    <header className="flex items-center justify-between h-16 px-8 bg-white border-b border-gray-200">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      {session?.user?.name && (
        <p className="text-sm text-gray-500">
          Merhaba, <span className="font-medium text-gray-700">{session.user.name}</span>
        </p>
      )}
    </header>
  );
}
