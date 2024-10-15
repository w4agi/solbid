import { cn } from "@/lib/utils"

interface SkeletonLoaderProps {
  className?: string
}

export function SkeletonLoader({ className }: SkeletonLoaderProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-slate-700/50",
        className
      )}
    />
  )
}