import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Copy, 
  Code,
  Clock,
  CheckCircle,
  Loader2
} from "lucide-react";

export default function QueryExample({ title, description, sql, onExecute, isLoading }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900 mb-2">
              {title}
            </CardTitle>
            <p className="text-slate-600 text-sm">{description}</p>
          </div>
          <Badge variant="secondary" className="bg-slate-100 text-slate-600">
            <Code className="w-3 h-3 mr-1" />
            SQL查询
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto">
              <code>{sql}</code>
            </pre>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="absolute top-2 right-2 text-slate-400 hover:text-slate-200"
            >
              {copied ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              onClick={onExecute}
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  执行中...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  执行查询
                </>
              )}
            </Button>
            
            {!isLoading && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock className="w-4 h-4" />
                <span>预计耗时 &lt; 1秒</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}