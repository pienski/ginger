import imageCompression from "browser-image-compression";

// Tunables for upload optimization. The app never renders a recipe photo wider
// than ~500px (≈1000px on retina), so capping the longest edge at 1600px keeps
// images visually identical while cutting stored size dramatically.
const MAX_EDGE = 1600; // longest side, px
const QUALITY = 0.8; // WebP quality (0–1)
const OUTPUT_TYPE = "image/webp";

/**
 * Resize + recompress an image to WebP in the browser before upload.
 *
 * Returns an optimized WebP `File` (renamed `*.webp` so Vercel Blob stores the
 * right pathname/contentType). On any failure it returns the original file
 * unchanged, so a quirky format never blocks an upload — worst case matches the
 * previous behavior of uploading the raw file.
 */
export async function optimizeImageForUpload(file: File): Promise<File> {
  try {
    const compressed = await imageCompression(file, {
      maxWidthOrHeight: MAX_EDGE,
      initialQuality: QUALITY,
      fileType: OUTPUT_TYPE,
      useWebWorker: true,
    });
    const base = file.name.replace(/\.[^./\\]+$/, "");
    return new File([compressed], `${base}.webp`, { type: OUTPUT_TYPE });
  } catch (err) {
    console.warn("Image optimization failed, uploading original", err);
    return file;
  }
}
