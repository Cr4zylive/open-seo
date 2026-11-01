import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { GateCard } from "@/client/components/GateCard";
import { Button } from "@/client/components/ui/button";

/**
 * Shown on the chat route until the user opts into Sam. Sam is the OpenSEO
 * MCP plus skills wrapped in an in-app chat; the agents people already use
 * run that same toolset with a more mature harness, so the primary action
 * points there and Sam is the explicit fallback.
 */
export function SamBetaGate({ onContinue }: { onContinue: () => void }) {
  return (
    <GateCard
      icon={Sparkles}
      title="Sam 目前处于测试阶段"
      description={
        <>
          <p>
            Sam 是套在聊天窗口里的 OpenSEO MCP 和技能。你已经在用的智能体，如
            Claude Code、ChatGPT、Grok Bot 或 Hermes，能在更成熟的环境里运行同一套工具。我们建议在那里使用
            OpenSEO。
          </p>
          <p>你仍可以使用 Sam，但它还比较早期，体验会有些粗糙。</p>
        </>
      }
      actions={
        <>
          <Button size="lg" nativeButton={false} render={<Link to="/ai" />}>
            设置你的智能体
          </Button>
          <Button size="lg" variant="ghost" onClick={onContinue}>
            仍然使用 Sam
          </Button>
        </>
      }
    />
  );
}
