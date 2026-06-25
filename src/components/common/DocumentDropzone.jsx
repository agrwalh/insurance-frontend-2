import { useState, useRef } from "react";
import { formatFileSize } from "../../utils/formatters";

const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
const ACCEPTED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"];
const MAX_SIZE_MB = 10;
export default function DocumentDropzone({ onFileSelected }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileError, setFileError] = useState("");
  const inputRef = useRef(null);

  const getExtension = (filename) => {
    const dotIndex = filename.lastIndexOf(".");
    return dotIndex === -1 ? "" : filename.slice(dotIndex).toLowerCase();
  };

  const validateAndSet = (file) => {
    setFileError("");

    if (!file) return;
    if (file.size === 0) {
      setFileError("This file appears to be empty.");
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setFileError(`File must be smaller than ${MAX_SIZE_MB}MB.`);
      return;
    }

    const extension = getExtension(file.name);
    const extensionOk = ACCEPTED_EXTENSIONS.includes(extension);
    const mimeOk = ACCEPTED_TYPES.includes(file.type);
    if (!extensionOk || !mimeOk) {
      setFileError("Only PDF, JPG, and PNG files are allowed.");
      return;
    }

    setSelectedFile(file);
    onFileSelected(file);

    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    validateAndSet(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleBrowseClick = () => {
    inputRef.current?.click();
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    validateAndSet(file);
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileError("");
    onFileSelected(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <div
        className={`dropzone ${isDragging ? "dropzone-active" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleBrowseClick}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileInput}
          style={{ display: "none" }}
        />

        {!selectedFile && (
          <div className="dropzone-empty">
            <p className="dropzone-title">Drag & drop a file here</p>
            <p className="dropzone-hint">or click to browse (PDF, JPG, PNG · max {MAX_SIZE_MB}MB)</p>
          </div>
        )}

        {selectedFile && (
          <div className="dropzone-preview" onClick={(e) => e.stopPropagation()}>
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="preview-thumb" />
            ) : (
              <div className="preview-file-icon">PDF</div>
            )}
            <div className="preview-info">
              <p className="preview-name">{selectedFile.name}</p>
              <p className="preview-size">{formatFileSize(selectedFile.size)}</p>
            </div>
            <button type="button" className="preview-remove" onClick={clearSelection}>
              Remove
            </button>
          </div>
        )}
      </div>

      {fileError && <span className="field-error">{fileError}</span>}
    </div>
  );
}
