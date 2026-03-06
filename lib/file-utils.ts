import type { AttachmentMeta } from "@/types";
import { MAX_ATTACHMENT_BYTES } from "@/lib/constants";
import { uid } from "@/lib/helpers";

export async function toAttachmentMeta(file: File): Promise<AttachmentMeta> {
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error(`첨부 파일은 ${MAX_ATTACHMENT_BYTES / 1024 / 1024}MB 이하만 가능합니다.`);
  }

  const dataUrl = await readAsDataUrl(file);
  return {
    id: uid("file"),
    name: file.name,
    type: file.type === "application/pdf" ? "pdf" : "image",
    size: file.size,
    dataUrl
  };
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("파일을 읽지 못했습니다."));
    reader.readAsDataURL(file);
  });
}
