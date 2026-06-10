"use client";

import { useRef, useState } from "react";
import { Upload, X, FileText, Image, AlertCircle, Loader2 } from "lucide-react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/firebase";
import { parseCSVToRows, parseXLSXToRows } from "@/lib/size-guide/csvParser";
import type { SizeGuideRow } from "@/types/size-guide";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ACCEPTED_MIME_TYPES: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "application/pdf": "pdf",
    "text/csv": "csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    // Some browsers report CSV with this MIME type
    "text/plain": "csv",
    // Some systems use this for XLSX
    "application/vnd.ms-excel": "xlsx",
};

const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf", ".xlsx", ".csv"];

type UploadedFileType = "image" | "pdf" | "csv" | "xlsx";

function resolveFileType(file: File): UploadedFileType | null
{
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (file.type === "image/jpeg" || file.type === "image/png" || ext === "jpg" || ext === "jpeg" || ext === "png") return "image";
    if (file.type === "application/pdf" || ext === "pdf") return "pdf";
    if (ext === "csv" || file.type === "text/csv" || file.type === "text/plain") return "csv";
    if (ext === "xlsx" || file.type.includes("spreadsheetml") || file.type === "application/vnd.ms-excel") return "xlsx";
    return null;
}

function isAcceptedFile(file: File): boolean
{
    return resolveFileType(file) !== null;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface FileUploadSectionProps
{
    tailorUID: string;
    uploadedFileUrl?: string;
    uploadedFileType?: UploadedFileType;
    onFileUploaded: (url: string, fileType: UploadedFileType, parsedRows?: SizeGuideRow[]) => void;
    onFileRemoved?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FileUploadSection({
    tailorUID,
    uploadedFileUrl,
    uploadedFileType,
    onFileUploaded,
    onFileRemoved,
}: FileUploadSectionProps)
{
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [parseWarning, setParseWarning] = useState<string | null>(null);

    // ── Validation ──────────────────────────────────────────────────────────────

    function validateFile(file: File): string | null
    {
        if (!isAcceptedFile(file))
        {
            return `Unsupported file type. Accepted formats: JPG, PNG, PDF, XLSX, CSV.`;
        }
        if (file.size > MAX_FILE_SIZE)
        {
            return `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is 10 MB.`;
        }
        return null;
    }

    // ── Upload to Firebase Storage ──────────────────────────────────────────────

    async function uploadToStorage(file: File, fileType: UploadedFileType): Promise<string>
    {
        const timestamp = Date.now();
        const ext = file.name.split(".").pop()?.toLowerCase() ?? fileType;
        const fileName = `size_guide_${timestamp}.${ext}`;
        const filePath = `size-guides/${tailorUID}/${fileName}`;

        const storageRef = ref(storage, filePath);
        const uploadTask = uploadBytesResumable(storageRef, file, {
            contentType: file.type || "application/octet-stream",
            customMetadata: {
                originalName: file.name,
                vendorId: tailorUID,
                uploadedAt: new Date().toISOString(),
            },
        });

        return new Promise((resolve, reject) =>
        {
            uploadTask.on(
                "state_changed",
                (snapshot) =>
                {
                    const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                    setUploadProgress(pct);
                },
                (err) => reject(err),
                async () =>
                {
                    const url = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(url);
                },
            );
        });
    }

    // ── Process file ────────────────────────────────────────────────────────────

    async function processFile(file: File)
    {
        setError(null);
        setParseWarning(null);

        const validationError = validateFile(file);
        if (validationError)
        {
            setError(validationError);
            return;
        }

        const fileType = resolveFileType(file)!;
        setUploading(true);
        setUploadProgress(0);

        try
        {
            const url = await uploadToStorage(file, fileType);

            // For spreadsheet files, attempt to parse rows
            if (fileType === "csv" || fileType === "xlsx")
            {
                try
                {
                    const parsedRows =
                        fileType === "csv"
                            ? await parseCSVToRows(file)
                            : await parseXLSXToRows(file);
                    onFileUploaded(url, fileType, parsedRows.length > 0 ? parsedRows : undefined);
                    if (parsedRows.length === 0)
                    {
                        setParseWarning("No data rows found in the file. You can enter measurements manually.");
                    }
                } catch
                {
                    // Parse failure is non-fatal — upload succeeded, rows just won't be pre-populated
                    setParseWarning("Could not parse the file automatically. You can enter measurements manually.");
                    onFileUploaded(url, fileType);
                }
            } else
            {
                onFileUploaded(url, fileType);
            }
        } catch (err)
        {
            setError("Upload failed. Please try again.");
            console.error("Size guide file upload error:", err);
        } finally
        {
            setUploading(false);
            setUploadProgress(0);
        }
    }

    // ── Event handlers ──────────────────────────────────────────────────────────

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>)
    {
        const file = e.target.files?.[0];
        if (file) processFile(file);
        // Reset input so the same file can be re-selected after removal
        e.target.value = "";
    }

    function handleDrop(e: React.DragEvent<HTMLDivElement>)
    {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    }

    function handleDragOver(e: React.DragEvent<HTMLDivElement>)
    {
        e.preventDefault();
        setIsDragging(true);
    }

    function handleDragLeave()
    {
        setIsDragging(false);
    }

    function handleRemove()
    {
        setError(null);
        setParseWarning(null);
        onFileRemoved?.();
    }

    // ── Render helpers ──────────────────────────────────────────────────────────

    const hasUpload = Boolean(uploadedFileUrl);
    const isImage = uploadedFileType === "image";
    const isPdf = uploadedFileType === "pdf";

    return (
        <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Upload Size Guide File</p>
            <p className="text-xs text-gray-500">
                Accepted formats: JPG, PNG, PDF, XLSX, CSV &mdash; max 10 MB.
                Spreadsheet files will be parsed to pre-fill measurement rows.
            </p>

            {/* Existing upload preview */}
            {hasUpload && !uploading && (
                <div className="relative rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
                    {isImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={uploadedFileUrl}
                            alt="Uploaded size guide"
                            className="w-full max-h-64 object-contain p-2"
                        />
                    )}
                    {isPdf && (
                        <div className="flex items-center gap-3 p-4">
                            <FileText className="h-8 w-8 text-red-500 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">PDF Size Guide</p>
                                <a
                                    href={uploadedFileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline"
                                >
                                    Open PDF
                                </a>
                            </div>
                        </div>
                    )}
                    {!isImage && !isPdf && (
                        <div className="flex items-center gap-3 p-4">
                            <FileText className="h-8 w-8 text-green-600 shrink-0" />
                            <p className="text-sm font-medium text-gray-800">
                                {uploadedFileType?.toUpperCase()} file uploaded
                            </p>
                        </div>
                    )}

                    {/* Remove button */}
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute top-2 right-2 p-1 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-300 transition-colors shadow-sm"
                        aria-label="Remove uploaded file"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Drop zone — shown when no file uploaded or uploading */}
            {(!hasUpload || uploading) && (
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => !uploading && inputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
                    aria-label="Upload size guide file"
                    className={`relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors cursor-pointer
            ${isDragging ? "border-gray-400 bg-gray-100" : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"}
            ${uploading ? "pointer-events-none opacity-70" : ""}
          `}
                >
                    {uploading ? (
                        <>
                            <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                            <p className="text-sm text-gray-600">Uploading… {uploadProgress}%</p>
                            <div className="w-full max-w-xs h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gray-700 rounded-full transition-all duration-200"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex gap-2 text-gray-400">
                                <Image className="h-6 w-6" aria-hidden />
                                <FileText className="h-6 w-6" aria-hidden />
                                <Upload className="h-6 w-6" aria-hidden />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-700">
                                    Drag &amp; drop or{" "}
                                    <span className="text-gray-900 underline underline-offset-2">browse</span>
                                </p>
                                <p className="mt-1 text-xs text-gray-500">JPG, PNG, PDF, XLSX, CSV up to 10 MB</p>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Replace file button when a file is already uploaded */}
            {hasUpload && !uploading && (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2"
                >
                    Replace file
                </button>
            )}

            {/* Hidden file input */}
            <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_EXTENSIONS.join(",")}
                onChange={handleFileChange}
                className="sr-only"
                aria-hidden
            />

            {/* Error message */}
            {error && (
                <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-700">{error}</p>
                </div>
            )}

            {/* Parse warning (non-fatal) */}
            {parseWarning && (
                <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
                    <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-700">{parseWarning}</p>
                </div>
            )}
        </div>
    );
}
