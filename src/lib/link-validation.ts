export interface LinkFormValues {
  title: string;
  url: string;
}

export interface LinkFieldErrors {
  title?: string;
  url?: string;
}

export function getLinkFieldErrors(values: LinkFormValues): LinkFieldErrors {
  const errors: LinkFieldErrors = {};
  const title = values.title.trim();
  const rawUrl = values.url.trim();

  if (!title) errors.title = "링크 제목을 입력해 주세요.";
  else if (title.length > 100) errors.title = "링크 제목은 100자 이내로 입력해 주세요.";

  if (!rawUrl) {
    errors.url = "URL을 입력해 주세요.";
  } else {
    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        errors.url = "http 또는 https 주소만 입력해 주세요.";
      } else if (!parsed.hostname || !parsed.hostname.includes(".")) {
        errors.url = "올바른 사이트 주소를 입력해 주세요.";
      } else if (parsed.username || parsed.password) {
        errors.url = "로그인 정보가 포함된 URL은 사용할 수 없어요.";
      }
    } catch {
      errors.url = "올바른 URL을 입력해 주세요. 예: https://example.com";
    }
  }
  return errors;
}

export function validateLinkForm(values: LinkFormValues): string | null {
  const errors = getLinkFieldErrors(values);
  return errors.title ?? errors.url ?? null;
}
