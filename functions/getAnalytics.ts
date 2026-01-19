import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// 这个函数现在变得非常轻量，只负责从预计算好的 AnalyticsResult 表中读取结果。
// 它的响应速度极快，因为它不进行任何实时计算。

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const { query_id } = await req.json();
        
        // 从预计算的结果表中查找数据
        const results = await base44.asServiceRole.entities.AnalyticsResult.filter({ query_id: query_id }, "", 1);

        if (!results || results.length === 0) {
            // 如果没有找到预计算的数据，可以返回空或一个提示信息
            return new Response(JSON.stringify([]), { status: 200 });
        }
        
        // 直接返回存储在 result_data 字段中的预计算结果
        const resultData = results[0].result_data?.data || [];
        
        return new Response(JSON.stringify(resultData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('获取分析数据失败:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});