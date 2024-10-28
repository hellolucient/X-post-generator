'use client';

import React, { useState } from 'react';
import SearchForm from './components/SearchForm';
import SearchResults from './components/SearchResults';
import TwitterThreadGenerator from './components/TwitterThreadGenerator';
import { SearchResult } from './types/search';

export default function Home() {
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [thread, setThread] = useState<{ tweet: string; imageUrl: string | null }[]>([
    { tweet: '', imageUrl: null }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [availableImages, setAvailableImages] = useState<string[][]>([[]]);
  const [refreshCounts, setRefreshCounts] = useState<{ [key: number]: number }>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ searchTerm: query }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const results: SearchResult = await response.json();
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectResult = async (content: string, type: 'tweet' | 'thread') => {
    try {
      setIsGenerating(true);
      const endpoint = type === 'tweet' 
        ? '/api/generate-tweet'
        : '/api/generate-twitter-thread';

      console.log('Sending request to:', endpoint);
      console.log('With content:', content);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ searchResult: content }),
      });

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || `Failed to generate ${type}: ${data.details || 'Unknown error'}`);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Handle single tweet
      if (type === 'tweet') {
        if (typeof data.content !== 'string') {
          console.error('Invalid content received:', data);
          throw new Error('Invalid tweet content received');
        }
        setThread([{ tweet: data.content, imageUrl: null }]);
        // Initialize images for single tweet
        if (searchResults?.google[0]?.images) {
          setAvailableImages([[...searchResults.google[0].images]]);
        }
      } 
      // Handle thread
      else {
        if (!Array.isArray(data.content)) {
          throw new Error('Invalid thread content received');
        }
        const newThread = data.content.map((item: { tweet: string }) => ({
          tweet: item.tweet,
          imageUrl: null
        }));
        setThread(newThread);
        // Initialize images for thread
        if (searchResults?.google[0]?.images) {
          const initialImages = Array(newThread.length)
            .fill(null)
            .map(() => [...searchResults.google[0].images]);
          setAvailableImages(initialImages);
        }
      }

      // Reset refresh counts
      setRefreshCounts({});
    } catch (error) {
      console.error(`Error generating ${type}:`, error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefreshImages = async (query: string, tweetNumber?: number) => {
    try {
      // Check refresh count before making the request
      if (!query && tweetNumber !== undefined) {
        const currentCount = refreshCounts[tweetNumber] || 0;
        if (currentCount >= 3) {
          alert('Please enter a more specific image request');
          return;
        }
      }

      const searchTerm = query || searchResults?.google[0]?.title || '';
      const offset = Math.floor(Math.random() * 50);
      
      const response = await fetch('/api/search/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          searchTerm,
          start: offset
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.images) {
        throw new Error('Failed to fetch images');
      }

      if (tweetNumber !== undefined) {
        setAvailableImages(prevImages => {
          const newImages = [...prevImages];
          while (newImages.length <= tweetNumber) {
            newImages.push([]);
          }
          newImages[tweetNumber - 1] = data.images;
          return newImages;
        });

        // Update refresh count only if no custom query
        if (!query) {
          setRefreshCounts(prev => ({
            ...prev,
            [tweetNumber]: (prev[tweetNumber] || 0) + 1
          }));
        } else {
          // Reset count if using custom query
          setRefreshCounts(prev => ({
            ...prev,
            [tweetNumber]: 0
          }));
        }
      } else {
        const initialImages = Array(thread.length)
          .fill(null)
          .map(() => [...data.images]);
        setAvailableImages(initialImages);
      }
    } catch (error) {
      console.error('Failed to refresh images:', error);
    }
  };

  const handleImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      // Update the thread with the new image URL
      setThread(currentThread => {
        const newThread = [...currentThread];
        if (newThread[0]) {
          newThread[0].imageUrl = data.url;
        }
        return newThread;
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      // Handle error (show message to user)
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">X Post Generator</h1>  {/* Changed from "Twitter Thread Generator" */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <SearchForm onSearch={handleSearch} />
          {searchResults && (
            <SearchResults 
              results={searchResults} 
              onSelectResult={handleSelectResult}
              isGenerating={isGenerating}
              loading={isLoading} // Add this line
            />
          )}
        </div>
        <div className="sticky top-4">
          <TwitterThreadGenerator
            initialThread={thread}
            availableImages={availableImages}
            onThreadChange={setThread}
            onRefreshImages={handleRefreshImages}
            refreshCounts={refreshCounts}
            onUploadImage={handleImageUpload}
          />
        </div>
      </div>
    </div>
  );
}
