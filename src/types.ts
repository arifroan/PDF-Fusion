export type ToolId = 'all' | 'merge' | 'jpg-to-pdf' | 'split' | 'compress' | 'pdf-to-jpg' | 'watermark';

export interface PDFFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount?: number;
  status: 'pending' | 'processing' | 'success' | 'error';
  errorMessage?: string;
  previewUrl?: string;
}

export interface ImageFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  objectUrl: string;
  status: 'pending' | 'processing' | 'success' | 'error';
}

export type PageOrientation = 'portrait' | 'landscape';
export type PageSize = 'A4' | 'LETTER' | 'FIT';
export type PageMargin = 'none' | 'small' | 'medium' | 'large';

export interface ImageConversionConfig {
  orientation: PageOrientation;
  pageSize: PageSize;
  margin: PageMargin;
}
