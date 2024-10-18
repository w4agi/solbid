import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Trophy, Award, Clock, CircleDollarSign, Users, RedoDot } from 'lucide-react'

export function LoadingSkeleton() {
  return (
    <div className="container mx-auto w-11/12 p-4 mt-12 min-h-screen text-slate-200">
      
      <Card className="bg-slate-900 text-slate-200 border-2 border-slate-700 pb-16">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-700">
            {[0, 1].map((_, index) => (
              <div key={index} className="p-6">
                <CardHeader className="px-0">
                  <CardTitle className="flex items-center text-slate-100">
                    {index === 0 ? <Trophy className="mr-2 text-green-500" /> : <Award className="mr-2 text-red-600" />}
                    <Skeleton className="h-6 w-24" />
                  </CardTitle>
                </CardHeader>
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div>
                    <Skeleton className="h-8 w-32 mb-2" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 text-slate-200 border-b-[0px] border-[0.5px] rounded-sm border-slate-700 -mt-6 pb-12">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-700">
            {[
              { icon: Clock, title: "Game Duration" },
              { icon: CircleDollarSign, title: "Prize Pool" },
              { icon: Users, title: "Game Stats" }
            ].map((item, index) => (
              <div key={index} className="p-6">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="flex items-center text-slate-100 text-lg">
                    <item.icon className="mr-2 text-blue-500" />
                    <Skeleton className="h-6 w-32" />
                  </CardTitle>
                </CardHeader>
                <div>
                  <Skeleton className="h-6 w-24 mb-2" />
                  <Skeleton className="h-4 w-40 mb-1" />
                  <Skeleton className="h-4 w-36" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="bg-slate-900 text-slate-200 border-t-[0.5px] border-slate-700 rounded-xl -mt-12">
        <CardHeader>
          <CardTitle className="flex items-center text-slate-100 text-lg">
            <Skeleton className="h-6 w-24 mr-2" />
            <RedoDot className="text-blue-700" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4 pb-2 border-b border-slate-700 font-semibold text-slate-300">
              {['User', 'Time', 'Bet Amount', 'Royalty Earned'].map((header, index) => (
                <Skeleton key={index} className="h-4 w-16" />
              ))}
            </div>
            
            {[...Array(5)].map((_, index) => (
              <div key={index} className="grid grid-cols-4 gap-4 py-2 border-b-[0.5px] border-slate-700 items-center">
                <div className="flex items-center space-x-2">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </div>
    </div>
  )
}