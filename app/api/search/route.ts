import { NextResponse } from 'next/server';
// Remove axios import since we're using fetch
// import axios from 'axios';

// Twitter API Client
// import { TwitterApi, TweetV2 } from 'twitter-api-v2';

// const twitterClient = new TwitterApi({
//   appKey: process.env.TWITTER_API_KEY!,
//   appSecret: process.env.TWITTER_API_SECRET!,
//   accessToken: process.env.TWITTER_ACCESS_TOKEN!,
//   accessSecret: process.env.TWITTER_ACCESS_SECRET!,
// });

interface GoogleSearchItem {
  cacheId?: string;
  title: string;
  snippet: string;
  link: string;
  pagemap?: {
    cse_image?: { src: string }[];
  };
}

interface GoogleSearchResponse {
  items?: GoogleSearchItem[];
}

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  console.log('Search query:', query);

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    // First, fetch web results
    const webUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}`;
    const webResponse = await fetch(webUrl);
    const webData: GoogleSearchResponse = await webResponse.json();

    if (!webResponse.ok) {
      console.error('Google API error (web):', webData);
      throw new Error('Failed to fetch web search results');
    }

    // Then, fetch image results - update num=5 to num=7
    const imageUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&searchType=image&num=7`;
    const imageResponse = await fetch(imageUrl);
    const imageData: GoogleSearchResponse = await imageResponse.json();

    if (!imageResponse.ok) {
      console.error('Google API error (image):', imageData);
      throw new Error('Failed to fetch image search results');
    }

    // Extract image results
    const imageResults = imageData.items?.map((item: GoogleSearchItem) => item.link) || [];

    // Combine web results with image URLs
    const combinedResults = webData.items?.map((item: GoogleSearchItem, index: number) => ({
      id: item.cacheId || `result-${index}`,
      title: item.title,
      snippet: item.snippet,
      link: item.link,
      images: imageResults,
    })) || [];

    console.log('Combined results:', combinedResults);

    return NextResponse.json({ items: combinedResults });
  } catch (error) {
    console.error('Error fetching search results:', error);
    return NextResponse.json({ error: 'Failed to fetch search results' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { searchTerm } = await req.json();
    
    // Only do Google search for now
    const googleResults = await searchGoogle(searchTerm);

    // Return empty array for twitter results since we don't have search access
    return NextResponse.json({
      google: googleResults,
      twitter: [] // Empty array since we don't have search access in FREE tier
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Failed to fetch search results' }, { status: 500 });
  }
}

async function searchGoogle(searchTerm: string) {
  // Regular search
  const webUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(searchTerm)}`;
  
  // Twitter-specific search
  const twitterSearchUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(`site:twitter.com ${searchTerm}`)}`;
  
  // Image search
  const imageUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(searchTerm)}&searchType=image&num=7`;

  const [webResponse, twitterResponse, imageResponse] = await Promise.all([
    fetch(webUrl),
    fetch(twitterSearchUrl),
    fetch(imageUrl)
  ]);

  const [webData, twitterData, imageData]: [GoogleSearchResponse, GoogleSearchResponse, GoogleSearchResponse] = await Promise.all([
    webResponse.json(),
    twitterResponse.json(),
    imageResponse.json()
  ]);

  const imageResults = imageData.items?.map((item: GoogleSearchItem) => item.link) || [];

  // Process regular web results
  const webResults = webData.items?.map((item: GoogleSearchItem, index: number) => ({
    id: item.cacheId || `result-${index}`,
    title: item.title,
    snippet: item.snippet,
    link: item.link,
    images: imageResults,
    isTwitter: false
  })) || [];

  // Process Twitter-specific results
  const twitterResults = twitterData.items?.map((item: GoogleSearchItem, index: number) => ({
    id: item.cacheId || `twitter-${index}`,
    title: item.title,
    snippet: item.snippet,
    link: item.link,
    images: imageResults,
    isTwitter: true
  })) || [];

  // Combine and sort results, prioritizing relevant content
  return [...webResults, ...twitterResults].sort((a, b) => {
    // Prioritize Twitter results if they seem more relevant
    const aRelevance = getRelevanceScore(a, searchTerm);
    const bRelevance = getRelevanceScore(b, searchTerm);
    return bRelevance - aRelevance;
  });
}

function getRelevanceScore(result: { title: string; snippet: string; isTwitter: boolean }, searchTerm: string): number {
  let score = 0;
  const terms = searchTerm.toLowerCase().split(' ');

  // Higher score for Twitter results
  if (result.isTwitter) score += 2;

  // Check title relevance
  if (result.title) {
    const titleLower = result.title.toLowerCase();
    terms.forEach(term => {
      if (titleLower.includes(term)) score += 1;
    });
  }

  // Check snippet relevance
  if (result.snippet) {
    const snippetLower = result.snippet.toLowerCase();
    terms.forEach(term => {
      if (snippetLower.includes(term)) score += 0.5;
    });
  }

  return score;
}

// Remove or comment out the searchTwitter function since we can't use it
// async function searchTwitter(searchTerm: string) { ... }
