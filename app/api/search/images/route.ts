import { NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;

export async function POST(req: Request) {
  try {
    const { searchTerm, start = 1 } = await req.json();
    
    const imageUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(searchTerm)}&searchType=image&num=7&start=${start}`;
    
    const response: Response = await fetch(imageUrl);
    const data = await response.json();

    if (!response.ok) {
      throw new Error('Failed to fetch image search results');
    }

    const images = data.items?.map((item: any) => item.link) || [];
    
    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}
