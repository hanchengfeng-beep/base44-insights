import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Activity, 
  Database, 
  BarChart3, 
  Zap,
  Home,
  Sparkles,
  BookCopy, // 新增图标
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "演示首页",
    url: createPageUrl("Home"),
    icon: Home,
  },
  {
    title: "多表联查",
    url: createPageUrl("MultiTableQueries"),
    icon: Database,
  },
  {
    title: "数据分析",
    url: createPageUrl("DataAnalysis"),
    icon: BarChart3,
  },
  {
    title: "可视化图表",
    url: createPageUrl("Visualization"),
    icon: Activity,
  },
  {
    title: "高性能测试",
    url: createPageUrl("Performance"),
    icon: Zap,
  },
  {
    title: "定时任务日志",
    url: createPageUrl("CronLogsViewer"),
    icon: BookCopy,
  },
  {
    title: "WebSocket 测试",
    url: createPageUrl("WebSocketTest"),
    icon: Activity,
  },
  {
    title: "实时订阅",
    url: createPageUrl("RealtimeSubscription"),
    icon: Zap,
  }
];

export default function Layout({ children }) {
  const location = useLocation();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-blue-50">
        <style>{`
          :root {
            --primary: 213 94% 68%;
            --primary-foreground: 0 0% 100%;
            --secondary: 210 40% 95%;
            --accent: 210 40% 90%;
            --muted: 210 40% 98%;
            --border: 214 32% 91%;
          }
        `}</style>
        
        <Sidebar className="border-r border-slate-200/60 bg-white/80 backdrop-blur-xl">
          <SidebarHeader className="border-b border-slate-200/60 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-lg">Base44 演示</h2>
                <p className="text-xs text-slate-500 font-medium">数据平台能力展示</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-4">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2 mb-2">
                功能演示
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 rounded-lg group ${
                          location.pathname === item.url 
                            ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' 
                            : 'text-slate-600'
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-3 py-3 font-medium">
                          <item.icon className={`w-5 h-5 transition-colors ${
                            location.pathname === item.url ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-500'
                          }`} />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-8">
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2 mb-2">
                系统信息
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="px-3 py-2 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-slate-600">系统状态正常</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Database className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">数据已就绪</span>
                  </div>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4 md:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200" />
              <h1 className="text-xl font-bold text-slate-900">Base44 演示平台</h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}