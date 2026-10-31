import { createFileRoute } from "@tanstack/react-router";
import {
  CommandBlock,
  helpLinkClassName,
  SecretHelpPage,
} from "@/client/features/help/SecretHelpPage";

const DATAFORSEO_API_ACCESS_URL = "https://app.dataforseo.com/api-access";

export const Route = createFileRoute("/_app/help/dataforseo-api-key")({
  component: DataforseoApiKeyHelpPage,
});

function DataforseoApiKeyHelpPage() {
  const requestStep = (
    <li>
      前往{" "}
      <a
        className={helpLinkClassName}
        href={DATAFORSEO_API_ACCESS_URL}
        target="_blank"
        rel="noreferrer"
      >
        DataForSEO API Access
      </a>{" "}
      ，通过邮件申请 API 凭证。
    </li>
  );
  const encodeStep = (
    <li>
      按以下格式对 DataForSEO 登录名和 API 密码做 Base64 编码：
      <CommandBlock command="printf '%s' 'YOUR_LOGIN:YOUR_PASSWORD' | base64" />
    </li>
  );
  return (
    <SecretHelpPage
      title="设置 DataForSEO API 密钥"
      intro={
        <>
          OpenSEO 需要 <code>DATAFORSEO_API_KEY</code>{" "}
          secret，关键词、域名和 SEO 数据流程才能运行。
        </>
      }
      everyAppIntro="OpenSEO 的关键词、域名、反向链接和排名数据来自 DataForSEO。在 Every App 上，网关为所有应用保存一次密钥。"
      secretName="DATAFORSEO_API_KEY"
      steps={
        <>
          {requestStep}
          {encodeStep}
          <li>
            把输出保存为环境中的 <code>DATAFORSEO_API_KEY</code> secret。
          </li>
        </>
      }
      everyAppSteps={
        <>
          {requestStep}
          {encodeStep}
          <li>
            所有者或管理员在 Every App 结账处运行此命令并粘贴值：
            <CommandBlock command="pnpm everyapp secret set DATAFORSEO_API_KEY" />
          </li>
          <li>重新加载 OpenSEO：下次请求就会用到这把密钥。</li>
        </>
      }
      dashboardPasteStep="粘贴上面终端命令得到的 base64 值并保存。"
      terminalPromptHint={
        <>
          提示时使用 <code>login:password</code> 的 base64 值。
        </>
      }
    />
  );
}
