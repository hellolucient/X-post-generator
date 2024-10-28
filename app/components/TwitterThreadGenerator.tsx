'use client';

import React, { useState, useEffect } from 'react';
import PostPreview from './PostPreview';

interface TwitterThreadGeneratorProps {
  initialThread: { tweet: string; imageUrl: string | null }[];
  availableImages: string[][];
  onThreadChange: (thread: { tweet: string; imageUrl: string | null }[]) => void;
  onRefreshImages: (query: string, tweetNumber?: number) => Promise<void>;
  refreshCounts: { [key: number]: number };
  onUploadImage: (file: File) => Promise<void>;
}

const TwitterThreadGenerator: React.FC<TwitterThreadGeneratorProps> = ({ 
  initialThread, 
  availableImages, 
  onThreadChange,
  onRefreshImages,
  refreshCounts,
  onUploadImage
}) => {
  const [thread, setThread] = useState<{ tweet: string; imageUrl: string | null }[]>(initialThread);
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

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

  const handlePostToTwitter = async () => {
    setIsPosting(true);
    setPostError(null);
    
    try {
      const response = await fetch('/api/post-thread', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tweets: thread.map(t => ({
            text: t.tweet,
            imageUrl: t.imageUrl
          }))
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to post thread');
      }

      // Show success message or redirect to Twitter
      window.open(`https://twitter.com/i/status/${data.tweets[0].data.id}`, '_blank');
    } catch (error) {
      console.error('Error posting thread:', error);
      setPostError(error instanceof Error ? error.message : 'Failed to post thread');
    } finally {
      setIsPosting(false);
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
              availableImages={availableImages[index] || []}
              onSelectImage={(newImageUrl) => handleImageSelect(index, newImageUrl)}
              onContentChange={(newContent) => handleTweetChange(index, newContent)}
              onRefreshImages={handleImageRefresh}
              tweetNumber={index + 1}
              totalTweets={thread.length}
              refreshCount={refreshCounts[index + 1] || 0}
              onUploadImage={onUploadImage}
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
      
      <div className="mt-4">
        <button
          onClick={handlePostToTwitter}
          disabled={isPosting}
          className={`w-full py-2 px-4 rounded ${
            isPosting 
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white font-medium`}
        >
          {isPosting ? 'Posting...' : 'Post to X'}
        </button>
        
        {postError && (
          <div className="mt-2 text-red-500 text-sm">
            {postError}
          </div>
        )}
      </div>
    </div>
  );
};

export default TwitterThreadGenerator;
