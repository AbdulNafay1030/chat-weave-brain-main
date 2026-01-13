import { FileText, Download, Image as ImageIcon, File } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileAttachmentProps {
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isImageFile = (type: string) => {
  return type.startsWith('image/');
};

const isPdfFile = (type: string) => {
  return type === 'application/pdf';
};

const getFileIcon = (type: string) => {
  if (isImageFile(type)) return ImageIcon;
  if (isPdfFile(type)) return FileText;
  return File;
};

const FileAttachment = ({ fileUrl, fileName, fileType, fileSize }: FileAttachmentProps) => {
  const FileIcon = getFileIcon(fileType);

  // Render image preview for image files
  if (isImageFile(fileType)) {
    return (
      <div className="mt-2 max-w-sm">
        <a href={fileUrl} target="_blank" rel="noopener noreferrer">
          <img
            src={fileUrl}
            alt={fileName}
            className="rounded-lg max-h-64 object-cover hover:opacity-90 transition-opacity cursor-pointer"
            loading="lazy"
          />
        </a>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span className="truncate max-w-[200px]">{fileName}</span>
          {fileSize && <span>• {formatFileSize(fileSize)}</span>}
        </div>
      </div>
    );
  }

  // Render file card for other files
  return (
    <div className="mt-2 flex items-center gap-3 p-3 bg-secondary/50 rounded-lg max-w-xs">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <FileIcon className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
        <p className="text-xs text-muted-foreground">
          {fileSize ? formatFileSize(fileSize) : fileType}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0"
        asChild
      >
        <a href={fileUrl} download={fileName} target="_blank" rel="noopener noreferrer">
          <Download className="w-4 h-4" />
        </a>
      </Button>
    </div>
  );
};

export default FileAttachment;
