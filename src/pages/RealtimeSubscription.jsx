import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Radio, Plus, Trash2, Edit, CheckCircle, Zap } from 'lucide-react';
import { format } from 'date-fns';

export default function RealtimeSubscription() {
  const [events, setEvents] = useState([]);
  const [products, setProducts] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    // 初始加载产品列表
    loadProducts();

    // 订阅实时更新
    const unsubscribe = base44.entities.Product.subscribe((event) => {
      console.log('实时事件:', event);
      
      // 记录事件
      setEvents(prev => [{
        id: Date.now() + Math.random(),
        type: event.type,
        entityId: event.id,
        data: event.data,
        timestamp: new Date().toISOString()
      }, ...prev].slice(0, 20)); // 只保留最近20条

      // 根据事件类型更新产品列表
      if (event.type === 'create') {
        setProducts(prev => [event.data, ...prev]);
      } else if (event.type === 'update') {
        setProducts(prev => prev.map(p => p.id === event.id ? event.data : p));
      } else if (event.type === 'delete') {
        setProducts(prev => prev.filter(p => p.id !== event.id));
      }
    });

    setIsSubscribed(true);

    // 清理订阅
    return () => {
      unsubscribe();
      setIsSubscribed(false);
    };
  }, []);

  const loadProducts = async () => {
    try {
      const data = await base44.entities.Product.list('-created_date', 10);
      setProducts(data);
    } catch (error) {
      console.error('加载产品失败:', error);
    }
  };

  const createProduct = async () => {
    if (!newProductName.trim()) return;
    
    setIsCreating(true);
    try {
      await base44.entities.Product.create({
        name: newProductName,
        category: 'electronics',
        price: Math.floor(Math.random() * 1000) + 100,
        stock: Math.floor(Math.random() * 100) + 10,
        description: '实时订阅测试产品'
      });
      setNewProductName('');
    } catch (error) {
      console.error('创建产品失败:', error);
      alert('创建失败，请查看控制台');
    } finally {
      setIsCreating(false);
    }
  };

  const deleteProduct = async (id) => {
    try {
      await base44.entities.Product.delete(id);
    } catch (error) {
      console.error('删除产品失败:', error);
      alert('删除失败，请查看控制台');
    }
  };

  const updateProductPrice = async (id, currentPrice) => {
    const newPrice = currentPrice + Math.floor(Math.random() * 100) - 50;
    try {
      await base44.entities.Product.update(id, { price: Math.max(1, newPrice) });
    } catch (error) {
      console.error('更新产品失败:', error);
      alert('更新失败，请查看控制台');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="shadow-xl">
          <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                  <Radio className="w-8 h-8 text-green-600" />
                  实时订阅（Real-time Subscription）
                </CardTitle>
                <CardDescription className="mt-2 text-slate-600">
                  Base44 内置的实时数据更新方案 - 无需轮询，零延迟响应
                </CardDescription>
              </div>
              <Badge variant={isSubscribed ? "default" : "secondary"} className="text-sm px-3 py-2">
                {isSubscribed ? <Zap className="w-4 h-4 mr-1" /> : null}
                {isSubscribed ? '订阅中' : '未订阅'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800 font-semibold">Base44 实时订阅原理</AlertTitle>
              <AlertDescription className="text-green-700">
                <ul className="list-disc pl-5 space-y-2 mt-2">
                  <li>
                    <strong>核心机制</strong>: Base44 SDK 提供 <code className="bg-green-100 px-1 rounded">base44.entities.EntityName.subscribe()</code> 方法，底层使用高效的推送机制（可能基于 Server-Sent Events 或类似技术）。
                  </li>
                  <li>
                    <strong>优势</strong>: 
                    • <strong>无轮询开销</strong> - 服务器主动推送变更，不占用请求配额
                    • <strong>零延迟</strong> - 数据变更即时通知客户端
                    • <strong>简单易用</strong> - 一行代码即可订阅
                  </li>
                  <li>
                    <strong>适用场景</strong>: 实时仪表盘、协同编辑、即时通知、数据监控等所有需要实时更新的场景。
                  </li>
                  <li>
                    <strong>这是 Base44 推荐的标准实时方案</strong>，完美替代 WebSocket 和轮询！
                  </li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 左侧：产品列表和操作 */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-lg">产品列表（实时更新）</CardTitle>
                  <CardDescription>在此创建、修改或删除产品，右侧事件日志会实时显示</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="新产品名称..."
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && createProduct()}
                    />
                    <Button onClick={createProduct} disabled={isCreating}>
                      <Plus className="w-4 h-4 mr-1" />
                      创建
                    </Button>
                  </div>

                  <div className="border rounded-lg max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>产品</TableHead>
                          <TableHead>价格</TableHead>
                          <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-slate-500 py-8">
                              暂无产品，创建一个试试
                            </TableCell>
                          </TableRow>
                        ) : (
                          products.map(product => (
                            <TableRow key={product.id}>
                              <TableCell className="font-medium">{product.name}</TableCell>
                              <TableCell>¥{product.price}</TableCell>
                              <TableCell className="text-right space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => updateProductPrice(product.id, product.price)}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => deleteProduct(product.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* 右侧：实时事件日志 */}
              <Card className="border-2 border-green-200 bg-green-50/30">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="w-5 h-5 text-green-600" />
                    实时事件日志
                  </CardTitle>
                  <CardDescription>所有数据变更事件都会立即出现在这里</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg bg-slate-900 text-slate-100 p-3 h-96 overflow-y-auto font-mono text-xs">
                    {events.length === 0 ? (
                      <div className="text-slate-500 text-center py-8">
                        等待事件中...
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {events.map(event => (
                          <div key={event.id} className="border-b border-slate-700 pb-2">
                            <div className="flex items-center justify-between mb-1">
                              <Badge 
                                variant="outline"
                                className={
                                  event.type === 'create' ? 'bg-green-900 text-green-200 border-green-600' :
                                  event.type === 'update' ? 'bg-blue-900 text-blue-200 border-blue-600' :
                                  'bg-red-900 text-red-200 border-red-600'
                                }
                              >
                                {event.type.toUpperCase()}
                              </Badge>
                              <span className="text-slate-500">
                                {format(new Date(event.timestamp), 'HH:mm:ss')}
                              </span>
                            </div>
                            <div className="text-slate-300">
                              ID: {event.entityId.slice(0, 8)}...
                            </div>
                            <div className="text-slate-400 mt-1">
                              {event.data.name} - ¥{event.data.price}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Alert className="border-blue-200 bg-blue-50">
              <AlertTitle className="text-blue-800 font-semibold">代码示例</AlertTitle>
              <AlertDescription>
                <pre className="text-xs bg-white/50 p-3 rounded border border-blue-200 mt-2 overflow-x-auto">
{`// 订阅产品实体的所有变更
const unsubscribe = base44.entities.Product.subscribe((event) => {
  console.log(\`\${event.type}: \`, event.data);
  
  if (event.type === 'create') {
    // 处理新建事件
  } else if (event.type === 'update') {
    // 处理更新事件
  } else if (event.type === 'delete') {
    // 处理删除事件
  }
});

// 组件卸载时取消订阅
return () => unsubscribe();`}
                </pre>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}