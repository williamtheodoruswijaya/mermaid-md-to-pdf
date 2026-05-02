"use client";

import { ImagePlus, Trash2, UploadCloud } from "lucide-react";
import type { ChangeEvent } from "react";
import type { DocumentAssetPayload } from "../types/markdown-pdf.types";

interface AssetUploaderProps {
  readonly assets: readonly DocumentAssetPayload[];
  readonly onAssetsChange: (assets: readonly DocumentAssetPayload[]) => void;
  readonly onInsertReference: (reference: string) => void;
}

export function AssetUploader({
  assets,
  onAssetsChange,
  onInsertReference,
}: AssetUploaderProps) {
  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) {
      return;
    }

    const nextAssets = await Promise.all(files.map(readImageAsset));
    onAssetsChange([...assets, ...nextAssets]);
    event.target.value = "";
  }

  return (
    <section className="border-b border-[var(--border)] bg-[var(--panel)]">
      <div className="flex h-14 items-center justify-between border-b border-[var(--border)] px-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ImagePlus aria-hidden="true" size={18} />
          Assets
        </div>
        <label
          className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-[var(--border)] px-3 text-sm font-medium hover:bg-[var(--panel-muted)]"
          title="Upload images"
        >
          <UploadCloud aria-hidden="true" size={16} />
          <span className="sr-only">Upload images</span>
          <input
            className="sr-only"
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            multiple
            onChange={handleFiles}
          />
        </label>
      </div>
      <div className="grid max-h-72 gap-2 overflow-auto p-4">
        {assets.length === 0 ? (
          <div className="rounded-md border border-dashed border-[var(--border)] px-3 py-6 text-center text-sm text-[var(--muted)]">
            No assets
          </div>
        ) : (
          assets.map((asset) => (
            <div
              className="grid gap-2 rounded-md border border-[var(--border)] p-3"
              key={asset.id}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {asset.filename}
                  </div>
                  <div className="font-mono text-xs text-[var(--muted)]">
                    {(asset.sizeBytes / 1024).toFixed(1)} KB
                  </div>
                </div>
                <button
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[var(--border)] hover:bg-[var(--panel-muted)]"
                  title="Remove asset"
                  type="button"
                  onClick={() =>
                    onAssetsChange(
                      assets.filter((candidate) => candidate.id !== asset.id),
                    )
                  }
                >
                  <Trash2 aria-hidden="true" size={15} />
                  <span className="sr-only">Remove asset</span>
                </button>
              </div>
              <button
                className="truncate rounded-md bg-[var(--panel-muted)] px-2 py-1 text-left font-mono text-xs text-[var(--accent-strong)]"
                title="Insert attachment reference"
                type="button"
                onClick={() =>
                  onInsertReference(
                    `![${asset.filename}](attachment://${asset.filename})`,
                  )
                }
              >
                attachment://{asset.filename}
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

async function readImageAsset(file: File): Promise<DocumentAssetPayload> {
  const dataUrl = await readAsDataUrl(file);
  const dataBase64 = dataUrl.split(",")[1] ?? "";

  return {
    id: crypto.randomUUID(),
    filename: file.name,
    contentType: file.type,
    dataBase64,
    sizeBytes: file.size,
  };
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("File could not be read."));
    });
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}
