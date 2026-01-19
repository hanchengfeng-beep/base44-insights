import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import _ from 'npm:lodash@4.17.21';
import { format } from 'npm:date-fns@3.6.0';

// 这是一个定时任务函数，应该在Base44后台配置为例如每小时运行一次。
// 它负责执行繁重的计算，并将结果存入 AnalyticsResult 实体。

Deno.serve(async (req) => {
    // 对于定时任务，通常没有用户上下文，我们直接使用Service Role
    const base44 = createClientFromRequest(req);
    const sdk = base44.asServiceRole;

    try {
        console.log("开始执行分析数据刷新任务...");

        const [users, orders, products] = await Promise.all([
            sdk.entities.DemoUser.list("", 50000), // 假设拉取更多数据
            sdk.entities.Order.list("", 50000),
            sdk.entities.Product.list("", 50000),
        ]);

        const queryIds = ["user_orders", "sales_trend", "hot_products", "city_activity"];

        for (const queryId of queryIds) {
            let resultData = [];
            // ... (这里是之前 getAnalytics 函数中的所有计算逻辑) ...
            // 为了简洁，我们只演示 user_orders 的计算
            if (queryId === "user_orders") {
                const ordersByUser = _.groupBy(orders.filter(o => o.status === 'delivered'), 'user_id');
                resultData = users.map(u => {
                    const userOrders = ordersByUser[u.id] || [];
                    const totalSpent = _.sumBy(userOrders, 'total_amount');
                    return {
                        username: u.username, city: u.city, level: u.level,
                        order_count: userOrders.length,
                        total_spent: parseFloat(totalSpent.toFixed(2)),
                        avg_order_value: userOrders.length > 0 ? parseFloat((totalSpent / userOrders.length).toFixed(2)) : 0,
                    };
                }).filter(u => u.order_count > 0).sort((a, b) => b.total_spent - a.total_spent).slice(0, 10);
            }
            // ... (此处应包含其他 queryId 的计算逻辑) ...
            
            if (resultData.length > 0) {
                 // 查找是否已存在记录
                const existing = await sdk.entities.AnalyticsResult.filter({ query_id: queryId }, "", 1);
                
                const dataToSave = {
                    query_id: queryId,
                    result_data: { data: resultData }, // 将数组包装在对象中
                    last_updated: new Date().toISOString()
                };

                if (existing && existing.length > 0) {
                    // 更新记录
                    await sdk.entities.AnalyticsResult.update(existing[0].id, dataToSave);
                    console.log(`已更新分析结果: ${queryId}`);
                } else {
                    // 创建新记录
                    await sdk.entities.AnalyticsResult.create(dataToSave);
                    console.log(`已创建分析结果: ${queryId}`);
                }
            }
        }
        
        return new Response(JSON.stringify({ success: true, message: "分析数据刷新完成" }), { status: 200 });

    } catch (error) {
        console.error('定时刷新任务失败:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
    }
});