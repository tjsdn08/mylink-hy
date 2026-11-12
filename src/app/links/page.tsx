import { redirect } from "next/navigation";

/** 과거 실습용 목업 링크 화면 대신 실제 관리 화면으로 안내합니다. */
export default function LinksPage() {
  redirect("/");
}
