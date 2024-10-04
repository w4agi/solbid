"use client";

 
import SignupModal from "./signup-modal";
 

export default function AuthScreen() {
  ;
  return (
    <div className=" w-full h-full flex items-center justify-center gap-5 bg-gradient-to-b from-purple-900 to-gray-900">
      <div className="w-full md:h-auto md:w-[420px] px-4">
        <SignupModal/>
        </div>
    </div>
  );
}