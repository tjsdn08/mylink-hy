/** URL 입력 편의 기능: 프로토콜이 없는 도메인에만 https:// 를 붙입니다. */
export function normalizeExternalUrl(value: string): string {
  const input = value.trim();
  if (!input || /^https?:\/\//i.test(input)) return input;
  if (/^[a-z][a-z0-9+.-]*:/i.test(input)) return input;
  if (/^\/\//.test(input) || /\s/.test(input)) return input;
  if (/^(localhost|\d{1,3}(?:\.\d{1,3}){3})(:\d+)?(?:\/|$)/i.test(input)) return input;
  if (/^[\w-]+(?:\.[\w-]+)+(?:\/[^\s]*)?$/u.test(input)) return `https://${input}`;
  return input;
}
