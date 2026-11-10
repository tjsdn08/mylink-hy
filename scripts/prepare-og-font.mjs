import { copyFile, mkdir, stat } from "node:fs/promises";
import { join } from "node:path";

const source = join(
  process.cwd(),
  "node_modules",
  "@openfonts",
  "noto-sans-kr_korean",
  "files",
  "noto-sans-kr-korean-700.woff"
);
const targetDirectory = join(process.cwd(), "public", "fonts");
const target = join(targetDirectory, "noto-sans-kr-700.woff");

try {
  await stat(source);
  await mkdir(targetDirectory, { recursive: true });
  await copyFile(source, target);
  console.log("OG 폰트 준비 완료: public/fonts/noto-sans-kr-700.woff");
} catch (error) {
  console.error(
    "OG 폰트 준비 실패. 먼저 npm install을 실행하세요:",
    error instanceof Error ? error.message : String(error)
  );
  process.exitCode = 1;
}
