import { get, set, del } from 'idb-keyval';

export async function saveMediaAsset(id: string, file: Blob): Promise<void> {
  await set(`asset_${id}`, file);
}

export async function getMediaAsset(id: string): Promise<Blob | undefined> {
  return await get(`asset_${id}`);
}

export async function deleteMediaAsset(id: string): Promise<void> {
  await del(`asset_${id}`);
}
