import { SkeletonLoader } from "./skeleton-loader"

export function NavbarSkeleton() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-md">
      <nav className="container mx-auto px-4 sm:px-12 py-4 flex justify-between items-center">
        <SkeletonLoader className="w-40 h-8" />
        <div className="hidden md:flex space-x-6">
          <SkeletonLoader className="w-20 h-10" />
          <SkeletonLoader className="w-20 h-10" />
          <SkeletonLoader className="w-24 h-10" />
          <SkeletonLoader className="w-24 h-10" />
        </div>
        <SkeletonLoader className="w-8 h-8 md:hidden" />
      </nav>
    </header>
  )
}