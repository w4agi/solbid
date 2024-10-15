import { SkeletonLoader } from "./skeleton-loader"

export function LandingPageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
      
      <main className="relative z-10 container mx-auto px-4 py-24">
        <div className="max-w-10/12 mx-auto bg-slate-800/50 backdrop-blur-md rounded-3xl shadow-2xl p-8 md:p-12">
          <section className="text-center mb-24">
            <SkeletonLoader className="mx-auto w-3/4 h-16 mb-6" />
            <SkeletonLoader className="mx-auto w-2/3 h-8 mb-12" />
            <SkeletonLoader className="mx-auto w-48 h-14 rounded-full" />
          </section>

          <section className="mb-24">
            <SkeletonLoader className="mx-auto w-1/2 h-10 mb-8" />
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <SkeletonLoader className="w-full h-32 mb-6" />
                <div className="flex flex-col sm:flex-row justify-start space-y-4 sm:space-y-0 sm:space-x-6">
                  <SkeletonLoader className="w-40 h-12 rounded-full" />
                  <SkeletonLoader className="w-40 h-12 rounded-full" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                {[...Array(4)].map((_, index) => (
                  <SkeletonLoader key={index} className="h-40 rounded-xl" />
                ))}
              </div>
            </div>
          </section>

          <section className="grid md:grid-cols-3 gap-8 mb-24">
            {[...Array(3)].map((_, index) => (
              <SkeletonLoader key={index} className="h-64 rounded-2xl" />
            ))}
          </section>

          <section className="text-center mb-24">
            <SkeletonLoader className="mx-auto w-1/2 h-10 mb-6" />
            <SkeletonLoader className="mx-auto w-2/3 h-8 mb-8" />
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <SkeletonLoader className="w-48 h-14 rounded-full" />
              <SkeletonLoader className="w-48 h-14 rounded-full" />
            </div>
          </section>
        </div>
      </main>

      <footer className="relative z-10 container mx-auto px-4 py-8 text-center">
        <SkeletonLoader className="mx-auto w-64 h-6" />
      </footer>
    </div>
  )
}