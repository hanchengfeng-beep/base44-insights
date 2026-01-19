
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  TrendingUp, 
  Users, 
  ShoppingBag,
  MapPin,
  Clock,
  Server,
  RefreshCw, // 新增图标
  Loader2 // 新增图标
} from "lucide-react";
import { base44 } from "@/api/base44Client";

import QueryExample from "../components/demo/QueryExample";
import DataTable from "../components/demo/DataTable";
import ChartDisplay from "../components/demo/ChartDisplay";

const queryExamples = [
  {
    id: "user_orders",
    title: "用户订单统计",
    description: "调用后端函数，在服务器端进行三表联查，统计用户订单信息。",
    icon: Users,
    color: "from-blue-500 to-indigo-600",
    sql: `/* 后端函数 (Python/SQL) 逻辑示意 */
SELECT u.username, u.city, COUNT(o.id), SUM(o.total_amount)
FROM User u JOIN Order o ON u.id = o.user_id
GROUP BY u.id
ORDER BY SUM(o.total_amount) DESC
LIMIT 10;`,
    chartType: "bar"
  },
  {
    id: "sales_trend",
    title: "销售趋势分析", 
    description: "调用后端函数，在服务器端按月聚合GMV。",
    icon: TrendingUp,
    color: "from-emerald-500 to-teal-600",
    sql: `/* 后端函数 (Python/SQL) 逻辑示意 */
SELECT DATE_FORMAT(order_date, '%Y-%m') as month, SUM(total_amount)
FROM Order
GROUP BY month
ORDER BY month DESC;`,
    chartType: "line"
  },
  {
    id: "hot_products",
    title: "热销产品排行",
    description: "调用后端函数，在服务器端联查订单与商品，统计销量排行。",
    icon: ShoppingBag,
    color: "from-purple-500 to-pink-600", 
    sql: `/* 后端函数 (Python/SQL) 逻辑示意 */
SELECT p.name, SUM(oi.quantity), SUM(oi.subtotal)
FROM Product p JOIN OrderItem oi ON p.id = oi.product_id
GROUP BY p.id
ORDER BY SUM(oi.quantity) DESC
LIMIT 10;`,
    chartType: "pie"
  },
  {
    id: "city_activity",
    title: "城市用户活跃度",
    description: "调用后端函数，在服务器端分析各城市用户活跃度。",
    icon: MapPin,
    color: "from-orange-500 to-red-600",
    sql: `/* 后端函数 (Python/SQL) 逻辑示意 */
SELECT u.city, COUNT(DISTINCT u.id), COUNT(o.id)
FROM User u LEFT JOIN Order o ON u.id = o.user_id
GROUP BY u.city
ORDER BY COUNT(o.id) DESC;`,
    chartType: "scatter"
  }
];

export default function MultiTableQueriesPage() {
  const [selectedExample, setSelectedExample] = useState(queryExamples[0]);
  const [queryResult, setQueryResult] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false); // 新增状态，用于手动刷新
  const [activeView, setActiveView] = useState("table");
  const [responseTime, setResponseTime] = useState(0);

  const executeQuery = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      setIsLoading(true);
      setQueryResult([]);
    }
    const startTime = performance.now();
    try {
      // 关键：调用真实的后端函数 getAnalytics
      const response = await base44.functions.invoke('getAnalytics', { query_id: selectedExample.id });
      
      const endTime = performance.now();
      if (!isSilent) {
        setResponseTime(Math.round(endTime - startTime));
      }
      
      // 后端函数直接返回最终数据
      setQueryResult(response.data || []);

    } catch (error) {
      console.error("查询执行失败:", error);
      setQueryResult([]);
      const endTime = performance.now();
      if (!isSilent) {
        setResponseTime(Math.round(endTime - startTime));
      }
    }
    if (!isSilent) {
      setIsLoading(false);
    }
  }, [selectedExample.id]);

  useEffect(() => {
    executeQuery();
  }, [executeQuery]);

  // 新增：手动刷新分析数据的函数
  const handleRefreshAnalytics = async () => {
    setIsRefreshing(true);
    try {
      // 调用慢速的刷新函数
      await base44.functions.invoke('refreshAnalytics', {});
      // 刷新成功后，静默地重新加载当前视图的数据
      await executeQuery(true);
      alert('分析数据刷新成功！');
    } catch (error) {
      console.error("手动刷新失败:", error);
      alert('刷新失败，请查看控制台日志。');
    }
    setIsRefreshing(false);
  };


  const exportData = () => {
    const csv = [
      Object.keys(queryResult[0] || {}).join(','),
      ...queryResult.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedExample.id}_export.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">多表联查与统计分析</h1>
            <p className="text-slate-600">通过调用高性能后端函数，在服务器端完成复杂数据聚合与分析。</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleRefreshAnalytics}
              disabled={isRefreshing}
              className="bg-white"
            >
              {isRefreshing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {isRefreshing ? '正在刷新...' : '刷新分析数据'}
            </Button>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 px-3 py-1 border border-emerald-200">
              <Server className="w-4 h-4 mr-2" />
              后端函数计算
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* 左侧示例选择器 */}
          <div className="lg:col-span-1">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">查询示例</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {queryExamples.map((example) => (
                  <div
                    key={example.id}
                    onClick={() => setSelectedExample(example)}
                    className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedExample.id === example.id
                        ? 'bg-gradient-to-r ' + example.color + ' text-white shadow-lg'
                        : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <example.icon className="w-5 h-5 mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-sm">{example.title}</h3>
                        <p className={`text-xs mt-1 ${
                          selectedExample.id === example.id ? 'text-white/80' : 'text-slate-500'
                        }`}>
                          {example.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* 右侧查询结果展示 */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* SQL查询展示 */}
              <QueryExample
                title={selectedExample.title}
                description={""}
                sql={selectedExample.sql}
                onExecute={executeQuery}
                isLoading={isLoading}
              />

              {/* 结果展示 */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-semibold">查询结果</CardTitle>
                    <div className="flex gap-4 items-center">
                      {!isLoading && (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Clock className="w-4 h-4" />
                          <span>响应时间: {responseTime}ms</span>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportData}
                        disabled={queryResult.length === 0 || isLoading}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        导出CSV
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeView} onValueChange={setActiveView}>
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="table">表格视图</TabsTrigger>
                      <TabsTrigger value="chart">图表视图</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="table">
                      <DataTable data={queryResult} isLoading={isLoading} />
                    </TabsContent>
                    
                    <TabsContent value="chart">
                      <ChartDisplay 
                        data={queryResult} 
                        chartType={selectedExample.chartType}
                        isLoading={isLoading}
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
