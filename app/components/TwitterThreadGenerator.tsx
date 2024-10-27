'use client';

import React, { useState, useEffect } from 'react';
import PostPreview from './PostPreview';

interface TwitterThreadGeneratorProps {
  initialThread: { tweet: string; imageUrl: string | null }[];
  availableImages: string[][];  // Change this from string[] to string[][]
  onThreadChange: (newThread: { tweet: string; imageUrl: string | null }[]) => void;
  onRefreshImages: (query: string, tweetNumber?: number) => Promise<void>;
  refreshCounts: { [key: number]: number };
}

const TwitterThreadGenerator: React.FC<TwitterThreadGeneratorProps> = ({ 
  initialThread, 
  availableImages, 
  onThreadChange,
  onRefreshImages,
  refreshCounts
}) => {
  const [thread, setThread] = useState<{ tweet: string; imageUrl: string | null }[]>(initialThread);

  useEffect(() => {
    console.log('Initial thread received:', initialThread);
    setThread(initialThread);
  }, [initialThread]);

  const handleTweetChange = (index: number, content: string) => {
    console.log('Tweet change at index:', index, 'content:', content);
    const newThread = [...thread];
    newThread[index] = { ...newThread[index], tweet: content };
    setThread(newThread);
    onThreadChange(newThread);
  };

  const handleImageSelect = (index: number, imageUrl: string) => {
    const newThread = [...thread];
    newThread[index] = { 
      ...newThread[index], 
      imageUrl: newThread[index].imageUrl === imageUrl ? null : imageUrl 
    };
    setThread(newThread);
    onThreadChange(newThread);
  };

  const addTweet = () => {
    const newThread = [...thread, { tweet: '', imageUrl: null }];
    setThread(newThread);
    onThreadChange(newThread);
  };

  const removeTweet = (index: number) => {
    const newThread = thread.filter((_, i) => i !== index);
    setThread(newThread);
    onThreadChange(newThread);
  };

  const handleImageRefresh = async (query: string, tweetNumber?: number) => {
    if (onRefreshImages) {
      // Pass both query and tweet number to parent
      await onRefreshImages(query, tweetNumber);
    }
  };

  return (
    <div>
      {thread.map(({ tweet, imageUrl }, index) => {
        console.log(`Rendering tweet ${index}:`, tweet);
        return (
          <div key={index} className="mb-4">
            <h4 className="font-bold mb-2">Tweet {index + 1}</h4>
            <PostPreview
              content={tweet}
              imageUrl={imageUrl}
              availableImages={availableImages[index] || []}  // Get images for this specific tweet
              onSelectImage={(newImageUrl) => handleImageSelect(index, newImageUrl)}
              onContentChange={(newContent) => handleTweetChange(index, newContent)}
              onRefreshImages={handleImageRefresh}
              tweetNumber={index + 1}
              totalTweets={thread.length}
              refreshCount={refreshCounts[index + 1] || 0}
            />
            <button onClick={() => removeTweet(index)} className="mt-2 p-1 bg-red-500 text-white rounded">
              Remove Tweet
            </button>
          </div>
        );
      })}
      <button onClick={addTweet} className="p-2 bg-blue-500 text-white rounded">
        Add Tweet
      </button>
    </div>
  );
};

export default TwitterThreadGenerator;
