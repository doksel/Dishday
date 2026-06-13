/**
 * Avatar upload helper.
 *
 *   Flow:
 *     1. Ask for photo-library permission (ImagePicker handles the prompt).
 *     2. Open the picker with a 1:1 crop UI.
 *     3. Convert the picked file URI → ArrayBuffer (RN fetch + blob works in
 *        SDK 50+; arrayBuffer() is more reliable than blob() for upload to
 *        Supabase Storage on Hermes).
 *     4. Upload to the `avatars` bucket at path `<userId>.jpg`, upserting
 *        (overwrite). The bucket is public-read.
 *     5. Return the public URL with a `?v=<timestamp>` cache-buster — Supabase
 *        CDN can hold old versions for minutes otherwise.
 *
 *   The `avatars` bucket must be set up once via the SQL in
 *   `docs/supabase/avatars-bucket.sql`.
 */

import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

export class AvatarPermissionDenied extends Error {
  constructor() {
    super('Photo library permission denied');
    this.name = 'AvatarPermissionDenied';
  }
}

export class AvatarCancelled extends Error {
  constructor() {
    super('Avatar picker cancelled');
    this.name = 'AvatarCancelled';
  }
}

export interface PickAndUploadResult {
  /** Public URL with cache-buster — store this in `users.avatarUrl`. */
  publicUrl: string;
  /** Storage path (e.g. `<userId>.jpg`). For diagnostics / future cleanup. */
  path: string;
}

/**
 * Pick an image from the user's library and upload it as their avatar.
 *
 *   Throws:
 *     - `AvatarPermissionDenied` — user blocked photo-library access
 *     - `AvatarCancelled`         — user closed the picker
 *     - Any other `Error`         — upload failure, surface to UI
 */
export async function pickAndUploadAvatar(userId: string): Promise<PickAndUploadResult> {
  // 1. Permission. iOS shows the prompt the first time; subsequent calls
  //    return the cached decision without a dialog.
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    throw new AvatarPermissionDenied();
  }

  // 2. Picker. Force a square crop so the avatar circle never crops awkwardly.
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });
  if (result.canceled || !result.assets?.[0]) {
    throw new AvatarCancelled();
  }
  const asset = result.assets[0];

  // 3. Read the picked file. Hermes/RN's `fetch(uri).arrayBuffer()` is
  //    well-supported on iOS + Android in SDK 50+.
  const fileResp = await fetch(asset.uri);
  const arrayBuffer = await fileResp.arrayBuffer();

  // 4. Upload. `upsert: true` overwrites the previous avatar at the same path.
  //    Path scheme `<userId>.jpg` matches the RLS policy in the SQL setup.
  const path = `${userId}.jpg`;
  const { error } = await supabase.storage.from('avatars').upload(path, arrayBuffer, {
    upsert: true,
    contentType: asset.mimeType ?? 'image/jpeg',
    cacheControl: '3600', // 1h CDN cache; we cache-bust the URL below
  });
  if (error) throw error;

  // 5. Public URL + cache-buster. Supabase returns the canonical URL; appending
  //    `?v=<ts>` forces the CDN to bypass cache for the new revision.
  const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
  const publicUrl = `${pub.publicUrl}?v=${Date.now()}`;
  return { publicUrl, path };
}
