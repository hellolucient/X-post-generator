'use client';

import React, { useState } from 'react';
import { GoogleResult, SearchResult } from '../types/search';

interface SearchResultsProps {
  results: SearchResult;
  onSelectResult: (content: string, type: 'tweet' | 'thread') => void;
  loading: boolean;
  isGenerating: boolean; // Add this line
}

type FilterType = 'all' | 'google' | 'twitter';
type SortType = 'relevance' | 'twitter-first' | 'google-first';

interface Notification {
  message: string;
  type: 'success' | 'error';
  retryData?: {
    result: GoogleResult;
    type: 'tweet' | 'thread';
  };
}

export default function SearchResults({ results, onSelectResult, loading, isGenerating }: SearchResultsProps) {
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('relevance');

  // Filter and sort results
  const filteredResults = results.google.filter(result => {
    if (filter === 'all') return true;
    if (filter === 'google') return !result.isTwitter;
    if (filter === 'twitter') return result.isTwitter;
    return true;
  });

  const sortedResults = [...filteredResults].sort((a, b) => {
    if (sortBy === 'twitter-first') return (b.isTwitter ? 1 : 0) - (a.isTwitter ? 1 : 0);
    if (sortBy === 'google-first') return (a.isTwitter ? 1 : 0) - (b.isTwitter ? 1 : 0);
    return 0; // relevance is already handled by the API
  });

  const handleGenerate = async (result: GoogleResult, type: 'tweet' | 'thread') => {
    const tryGenerate = async () => {
      try {
        setNotification(null);
        setGeneratingFor(`${result.id}-${type}`);
        
        try {
          await onSelectResult(`${result.title}\n\n${result.snippet}\n\n${result.link}`, type);
          setNotification({
            message: `${type} generated successfully!`,
            type: 'success'
          });
          setTimeout(() => {
            setNotification(null);
          }, 2000);
        } catch (err) {
          throw err;
        }
      } catch (err) {
        console.error('Generation error:', err);
        setNotification({
          message: `Failed to generate ${type}. Click Retry Generation`,  // Updated message
          type: 'error',
          retryData: {
            result: result,
            type: type
          }
        });
      } finally {
        setGeneratingFor(null);
      }
    };

    await tryGenerate();
  };

  // Use loading and isGenerating in your component logic
  // For example:
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {notification && (
        <div 
          className={`p-4 rounded-lg mb-4 ${
            notification.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-600'
          }`}
        >
          <div className="flex justify-between items-center">
            <span>{notification.message}</span>
            {notification.type === 'error' && notification.retryData && (
              <button
                onClick={() => {
                  if (notification.retryData) {  // Add this type guard
                    handleGenerate(
                      notification.retryData.result,
                      notification.retryData.type
                    );
                  }
                }}
                className="ml-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Retry Generation
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Show Results</label>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterType)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">All Results</option>
            <option value="google">Google Only</option>
            <option value="twitter">Twitter Only</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortType)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="relevance">Relevance</option>
            <option value="twitter-first">Twitter First</option>
            <option value="google-first">Google First</option>
          </select>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Search Results</h2>
        <div className="space-y-4">
          {sortedResults.map((result) => (
            <div 
              key={result.id} 
              className={`p-4 border rounded-lg ${result.isTwitter ? 'bg-blue-50' : ''} relative`}
            >
              {result.isTwitter && (
                <div className="text-blue-500 text-sm mb-2">
                  From Twitter
                </div>
              )}
              <h3 className="font-bold">{result.title}</h3>
              <p>{result.snippet}</p>
              <div className="flex flex-col sm:flex-row gap-2 mt-2 w-full sm:justify-end">
                <button 
                  onClick={() => handleGenerate(result, 'tweet')}
                  className={`px-3 py-1 w-[150px] text-center ${
                    generatingFor === `${result.id}-tweet`
                      ? 'bg-yellow-500 cursor-not-allowed' 
                      : 'bg-blue-500 hover:bg-blue-600'
                  } text-white rounded relative`}
                  disabled={generatingFor !== null}
                >
                  {generatingFor === `${result.id}-tweet` ? (
                    <>
                      <span className="opacity-0">Generate Tweet</span>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      </div>
                    </>
                  ) : (
                    'Generate Tweet'
                  )}
                </button>
                <button 
                  onClick={() => handleGenerate(result, 'thread')}
                  className={`px-3 py-1 w-[150px] text-center ${
                    generatingFor === `${result.id}-thread`
                      ? 'bg-yellow-500 cursor-not-allowed' 
                      : 'bg-green-500 hover:bg-green-600'
                  } text-white rounded relative overflow-hidden`}
                  disabled={generatingFor !== null}
                >
                  {generatingFor === `${result.id}-thread` ? (
                    <>
                      <span className="opacity-0">Generate Thread</span>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </>
                  ) : (
                    'Generate Thread'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-bold mb-4">Related Tweets</h2>
        {results.twitter.length > 0 ? (
          <div className="space-y-4">
            {results.twitter.map((tweet) => (
              <div 
                key={tweet.id} 
                className="p-4 border rounded-lg hover:bg-gray-50"
              >
                <p>{tweet.text}</p>
                <div className="flex gap-4 mt-2 text-sm text-gray-500">
                  <span>♥ {tweet.metrics.like_count}</span>
                  <span>🔄 {tweet.metrics.retweet_count}</span>
                  <span>💬 {tweet.metrics.reply_count}</span>
                  <span>{new Date(tweet.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 border rounded-lg bg-gray-50">
            <p className="text-gray-600">
              Twitter search results are not available in the current API tier. 
              The thread generator will work with Google search results.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
