'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import ImageSelector from './ImageSelector';

interface PostPreviewProps {
  content: string;
  imageUrl: string | null;
  availableImages: string[];
  onSelectImage: (imageUrl: string) => void;
  onContentChange: (content: string) => void;
  onRefreshImages: (query: string, tweetNumber?: number) => Promise<void>;
  tweetNumber?: number;
  totalTweets?: number;
  refreshCount: number;  // Add this
}

const TWITTER_CHAR_LIMIT = 280;
const URL_LENGTH = 23;

const PostPreview: React.FC<PostPreviewProps> = ({ 
  content, 
  imageUrl, 
  availableImages, 
  onSelectImage,
  onContentChange,
  onRefreshImages,
  tweetNumber,
  totalTweets,
  refreshCount
}) => {
  const [editedContent, setEditedContent] = useState(content);

  useEffect(() => {
    console.log('PostPreview received content:', content);
    console.log('Tweet number:', tweetNumber);
    setEditedContent(content);
  }, [content]);

  const getAdjustedLength = (text: string) => {
    if (typeof text !== 'string') {
      return 0;
    }
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex) || [];
    const urlCharCount = urls.length * URL_LENGTH;
    const nonUrlCharCount = text.replace(urlRegex, '').length;
    return urlCharCount + nonUrlCharCount;
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    if (getAdjustedLength(newContent) <= TWITTER_CHAR_LIMIT) {
      setEditedContent(newContent);
      onContentChange(newContent);
    }
  };

  const getCharCountColor = () => {
    const adjustedLength = getAdjustedLength(editedContent);
    if (adjustedLength > TWITTER_CHAR_LIMIT - 10) return 'text-red-500';
    if (adjustedLength > TWITTER_CHAR_LIMIT - 20) return 'text-yellow-500';
    return 'text-gray-500';
  };

  return (
    <div className="border rounded-lg p-4 mb-4 bg-white shadow-md">
      <div className="mb-2">
        <div className="flex items-center mb-2">
          <div className="w-10 h-10 bg-gray-300 rounded-full mr-2"></div>
          <div>
            <p className="font-bold">User Name</p>
            <p className="text-sm text-gray-500">@username</p>
          </div>
        </div>
        {imageUrl && imageUrl.trim() !== '' && (  // Add check here
          <div className="relative w-40 h-40 mt-2 mb-2">
            <Image
              src={imageUrl}
              alt="Selected post image"
              layout="fill"
              objectFit="contain"
              className="rounded-lg"
            />
          </div>
        )}
      </div>
      
      {/* Add tweet numbering if it's part of a thread */}
      {tweetNumber && totalTweets && (
        <div className="text-gray-500 mb-2 font-medium">
          {tweetNumber}/{totalTweets}
        </div>
      )}
      
      <textarea
        value={editedContent}
        onChange={handleContentChange}
        className="w-full p-2 border rounded mb-2"
        rows={5}
      />
      <div className={`text-right ${getCharCountColor()}`}>
        {getAdjustedLength(editedContent)}/{TWITTER_CHAR_LIMIT}
      </div>
      <div className="flex justify-between text-gray-500 mb-2">
        <span>❤️ 0</span>
        <span>🔄 0</span>
        <span>💬 0</span>
      </div>
      
      {/* Replace the old image selection with ImageSelector */}
      <ImageSelector
        images={availableImages}
        selectedImage={imageUrl}
        onSelectImage={onSelectImage}
        onRefreshImages={onRefreshImages}
        tweetNumber={tweetNumber}
        refreshCount={refreshCount}
      />
    </div>
  );
};

export default PostPreview;
