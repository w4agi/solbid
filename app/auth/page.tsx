"use client";   
import LoginModal from "@/components/auth/login-modal";
import SignupModal from "@/components/auth/signup-modal";
import { useSession } from "next-auth/react";
import {useRouter, useSearchParams } from "next/navigation";
import ForgotPassword from "@/components/auth/forgot-password";
 

export default function AuthPage() {
  const session = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const modal = searchParams.get('modal')
 
  if (session.status === "authenticated") {
    router.push("/");
  }
  else if (session.status == "unauthenticated" && modal === null) {
    router.push("/");
  }
  
  return (
    <>
      {modal === 'login' && <LoginModal />}
      {modal === 'signup' && <SignupModal />}
      {modal === 'forgot-password' && <ForgotPassword />}
    </>
  )
}
 