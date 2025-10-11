import { v2 as cloudinary } from "cloudinary"

// Configure Cloudinary from environment variables
// Required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  // Do not throw here to allow app to boot without Cloudinary for non-image flows
  console.warn(
    "Cloudinary environment variables are missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env",
  )
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
})

export default cloudinary

// Build a Cloudinary delivery URL with sensible defaults (auto format/quality, width)
export function buildCdnUrl(publicId?: string | null, opts: { w?: number; h?: number } = {}): string | undefined {
  if (!publicId || !CLOUDINARY_CLOUD_NAME) return undefined
  if (/^https?:\/\//i.test(publicId)) return publicId
  const w = opts.w ?? 800
  const h = opts.h
  // Remove extension and any accidental upload prefix
  let cleanId = String(publicId)
    .replace(/^https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/v?\d+\//, "")
    .replace(/^https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//, "")
    .replace(/\.[^/.]+$/, "")
  const base = [`f_auto`, `q_auto`, `w_${w}`]
  if (h) base.push(`h_${h}`)
  const transformations = base.join(",")
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformations}/${cleanId}`
}
