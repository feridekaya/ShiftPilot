'use client';

import { useRef, useState, useEffect } from 'react';
import Button from './ui/Button';

interface CameraCaptureProps {
  onCapture: (dataUrl: string) => void;
  onCancel: () => void;
}

export default function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    // Trigger camera automatically on mount
    inputRef.current?.click();
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function retake() {
    setPreview(null);
    // Reset input so the same file can be re-selected
    if (inputRef.current) inputRef.current.value = '';
    inputRef.current?.click();
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/*
        capture="environment" opens the rear camera on mobile.
        On desktop browsers this attribute is ignored and a file picker opens instead.
        This is the primary enforcement mechanism for camera-only capture.
      */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="hidden"
      />

      {!preview ? (
        <div className="text-center text-gray-500 py-8">
          <p className="text-sm mb-3">Kamera açılıyor...</p>
          <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
            Kamerayı Aç
          </Button>
        </div>
      ) : (
        <>
          <img src={preview} alt="Çekilen fotoğraf" className="w-full max-h-64 object-cover rounded-lg" />
          <div className="flex gap-3">
            <Button variant="secondary" onClick={retake}>Tekrar Çek</Button>
            <Button onClick={() => onCapture(preview)}>Fotoğrafı Kullan</Button>
          </div>
        </>
      )}

      <Button variant="secondary" size="sm" onClick={onCancel}>İptal</Button>
    </div>
  );
}
