/**
 * Files of work orders (the signature, photos of findings and results) are attached to the ticket on the OneMap
 * server: POST /api/tickets/{id}/attachments. Photos are scaled down on the device before they are sent.
 * @module
 */
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import { ImagePickerAsset } from "expo-image-picker";
import { ApiError, authHeaders, errorMessage, isServerFile, ONEMAP_URL } from "@/lib/onemap-api";

export type AttachmentKind = "signature" | "finding" | "result" | "photo";

/** The longest side of a photo after it is scaled down, in pixels, and the JPEG quality. */
const PHOTO_SIDE = 1600;
const PHOTO_QUALITY = 0.7;

interface Attachment {
  id: number;
  name: string;
  kind: string;
  contentType: string;
  size: number;
  /** server-relative address of the file */
  url: string;
}

const MIME: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };

/** Sends one local image file as the body of the request and returns the address the server gave it. */
async function upload(ticketId: string, kind: AttachmentKind, fileUri: string, mime: string): Promise<string> {
  const result = await FileSystem.uploadAsync(
    `${ONEMAP_URL}/api/tickets/${ticketId}/attachments?kind=${kind}`,
    fileUri,
    {
      httpMethod: "POST",
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: { ...authHeaders(), "Content-Type": mime, Accept: "application/json" },
    },
  );
  if (result.status < 200 || result.status >= 300) {
    throw new ApiError(errorMessage(result.body || "") || `Upload failed (${result.status})`, result.status);
  }
  return (JSON.parse(result.body) as Attachment).url;
}

/** A photo scaled to fit PHOTO_SIDE (never enlarged) and saved as JPEG. */
async function scaled(asset: ImagePickerAsset): Promise<string> {
  const longest = Math.max(asset.width || 0, asset.height || 0);
  const actions: ImageManipulator.Action[] =
    longest > PHOTO_SIDE
      ? [{ resize: asset.width >= asset.height ? { width: PHOTO_SIDE } : { height: PHOTO_SIDE } }]
      : [];
  const result = await ImageManipulator.manipulateAsync(asset.uri, actions, {
    compress: PHOTO_QUALITY,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  return result.uri;
}

/**
 * Attaches the photos to the ticket and returns the address of every one, in order. A photo that already lives on the
 * server (it was attached before and is being saved again) is kept as it is and not sent twice.
 */
async function uploadTicketImages(ticketId: string, assets: ImagePickerAsset[], kind: AttachmentKind): Promise<string[]> {
  const urls: string[] = [];
  for (const asset of assets) {
    if (isServerFile(asset.uri) || /^https?:/.test(asset.uri)) {
      urls.push(asset.uri);
    } else {
      urls.push(await upload(ticketId, kind, await scaled(asset), "image/jpeg"));
    }
  }
  return urls;
}

/** Attaches the signature (a PNG data URL from the signature pad). Signing again attaches a newer one. */
async function uploadSignature(ticketId: string, dataUrl: string): Promise<string> {
  const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
  const file = `${FileSystem.cacheDirectory}signature-${ticketId}-${Date.now()}.png`;
  await FileSystem.writeAsStringAsync(file, base64, { encoding: FileSystem.EncodingType.Base64 });
  try {
    return await upload(ticketId, "signature", file, MIME.png);
  } finally {
    await FileSystem.deleteAsync(file, { idempotent: true });
  }
}

export const storageService = { uploadTicketImages, uploadSignature };

export type StorageService = typeof storageService;
