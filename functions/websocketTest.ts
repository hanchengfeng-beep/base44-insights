Deno.serve((req) => {
  // 检查是否是 WebSocket 升级请求
  if (req.headers.get("upgrade") !== "websocket") {
    return new Response("Expected WebSocket upgrade request", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.onopen = () => {
    console.log("WebSocket 连接已建立");
    socket.send(JSON.stringify({ 
      type: "connected", 
      message: "成功连接到 Base44 WebSocket 服务器！",
      timestamp: new Date().toISOString()
    }));
  };

  socket.onmessage = (event) => {
    console.log("收到消息:", event.data);
    try {
      const data = JSON.parse(event.data);
      
      // 回显消息
      socket.send(JSON.stringify({
        type: "echo",
        original: data,
        timestamp: new Date().toISOString(),
        message: `服务器收到: ${data.message || event.data}`
      }));
    } catch (error) {
      socket.send(JSON.stringify({
        type: "error",
        message: "无法解析消息",
        timestamp: new Date().toISOString()
      }));
    }
  };

  socket.onerror = (error) => {
    console.error("WebSocket 错误:", error);
  };

  socket.onclose = () => {
    console.log("WebSocket 连接已关闭");
  };

  return response;
});