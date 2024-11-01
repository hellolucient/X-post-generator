'use client';

import React, { useState, ChangeEvent } from 'react';
import Image from 'next/image';

interface ImageSelectorProps {
  images: string[];
  onRefreshImages: (query: string, tweetNumber?: number) => Promise<void>;
  onSelectImage: (imageUrl: string) => void;
  selectedImage: string | null;
  tweetNumber?: number;
  refreshCount: number;
  onUploadImage: (e: ChangeEvent<HTMLInputElement>) => void;
}

export default function ImageSelector({ 
  images, 
  onRefreshImages, 
  onSelectImage, 
  selectedImage,
  tweetNumber,
  refreshCount,
  onUploadImage
}: ImageSelectorProps) {
  const [customQuery, setCustomQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const MAX_REFRESHES = 3;

  const handleRefresh = async () => {
    if (refreshCount >= MAX_REFRESHES && !customQuery) {
      alert('Please enter a more specific image request');
      return;
    }

    setIsLoading(true);
    try {
      await onRefreshImages(customQuery, tweetNumber);
    } finally {
      setIsLoading(false);
    }
  };

  const isLimitReached = refreshCount >= MAX_REFRESHES && !customQuery;

  // Filter out invalid image URLs
  const validImages = images.filter(img => 
    typeof img === 'string' && img.length > 0
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={customQuery}
          onChange={(e) => setCustomQuery(e.target.value)}
          placeholder={isLimitReached ? "Enter specific image request..." : "Specific image search terms..."}
          className={`flex-1 p-2 border rounded ${
            isLimitReached ? 'border-yellow-500' : ''
          }`}
        />
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className={`px-4 py-2 ${
            isLoading ? 'bg-gray-400' : 
            isLimitReached ? 'bg-yellow-500' :
            'bg-blue-500 hover:bg-blue-600'
          } text-white rounded`}
        >
          {isLoading ? 'Loading...' : 'Refresh Images'}
        </button>
      </div>

      {isLimitReached && (
        <div className="text-yellow-600 text-sm">
          Please enter a more specific image request
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {validImages.map((img, index) => (
          <div key={`${img}-${index}`} className="relative w-20 h-20">
            <Image
              src={img}
              alt={`Image option ${index + 1}`}
              layout="fill"
              objectFit="cover"
              className={`rounded cursor-pointer ${selectedImage === img ? 'border-4 border-blue-500' : ''}`}
              onClick={() => onSelectImage(img)}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        ))}
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload your own image
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={onUploadImage}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>
    </div>
  );
}
