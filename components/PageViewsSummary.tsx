"use client"

import { motion } from "framer-motion"
import { Globe2, Eye, MapPin, Building2, Flag } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
import { usePageViewStats } from "@/hooks/usePageViewStats"

export function PageViewsSummary() {
  const { stats, loading } = usePageViewStats()

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-[#E2725B] animate-pulse font-medium">
          Loading page view stats...
        </p>
      </div>
    )

  if (!stats)
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">No data available.</p>
      </div>
    )

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="w-full max-w-lg mx-auto rounded-3xl overflow-hidden shadow-lg border border-[#f5f5f5] bg-gradient-to-br from-white via-[#fff9f5] to-[#fff5ec]">
        {/* Header */}
        <CardHeader className="bg-gradient-to-r from-[#E2725B] to-[#D4AF37] text-white p-5">
          <div className="flex items-center gap-3">
            <Eye className="w-6 h-6" />
            <CardTitle className="text-lg font-semibold tracking-wide">
              Waitlist Page View Stats
            </CardTitle>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="p-6 space-y-5">
          {/* Total Views */}
          <div className="flex items-center justify-between bg-[#FFF6EF] border border-[#f2e0d4] rounded-xl p-4">
            <div className="flex items-center gap-2">
              <Globe2 className="text-[#E2725B] w-5 h-5" />
              <span className="font-medium text-gray-800 text-sm sm:text-base">
                Total Page Views
              </span>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-[#E2725B]">
              {stats.totalViews}
            </span>
          </div>

          {/* Tabs for Country, Region & City */}
          <Tabs defaultValue="country" className="w-full">
            <TabsList className="grid grid-cols-3 w-full rounded-xl bg-[#FFF6EF] p-1">
              <TabsTrigger
                value="country"
                className="data-[state=active]:bg-[#E2725B] data-[state=active]:text-white text-gray-700 rounded-lg transition text-sm sm:text-base"
              >
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4" />
                  Country
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="region"
                className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-white text-gray-700 rounded-lg transition text-sm sm:text-base"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Region
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="city"
                className="data-[state=active]:bg-[#E2725B] data-[state=active]:text-white text-gray-700 rounded-lg transition text-sm sm:text-base"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  City
                </div>
              </TabsTrigger>
            </TabsList>

            {/* ✅ Country Tab */}
            <TabsContent value="country" className="mt-4">
              <ScrollArea className="h-48 rounded-xl border border-[#f5f5f5] bg-white/70 p-3">
                {stats.countries && stats.countries.length > 0 ? (
                  <ul className="space-y-2 text-sm sm:text-base">
                    {stats.countries.map((c) => (
                      <li
                        key={c.country}
                        className="flex justify-between items-center bg-[#FFF5EF]/70 rounded-lg px-4 py-2 hover:bg-[#FFEDE2] transition"
                      >
                        <span className="text-gray-700 font-medium">
                          {c.country}
                        </span>
                        <span className="text-[#E2725B] font-semibold">
                          {c.count}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No country data available.</p>
                )}
              </ScrollArea>
            </TabsContent>

            {/* ✅ Region Tab */}
            <TabsContent value="region" className="mt-4">
              <ScrollArea className="h-48 rounded-xl border border-[#f5f5f5] bg-white/70 p-3">
                {stats.regions.length > 0 ? (
                  <ul className="space-y-2 text-sm sm:text-base">
                    {stats.regions.map((r) => (
                      <li
                        key={r.region}
                        className="flex justify-between items-center bg-[#FFF5EF]/70 rounded-lg px-4 py-2 hover:bg-[#FFEDE2] transition"
                      >
                        <span className="text-gray-700 font-medium">
                          {r.region}
                        </span>
                        <span className="text-[#D4AF37] font-semibold">
                          {r.count}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No regional data available.</p>
                )}
              </ScrollArea>
            </TabsContent>

            {/* ✅ City Tab */}
            <TabsContent value="city" className="mt-4">
              <ScrollArea className="h-48 rounded-xl border border-[#f5f5f5] bg-white/70 p-3">
                {stats.cities.length > 0 ? (
                  <ul className="space-y-2 text-sm sm:text-base">
                    {stats.cities.map((c) => (
                      <li
                        key={c.city}
                        className="flex justify-between items-center bg-[#FFF5EF]/70 rounded-lg px-4 py-2 hover:bg-[#FFEDE2] transition"
                      >
                        <span className="text-gray-700 font-medium">
                          {c.city}
                        </span>
                        <span className="text-[#D4AF37] font-semibold">
                          {c.count}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No city data available.</p>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  )
}
