
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Database, 
  BarChart3, 
  Activity, 
  Zap, 
  ChevronRight,
  TrendingUp,
  Users,
  ShoppingCart,
  Eye,
  ArrowUpRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Order, Product, Event } from "@/entities/all";

const demoFeatures = [
  {
    title: "多表联查与统计",
    description: "展示复杂的多表JOIN查询、聚合统计和数据分析能力",
    icon: Database,
    color: "from-blue-500 to-indigo-600",
    examples: ["用户订单统计", "销售趋势分析", "热销产品排行", "城市活跃度"],
    url: "MultiTableQueries"
  },
  {
    title: "高级数据处理",
    description: "窗口函数、交叉汇总、异常检测等高级SQL处理能力",
    icon: BarChart3,
    color: "from-emerald-500 to-teal-600",
    examples: ["窗口函数演示", "交叉汇总分析", "异常数据检测", "复杂筛选器"],
    url: "DataAnalysis"
  },
  {
    title: "可视化图表",
    description: "丰富的图表类型和交互式数据可视化展示",
    icon: Activity,
    color: "from-purple-500 to-pink-600",
    examples: ["多维度对比", "趋势预测", "图表联动", "仪表盘展示"],
    url: "Visualization"
  },
  {
    title: "高性能查询",
    description: "大数据量处理、并发查询和性能优化展示",
    icon: Zap,
    color: "from-orange-500 to-red-600",
    examples: ["百万数据分页", "复杂聚合查询", "并发压测", "性能报告"],
    url: "Performance"
  }
];

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
    <div className={`absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 bg-gradient-to-br ${color} rounded-full opacity-10 group-hover:opacity-20 transition-opacity`} />
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
        <div className={`p-2 rounded-lg bg-gradient-to-br ${color} bg-opacity-20`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      {trend && (
        <div className="flex items-center mt-2 text-sm text-emerald-600">
          <TrendingUp className="w-4 h-4 mr-1" />
          <span>{trend}</span>
        </div>
      )}
    </CardContent>
  </Card>
);

export default function HomePage() {
  const [stats, setStats] = useState({
    users: 0,
    orders: 0,
    products: 0,
    events: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Wrap each promise with .catch(() => []) to ensure Promise.all always resolves,
      // and returns an empty array for failed fetches.
      // The variables users, orders, products, events will hold arrays (empty if fetch failed).
      const [users, orders, products, events] = await Promise.all([
        User.list('', 1).catch(() => []),
        Order.list('', 1).catch(() => []),
        Product.list('', 1).catch(() => []),
        Event.list('', 1).catch(() => [])
      ]);
      
      // Update: Always use the fixed mock values for display stats, regardless of actual fetch results
      setStats({
        users: 12450,
        orders: 45678,
        products: 2340,
        events: 876543
      });
    } catch (error) {
      // If Promise.all still somehow fails (e.g., if .catch() itself throws, highly unlikely),
      // or for any other unexpected error during the try block, fallback to mock data.
      setStats({
        users: 12450,
        orders: 45678,
        products: 2340,
        events: 876543
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
            <Eye className="w-4 h-4" />
            <span>Base44 能力演示平台</span>
          </div>
          <h1 className="text-5xl font-bold text-slate-900 mb-6 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
            下一代数据平台
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            体验 Base44 在多表查询、数据分析、可视化展示和高性能处理方面的强大能力。
            通过交互式演示，深度了解现代数据平台的核心特性。
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <StatCard 
            title="注册用户" 
            value={stats.users.toLocaleString()} 
            icon={Users}
            color="from-blue-500 to-indigo-600"
            trend="+12.5%"
          />
          <StatCard 
            title="订单总数" 
            value={stats.orders.toLocaleString()} 
            icon={ShoppingCart}
            color="from-emerald-500 to-teal-600"
            trend="+8.2%"
          />
          <StatCard 
            title="商品数量" 
            value={stats.products.toLocaleString()} 
            icon={Database}
            color="from-purple-500 to-pink-600"
            trend="+15.7%"
          />
          <StatCard 
            title="用户行为" 
            value={(stats.events / 1000).toFixed(1) + "K"} 
            icon={Activity}
            color="from-orange-500 to-red-600"
            trend="+24.1%"
          />
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {demoFeatures.map((feature, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl font-bold text-slate-900 mb-2">
                      {feature.title}
                    </CardTitle>
                    <p className="text-slate-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2 mb-6">
                  {feature.examples.map((example, i) => (
                    <Badge key={i} variant="secondary" className="text-xs font-medium bg-slate-100 text-slate-600">
                      {example}
                    </Badge>
                  ))}
                </div>
                <Link to={createPageUrl(feature.url)}>
                  <Button className={`w-full group/btn bg-gradient-to-r ${feature.color} text-white hover:shadow-lg transition-all duration-300`}>
                    <span>开始演示</span>
                    <ChevronRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Start Section */}
        <div className="mt-20 text-center">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-12 border border-slate-200/50">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              立即体验 Base44 强大能力
            </h2>
            <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
              选择任意演示模块，查看实时数据处理结果。所有演示均基于真实业务场景设计，
              展现 Base44 在企业级应用中的卓越表现。
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to={createPageUrl("MultiTableQueries")}>
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg">
                  <Database className="w-5 h-5 mr-2" />
                  多表查询演示
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to={createPageUrl("Visualization")}>
                <Button size="lg" variant="outline" className="border-slate-300 hover:bg-slate-50">
                  <Activity className="w-5 h-5 mr-2" />
                  可视化展示
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
