export interface LinkFormValues {
  title: string;
  url: string;
}

export function validateLinkForm(values: LinkFormValues): string | null {
  if (!values.title.trim()) return "링크 제목을 입력해 주세요.";
  if (!values.url.trim()) return "URL을 입력해 주세요.";

  try {
    const url = new URL(values.url.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "http 또는 https 주소를 입력해 주세요.";
    }
  } catch {
    return "올바른 URL을 입력해 주세요. 예: https://example.com";
  }

  return null;
}