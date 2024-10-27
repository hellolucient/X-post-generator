import { NextResponse } from 'next/server';
import OpenAI from 'openai';

interface TweetContent {
  tweet: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { searchResult } = await req.json();
    console.log('Received search result:', searchResult);

    const prompt = `
      Create a single engaging tweet based on this content:
      ${searchResult}

      Rules:
      1. Must be under 280 characters
      2. Make it engaging and conversational
      3. Include 1-2 relevant hashtags
      4. Focus on the most important point
      5. End with either a hook or call to action

      Return just the tweet text, no additional formatting.
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
    });

    const tweetContent = completion.choices[0].message.content?.trim();
    console.log('Generated tweet content:', tweetContent);
    
    if (!tweetContent) {
      throw new Error('No tweet content generated');
    }

    // Return the content directly, not wrapped in an array
    return NextResponse.json({ content: tweetContent });
  } catch (error) {
    console.error('Error generating tweet:', error);
    return NextResponse.json(
      { error: 'Failed to generate tweet' },
      { status: 500 }
    );
  }
}
