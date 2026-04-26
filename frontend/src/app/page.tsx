"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { KanbanBoard } from "@/components/KanbanBoard";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted && !isAuthenticated) {
      router.replace("/login");
    }
  }, [hasMounted, isAuthenticated, router]);

  if (!hasMounted || !isAuthenticated) {
    return null;
  }

  return <KanbanBoard onLogout={logout} />;
}
