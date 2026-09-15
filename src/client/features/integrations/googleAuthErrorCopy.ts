/**
 * Plain-language copy for Google OAuth failures, shared by the connect-surface
 * inline alert (GoogleLinkErrorAlert) and the /auth-error fallback page.
 * `code` is the `error` query param Better Auth appends on its error
 * redirects.
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
    case "account_already_linked_to_different_user":
      return {
        title: "该 Google 账号已连接",
        description: providerLabel
          ? `请登录当初绑定它的 OpenSEO 用户，打开 ${providerLabel} 媒体资源选择器，在该 Google 账号旁选择「移除账号」，然后再到这里连接。`
          : "该 Google 账号已绑定到另一个 OpenSEO 用户。请用那个用户登录，或联系支持协助处理。",
      };
    default:
      return {
        title: `${what}未完成`,
        description:
          "与 Google 通信时出错。请重试；如果持续失败，请联系支持。",
      };
  }
}
