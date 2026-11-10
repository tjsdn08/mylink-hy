import { generateOgImage, size, contentType } from "@/lib/og-image";

export { size, contentType };
export const alt = "MyLink - One link. All of you.";

export default function Image() {
  return generateOgImage();
}
