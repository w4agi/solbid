"use client"
import { Suspense } from "react";
import LoginModal from "@/components/auth/login-modal";
import SignupModal from "@/components/auth/signup-modal";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import ForgotPassword from "@/components/auth/forgot-password";

function AuthContent() {
  const session = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const modal = searchParams.get('modal');

  if (session.status === "authenticated") {
    router.push("/");
    return null;
  }
  else if (session.status == "unauthenticated" && modal === null) {
    router.push("/");
    return null;
  }
  
  return (
    <>
      {modal === 'login' && <LoginModal />}
      {modal === 'signup' && <SignupModal />}
      {modal === 'forgot-password' && <ForgotPassword />}
    </>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<></>}>
      <AuthContent />
    </Suspense>
  );
}