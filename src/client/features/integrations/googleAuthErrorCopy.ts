/**
 * Plain-language copy for Google OAuth failures, shared by the connect-surface
 * inline alert (GoogleLinkErrorAlert) and the /auth-error fallback page.
 * `code` is the `error` query param on the redirect: Google's own error code
 * (access_denied), or one set by googleOAuth.ts / Better Auth.
 *
 * `providerLabel` ("Search Console" / "Google Analytics") is set when the
 * failure came from a connect flow; without it the copy reads as a Google
 * sign-in failure.
 */
export function googleAuthErrorCopy(
  code: string,
  providerLabel?: string,
): { title: string; description: string } {
  const what = providerLabel ? `${providerLabel} 连接` : "Google 登录";

  switch (code) {
    case "state_mismatch":
      return {
        title: `${what}未完成`,
        description:
          "操作已过期或被中断。请在同一个浏览器标签页中重试，并在 10 分钟内完成 Google 授权。如果反复出现，请确认浏览器允许本站使用 Cookie。",
      };
    case "access_denied":
      return {
        title: `${what}已取消`,
        description:
          "Google 权限页面被关闭或拒绝。准备好后可以再试一次。",
      };
    case "scope_not_granted":
      return {
        title: `${what}缺少权限`,
        description: `OpenSEO 没有获得你的 ${providerLabel ?? "Google"} 数据访问权限，因为 Google 权限页上有选项未勾选。请重试，并在继续前勾选所有选项。`,
      };
    case "connection_save_failed":
      return {
        title: `${what}未完成`,
        description:
          "无法保存连接。请重试；如果持续失败，请联系支持。",
      };
    default:
      return {
        title: `${what}未完成`,
        description:
          "与 Google 通信时出错。请重试；如果持续失败，请联系支持。",
      };
  }
}
