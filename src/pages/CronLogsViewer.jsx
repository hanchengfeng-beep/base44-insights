
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, RefreshCw, ServerCrash, Loader2, PlayCircle, Terminal } from 'lucide-react';
import { format } from 'date-fns';

export default function CronLogsViewer() {
  const queryClient = useQueryClient();
  const [isInvoking, setIsInvoking] = useState(false);
  const [description, setDescription] = useState('');

  const { data: logs, isLoading, isError, isRefetching } = useQuery({
    queryKey: ['cronLogs'],
    queryFn: () => base44.entities.CronLog.list('-created_date', 50),
    refetchInterval: 10000,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries(['cronLogs']);
  };

  const handleInvoke = async () => {
    setIsInvoking(true);
    try {
      await base44.functions.invoke('cronLogger', { description: description });
      await queryClient.invalidateQueries(['cronLogs']);
      setDescription('');
    } catch (error) {
      console.error("手动调用失败:", error);
      alert("手动调用失败，请查看控制台日志。");
    } finally {
      setIsInvoking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-800">后台任务日志</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2 text-slate-600">
                    <Clock className="w-4 h-4" />
                    <span>本页面用于验证后台函数的执行与日志记录。</span>
                  </CardDescription>
                </div>
                <Button onClick={handleRefresh} disabled={isRefetching || isInvoking} variant="outline" className="flex-shrink-0">
                    {isRefetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Input 
                  type="text"
                  placeholder="可选：添加描述信息 (如 '发布环境')"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="flex-grow"
                />
                <Button onClick={handleInvoke} disabled={isInvoking || isRefetching} className="flex-shrink-0">
                  {isInvoking ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <PlayCircle className="w-4 h-4 mr-2" />
                  )}
                  手动执行后台函数
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6 border-blue-200 bg-blue-50 text-blue-800">
              <Terminal className="h-4 w-4" stroke="currentColor" />
              <AlertTitle className="font-bold">深度解析：Base44 Serverless 架构与 `Deno.cron` 的关系</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-5 space-y-3 mt-2 text-blue-700">
                  <li>
                    <strong className="font-semibold">关键观察</strong>: 根据我们的测试，Base44 平台目前<strong className="font-semibold">并未区分</strong>所谓的“预览环境”和“生产环境”。所有 Serverless 函数部署（无论是实时编辑还是手动发布）都运行在同一种轻量级模式下。
                  </li>
                  <li>
                    <strong className="font-semibold">根本原因</strong>: 这种模式的核心是<strong className="font-semibold">短暂和按需</strong>。函数容器在接收到 HTTP 请求时启动，处理完后便可能被冻结或销毁。它缺乏一个永久在线的、可以承载 `Deno.cron` 调度器的持久化进程。因此，系统日志明确指出 `Crons are not supported`。
                  </li>
                  <li>
                    <strong className="font-semibold">最终结论</strong>: 在当前平台架构下，内置的 `Deno.cron` 无法用于实现自动化后台定时任务。
                  </li>
                  <li>
                    <strong className="font-semibold">正确的实践方案</strong>: 实现可靠定时任务的行业标准方案是“**外部触发器 + HTTP 函数**”模式。即使用一个外部 Cron 服务（如 `cron-job.org`）来定时调用本应用的 HTTP 函数端点。这与 Serverless 架构完全兼容。
                  </li>
                </ul>
              </AlertDescription>
            </Alert>
            
            {isLoading && (
              <div className="text-center py-10 text-slate-500">
                <Loader2 className="w-8 h-8 mx-auto animate-spin mb-4" />
                正在加载日志...
              </div>
            )}
            {isError && (
              <div className="text-center py-10 text-red-600 bg-red-50 rounded-lg">
                <ServerCrash className="w-8 h-8 mx-auto mb-4" />
                加载日志失败，请稍后重试。
              </div>
            )}
            {logs && (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-100">
                    <TableRow>
                      <TableHead className="w-1/3">时间戳</TableHead>
                      <TableHead>日志消息</TableHead>
                      <TableHead className="text-right">级别</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.length === 0 ? (
                       <TableRow>
                         <TableCell colSpan={3} className="text-center h-24 text-slate-500">
                           暂无日志记录。请等待1-2分钟，后台任务会自动生成新的日志。
                         </TableCell>
                       </TableRow>
                    ) : (
                      logs.map(log => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-sm">
                            {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                          </TableCell>
                          <TableCell>{log.message}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={log.level === 'ERROR' ? 'destructive' : 'secondary'}>{log.level}</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
