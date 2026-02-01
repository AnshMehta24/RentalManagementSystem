"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { User, Upload, Loader2 } from "lucide-react";
import { uploadVendorProfileImage } from "./action";

interface ProfileImageUploadProps {
  currentImageUrl: string | null;
}

export default function ProfileImageUpload({ currentImageUrl }: ProfileImageUploadProps) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayUrl = previewUrl ?? currentImageUrl;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("image", file);
      const result = await uploadVendorProfileImage(formData);
      console.log(result);
      if (result.success && result.url) {
        setPreviewUrl(result.url);
        router.refresh();
      } else {
        setError(result.error ?? "Upload failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-start gap-3">
      <div className="relative shrink-0 w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200">
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="w-10 h-10 text-gray-400" />
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
          id="profile-image-upload"
        />
        <label
          htmlFor="profile-image-upload"
          className={`inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed ${uploading ? "pointer-events-none" : ""}`}
        >
          <Upload className="w-4 h-4" />
          {uploading ? "Uploading…" : "Upload profile image"}
        </label>
        <p className="text-xs text-gray-500">JPEG, PNG, WebP or GIF. Max 2MB.</p>
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
