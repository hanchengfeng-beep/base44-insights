
import { createClient, createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// --- Deno.cron 部分 (后台定时任务) ---
// 这部分代码保持不变，它会尝试每分钟自动运行一次。
Deno.cron("heartbeat", "* * * * *", async () => {
  const timestamp = new Date().toISOString();
  const message = `Deno.cron 后台心跳，时间: ${timestamp}`;
  
  try {
    const base44 = createClient({ appId: Deno.env.get("BASE44_APP_ID") });
    await base44.asServiceRole.entities.CronLog.create({
      timestamp: timestamp,
      message: message,
      level: 'INFO'
    });
    console.log("Deno.cron 任务成功: 日志已写入数据库。");
  } catch (error) {
    console.error("Deno.cron 任务失败: 写入数据库时发生错误:", error.message);
  }
});


// --- Deno.serve 部分 (响应前端的手动调用) ---
// 这部分代码现在包含了完整的业务逻辑。
Deno.serve(async (req) => {
  try {
    // 对于来自前端的HTTP请求，我们使用 createClientFromRequest
    const base44 = createClientFromRequest(req);
    
    // 验证调用者身份
    const user = await base44.auth.me();
    if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    // 从请求体中解析出描述信息
    const { description } = await req.json().catch(() => ({ description: '' }));
    const finalDescription = description || '无描述';

    // 构造一条不同的日志消息，以区分是自动的还是手动的
    const timestamp = new Date().toISOString();
    // 将描述信息拼接到日志消息中
    const message = `由用户 ${user.email} 手动调用。描述: ${finalDescription}`;
    
    // 使用服务角色权限写入日志
    await base44.asServiceRole.entities.CronLog.create({
      timestamp: timestamp,
      message: message,
      level: 'INFO'
    });
    
    console.log(`手动调用成功: 日志已写入数据库。描述: ${finalDescription}`);

    return new Response(
      JSON.stringify({ success: true, message: "手动日志创建成功" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("手动调用函数时发生错误:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
