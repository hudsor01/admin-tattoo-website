'use client';

import type { PutBlobResult } from '@vercel/blob';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  type?: 'tattoo-design' | 'portfolio' | 'avatar' | 'media';
  accept?: string;
  maxSize?: number; // in MB
  onUploadComplete?: (blob: PutBlobResult) => void;
  className?: string;
}

export function FileUpload({ 
  type = 'media',
  accept = 'image/jpeg, image/png, image/webp',
  maxSize = 4.5, // Vercel server upload limit
  onUploadComplete,
  className
}: FileUploadProps) {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [blob, setBlob] = useState<PutBlobResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!inputFileRef.current?.files) {
      setError('No file selected');
      return;
    }

    const file = inputFileRef.current.files[0];
    
    if (!file) {
      setError('No file selected');
      return;
    }

    // Validate file size
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`File too large. Maximum size is ${maxSize}MB.`);
      return;
    }

    setIsUploading(true);

    try {
      const response = await fetch(
        `/api/upload?filename=${encodeURIComponent(file.name)}&type=${type}`,
        {
          method: 'POST',
          body: file,
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const newBlob = (await response.json()) as PutBlobResult;
      setBlob(newBlob);
      onUploadComplete?.(newBlob);
      
      toast({
        title: 'Success',
        description: 'File uploaded successfully',
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const clearSelection = () => {
    setBlob(null);
    setError(null);
    setSelectedFile(null);
    if (inputFileRef.current) {
      inputFileRef.current.value = '';
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'tattoo-design':
        return 'Tattoo Design';
      case 'portfolio':
        return 'Portfolio Image';
      case 'avatar':
        return 'Avatar';
      default:
        return 'Media File';
    }
  };

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const {files} = e.dataTransfer;
    if (files && files[0]) {
      setSelectedFile(files[0]);
      if (inputFileRef.current) {
        // Create a new FileList-like object
        const dt = new DataTransfer();
        dt.items.add(files[0]);
        inputFileRef.current.files = dt.files;
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload {getTypeLabel()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpload} className="space-y-4">
          {/* Drag and Drop Zone */}
          <div
            className={`
              border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
              ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
              ${selectedFile ? 'border-green-500 bg-green-50' : ''}
              ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5'}
            `}
            role="button"
            tabIndex={0}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !isUploading && inputFileRef.current?.click()}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && !isUploading) {
                e.preventDefault()
                inputFileRef.current?.click()
              }
            }}
          >
            {selectedFile ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  {type === 'avatar' || type === 'tattoo-design' || type === 'portfolio' || type === 'media' ? (
                    <Upload className="h-8 w-8 text-green-600" />
                  ) : (
                    <Upload className="h-8 w-8 text-green-600" />
                  )}
                  <span className="font-medium text-green-700">{selectedFile.name}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">
                    Drop your {getTypeLabel().toLowerCase()} here, or{' '}
                    <span className="text-primary hover:underline">browse</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Max size: {maxSize}MB. Accepted formats: {accept.replace(/image\//g, '').replace(/video\//g, '').toUpperCase()}
                  </p>
                </div>
              </div>
            )}
          </div>

          <Input
            ref={inputFileRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />

          {error ? <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert> : null}

          {blob ? <Alert>
              <Check className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>File uploaded successfully!</p>
                  <div className="flex items-center gap-2">
                    <a 
                      href={blob.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate"
                    >
                      {blob.url}
                    </a>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearSelection}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert> : null}

          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={isUploading}
              className="flex-1"
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
            {blob ? <Button
                type="button"
                variant="outline"
                onClick={clearSelection}
              >
                Upload Another
              </Button> : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
