"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AuthScreen from "@/components/auth/auth-screen";

export default function AuthPage( ) {
  const session = useSession();
  const router = useRouter();

  if (session.status === "authenticated") {
    return router.push("/");
  }
  return <AuthScreen />;
}