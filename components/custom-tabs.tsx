"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

interface CustomTabsProps {
  defaultValue: string
  className?: string
  items: {
    value: string
    label: string
    description: string
    icon: React.ReactNode
    content: React.ReactNode
  }[]
}

export function CustomTabs({ defaultValue, className, items }: CustomTabsProps) {
  return (
    <Tabs defaultValue={defaultValue} className={cn("w-full", className)}>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar (desktop) / Top bar (mobile) */}
        <TabsList
          className={cn(
            "flex md:flex-col w-full md:w-64 shrink-0 bg-transparent md:bg-white border md:rounded-lg p-0 md:p-2 space-x-2 md:space-x-0 md:space-y-1 overflow-x-auto"
          )}
        >
          {items.map((item) => (
            <TabsTrigger
              key={item.value}
              value={item.value}
              className={cn(
                "flex items-start gap-3 w-full px-3 py-3 rounded-md text-left transition-all",
                "data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700",
                "hover:bg-gray-50"
              )}
            >
              <div className="flex-shrink-0 mt-0.5 text-gray-500 data-[state=active]:text-indigo-600">
                {item.icon}
              </div>
              <div className="flex flex-col">
                <span className="font-medium">{item.label}</span>
                <span className="text-xs text-gray-500 hidden md:block">
                  {item.description}
                </span>
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab Content */}
        <div className="flex-1">
          {items.map((item) => (
            <TabsContent key={item.value} value={item.value}>
              {item.content}
            </TabsContent>
          ))}
        </div>
      </div>
    </Tabs>
  )
}
