import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Wifi, WifiOff, Send, Trash2, CheckCircle, XCircle, Radio } from 'lucide-react';

export default function WebSocketTest() {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('未连接');
  const [wsUrl, setWsUrl] = useState('');
  const socketRef = useRef(null);

  useEffect(() => {
    // 构建 WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const url = `${protocol}//${host}/api/functions/websocketTest`;
    setWsUrl(url);
  }, []);

  const connect = () => {
    if (socketRef.current) {
      socketRef.current.close();
    }

    setConnectionStatus('连接中...');
    addMessage('system', '正在连接到 WebSocket 服务器...');

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const url = `${protocol}//${host}/api/functions/websocketTest`;
      
      socketRef.current = new WebSocket(url);

      socketRef.current.onopen = () => {
        setIsConnected(true);
        setConnectionStatus('已连接');
        addMessage('system', '✅ WebSocket 连接成功建立！');
      };

      socketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          addMessage('received', JSON.stringify(data, null, 2));
        } catch (error) {
          addMessage('received', event.data);
        }
      };

      socketRef.current.onerror = (error) => {
        addMessage('error', `❌ WebSocket 错误: ${error.message || '未知错误'}`);
        setConnectionStatus('错误');
      };

      socketRef.current.onclose = (event) => {
        setIsConnected(false);
        setConnectionStatus('已断开');
        addMessage('system', `连接已关闭 (代码: ${event.code}, 原因: ${event.reason || '无'})`);
      };
    } catch (error) {
      addMessage('error', `❌ 连接失败: ${error.message}`);
      setConnectionStatus('失败');
    }
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
  };

  const sendMessage = () => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      addMessage('error', '❌ 无法发送消息：未连接到服务器');
      return;
    }

    if (!inputMessage.trim()) {
      return;
    }

    const messageData = {
      message: inputMessage,
      timestamp: new Date().toISOString()
    };

    socketRef.current.send(JSON.stringify(messageData));
    addMessage('sent', JSON.stringify(messageData, null, 2));
    setInputMessage('');
  };

  const addMessage = (type, content) => {
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      type,
      content,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-5xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                  <Radio className="w-8 h-8 text-blue-600" />
                  WebSocket 连接测试
                </CardTitle>
                <CardDescription className="mt-2 text-slate-600">
                  测试 Base44 平台是否支持 WebSocket 实时双向通信
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={isConnected ? "default" : "secondary"} className="text-sm px-3 py-1">
                  {isConnected ? <Wifi className="w-4 h-4 mr-1" /> : <WifiOff className="w-4 h-4 mr-1" />}
                  {connectionStatus}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <Alert className="border-blue-200 bg-blue-50">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800 font-semibold">测试目标</AlertTitle>
              <AlertDescription className="text-blue-700">
                验证 Base44 的 Serverless 函数是否能够升级 HTTP 连接为 WebSocket，并保持持久化的双向通信通道。
                <div className="mt-2 font-mono text-xs bg-white/50 p-2 rounded border border-blue-200">
                  {wsUrl || '加载中...'}
                </div>
              </AlertDescription>
            </Alert>

            <Alert className="border-orange-200 bg-orange-50">
              <XCircle className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-orange-800 font-semibold">测试结论</AlertTitle>
              <AlertDescription className="text-orange-700">
                <ul className="list-disc pl-5 space-y-2 mt-2">
                  <li>
                    <strong>观察结果</strong>: WebSocket 连接能够成功建立（onopen 触发），但<strong className="font-semibold">立即被关闭</strong>，错误代码 1006，原因为 "WebSocket endpoint not found"。
                  </li>
                  <li>
                    <strong>根本原因</strong>: 这与 Deno.cron 的情况类似。Base44 的 Serverless 架构是<strong className="font-semibold">按需、短暂</strong>的，函数容器在处理完请求后会被冻结或销毁。WebSocket 需要一个<strong className="font-semibold">持久化的长连接</strong>，这与 Serverless 的无状态特性相冲突。
                  </li>
                  <li>
                    <strong>最终结论</strong>: Base44 平台目前<strong className="font-semibold">不支持持久化的 WebSocket 连接</strong>。虽然协议升级可以完成，但连接无法保持。
                  </li>
                  <li>
                    <strong>替代方案</strong>: 对于实时通信需求，建议使用<strong className="font-semibold">轮询（Polling）</strong>或<strong className="font-semibold">Server-Sent Events (SSE)</strong>，或者集成第三方实时服务（如 Pusher、Ably）。
                  </li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              {!isConnected ? (
                <Button onClick={connect} className="bg-blue-600 hover:bg-blue-700">
                  <Wifi className="w-4 h-4 mr-2" />
                  连接 WebSocket
                </Button>
              ) : (
                <Button onClick={disconnect} variant="destructive">
                  <WifiOff className="w-4 h-4 mr-2" />
                  断开连接
                </Button>
              )}
              <Button onClick={clearMessages} variant="outline">
                <Trash2 className="w-4 h-4 mr-2" />
                清空日志
              </Button>
            </div>

            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="输入测试消息..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                disabled={!isConnected}
                className="flex-grow"
              />
              <Button onClick={sendMessage} disabled={!isConnected}>
                <Send className="w-4 h-4 mr-2" />
                发送
              </Button>
            </div>

            <div className="border rounded-lg bg-slate-900 text-slate-100 p-4 h-96 overflow-y-auto font-mono text-sm">
              <div className="space-y-2">
                {messages.length === 0 ? (
                  <div className="text-slate-500 text-center py-8">
                    暂无消息。点击"连接 WebSocket"开始测试。
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="border-b border-slate-700 pb-2">
                      <div className="flex items-center justify-between mb-1">
                        <Badge 
                          variant="outline" 
                          className={
                            msg.type === 'sent' ? 'bg-green-900 text-green-200 border-green-600' :
                            msg.type === 'received' ? 'bg-blue-900 text-blue-200 border-blue-600' :
                            msg.type === 'error' ? 'bg-red-900 text-red-200 border-red-600' :
                            'bg-slate-700 text-slate-300 border-slate-500'
                          }
                        >
                          {msg.type === 'sent' ? '发送' :
                           msg.type === 'received' ? '接收' :
                           msg.type === 'error' ? '错误' : '系统'}
                        </Badge>
                        <span className="text-xs text-slate-500">{msg.timestamp}</span>
                      </div>
                      <pre className="text-xs whitespace-pre-wrap text-slate-200">{msg.content}</pre>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}