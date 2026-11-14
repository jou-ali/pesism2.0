import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const BUCKET = 'player-avatars';
const CREST_BUCKET = 'crests';
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);
const CREST_SIDE = 256;

function resolveImageType(file: File): string {
  if (file.type && ALLOWED.has(file.type)) {
    return file.type;
  }
  const name = file.name.toLowerCase();
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.webp')) return 'image/webp';
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
  return file.type;
}

async function ensureBucket(supabase: SupabaseClient, bucket: string) {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    throw new Error(listError.message);
  }
  if (buckets?.some((b) => b.name === bucket)) {
    return;
  }
  const { error: createError } = await supabase.storage.createBucket(bucket, { public: true });
  if (createError && !createError.message.toLowerCase().includes('already exists')) {
    throw new Error(
      createError.message.includes('not authorized')
        ? `Storage bucket missing. In Supabase create a public bucket named ${bucket}, or use a secret key with storage admin rights.`
        : createError.message,
    );
  }
}

/** Pulls the path inside `bucket` back out of a Supabase public URL, so we can delete the file a
 * new upload is replacing. Returns null for anything that doesn't look like one of our own URLs. */
function storagePathFromPublicUrl(url: string, bucket: string): string | null {
  const marker = `/object/public/${bucket}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : url.slice(i + marker.length);
}

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    return null;
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function uploadPlayerAvatar(file: File): Promise<string> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error('Photo upload is not configured (Supabase keys missing).');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Photo must be 2 MB or smaller.');
  }
  const contentType = resolveImageType(file);
  if (!ALLOWED.has(contentType)) {
    throw new Error('Use a JPG, PNG, or WebP photo.');
  }
  await ensureBucket(supabase, BUCKET);

  const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
  const path = `season-3/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType,
    upsert: false,
  });
  if (error) {
    throw new Error(
      error.message.includes('Bucket not found')
        ? `Create the "${BUCKET}" bucket in Supabase Storage (public).`
        : error.message,
    );
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Converts whatever the admin picked (PNG/JPG/WebP/SVG/HEIC) into a PNG, trims any transparent
 * padding, and fits it inside a 256x256 transparent canvas — posters are rendered by Satori, which
 * (unlike a browser) only understands PNG/JPEG, so this conversion has to happen server-side before
 * the file ever reaches Storage. The new filename busts the CDN/`<img>` cache on its own; the old
 * file (if any) is deleted after the new one is safely uploaded.
 */
export async function uploadTeamCrest(file: File | Blob, playerId: string, previousCrestUrl?: string | null): Promise<string> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error('Crest upload is not configured (Supabase keys missing).');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Crest must be 2 MB or smaller.');
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer());
  let png: Buffer;
  try {
    png = await sharp(inputBuffer)
      .trim()
      .resize(CREST_SIDE, CREST_SIDE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
  } catch {
    throw new Error('Could not read that image — use a PNG, JPG, WebP, SVG, or HEIC file.');
  }

  await ensureBucket(supabase, CREST_BUCKET);

  const path = `${playerId}-${Date.now()}.png`;
  const { error } = await supabase.storage.from(CREST_BUCKET).upload(path, png, {
    contentType: 'image/png',
    upsert: false,
  });
  if (error) {
    throw new Error(
      error.message.includes('Bucket not found')
        ? `Create the "${CREST_BUCKET}" bucket in Supabase Storage (public).`
        : error.message,
    );
  }

  const oldPath = previousCrestUrl ? storagePathFromPublicUrl(previousCrestUrl, CREST_BUCKET) : null;
  if (oldPath) {
    await supabase.storage.from(CREST_BUCKET).remove([oldPath]);
  }

  const { data } = supabase.storage.from(CREST_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function removeTeamCrest(crestUrl: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error('Crest storage is not configured (Supabase keys missing).');
  }
  const path = storagePathFromPublicUrl(crestUrl, CREST_BUCKET);
  if (!path) return;
  await supabase.storage.from(CREST_BUCKET).remove([path]);
}
