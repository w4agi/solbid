'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
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
import { Loader2 } from "lucide-react"
import toast from "react-hot-toast"
import { FcGoogle } from "react-icons/fc"
import Link from "next/link"
import { loginSchema, LoginFormData, validateForm } from "@/schema/credentials-schema"

export default function LoginModal() {
  const [isOpen, setIsOpen] = useState(true)
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState<Partial<LoginFormData>>({})
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const { isValid, errors } = validateForm(loginSchema, formData)
    if (!isValid) {
      setErrors(errors)
      return
    }
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      })
      if (result?.error) {
        if (result.error === "401") {
          toast.error("Incorrect password")
        } else if (result.error === "404") {
          toast.error("User does not exist, please sign up")
        } else {
          throw new Error(result.error)
        }
      } else {
        toast.success("Login Successful")
        router.push('/home')
      }
    } catch{
      toast.error("Login Failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoadingGoogle(true)
    try {
      await signIn("google", { callbackUrl: '/home' })
    } catch{
      toast.error("Login Failed")
    } finally {
      setIsLoadingGoogle(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => router.push('/')}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Login to your account</DialogTitle>
          <DialogDescription>
            Enter your credentials below to login or continue with Google.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter email"
              required
              value={formData.email}
              onChange={handleInputChange}
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter password"
              required
              value={formData.password}
              onChange={handleInputChange}
            />
            {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
          </div>
          <div className="flex justify-between items-center">
            <Link href="?modal=forgot-password" className="text-sm text-primary hover:underline">
              Forgot password?
            </Link>
            <Link href="?modal=signup" className="text-sm text-primary hover:underline">
              Don't have an account? Sign up
            </Link>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Login
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
          disabled={isLoadingGoogle || isLoading}
          className="w-full"
          onClick={handleGoogleLogin}
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