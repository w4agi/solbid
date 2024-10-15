import { Suspense } from "react";
import AuthModals from "@/components/auth/auth-modals";  
import LandingPage from "@/components/landing-page";

export default function HomePage() {
  return (
    <>
      <LandingPage />  
      <Suspense fallback={<></>}>
        <AuthModals />
      </Suspense>
    </>
  );
}
