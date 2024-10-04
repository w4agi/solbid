"use client"

import { useState } from "react"
import { useRouter} from "next/navigation"
import { signIn } from "next-auth/react"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2} from "lucide-react"
import toast from "react-hot-toast"
import { FcGoogle } from "react-icons/fc";
import {signupSchema } from "@/schema/credentials-schema"

type SignupFormData = z.infer<typeof signupSchema>

export default function SignupModal() {
  const [isOpen, setIsOpen] = useState(true)
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<SignupFormData>({
    email: "",
    name: "",
    password: "",
  })
  const [errors, setErrors] = useState<Partial<SignupFormData>>({})
  const router = useRouter()

  if (!isOpen) {
    router.push("/")
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const validateForm = (): boolean => {
    try {
      signupSchema.parse(formData)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<SignupFormData> = {}
        error.errors.forEach((err) => {
          if (err.path[0] in formData) {
            newErrors[err.path[0] as keyof SignupFormData] = err.message
          }
        })
        setErrors(newErrors)
      }
      return false
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;
    alert("hello")
  
    setIsLoading(true);
  
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        name: formData.name,
        password: formData.password,
        isSignUp: "true"
      });
  
      if (result?.error) {
        throw new Error(result.error);
      }
      toast.success("Signup Successful")
      setIsOpen(false);
    } catch (error) {
       toast.error("Signup Failed")
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsLoadingGoogle(true)
    try {
      const result = await signIn("google", { redirect: false })
      console.log("result", result)
      if (result?.error) {
        toast.error("Signup Failed")
        console.log("Error in google signin", result.error)
      } else {
        toast.success("Signup Successful")
        setIsOpen(false)
        router.push('/')
      }
    } catch (error) {
      toast.error("Signup Failed")
      console.log("Error in google signin", error)
    } finally {
      setIsLoadingGoogle(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create an account</DialogTitle>
          <DialogDescription>
            Enter your details below to create your account or continue with Google.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="m@example.com"
              required
              value={formData.email}
              onChange={handleInputChange}
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">name</Label>
            <Input
              id="name"
              name="name"
              placeholder="johndoe"
              required
              value={formData.name}
              onChange={handleInputChange}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleInputChange}
            />
            {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign Up
          </Button>
        </form>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          type="button"
          disabled={isLoading}
          className="w-full"
          onClick={handleGoogleSignup}
        >
          {isLoadingGoogle ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FcGoogle className="mr-2 h-4 w-4" />
          )}{" "}
          Google
        </Button>
      </DialogContent>
    </Dialog>
  )
}