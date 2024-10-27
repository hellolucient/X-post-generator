import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Add interface for tweet content
interface TweetContent {
  tweet: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { searchResult } = await req.json();

    const prompt = `
      Create a Twitter thread with exactly 7 tweets based on this content:
      ${searchResult}

      Rules:
      1. Each tweet must be under 280 characters
      2. Make it engaging and conversational
      3. Include relevant hashtags where appropriate
      4. Break down complex ideas into digestible tweets
      5. End with a call to action or thought-provoking question
      6. Format each tweet on a new line, starting with "Tweet: "
      7. Must provide exactly 7 tweets

      Example format:
      Tweet: First tweet content here
      Tweet: Second tweet content here
      Tweet: Third tweet content here
      Tweet: Fourth tweet content here
      Tweet: Fifth tweet content here
      Tweet: Sixth tweet content here
      Tweet: Final tweet with call to action
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
    });

    const threadContent = completion.choices[0].message.content;
    
    // Better parsing of the response
    const tweets = threadContent
      ?.split('\n')
      .filter(line => line.trim().startsWith('Tweet:'))
      .map(line => ({
        tweet: line.replace(/^Tweet:\s*/, '').trim()
      }));

    // Ensure we have exactly 7 tweets
    if (!tweets || tweets.length !== 7) {
      return NextResponse.json(
        { error: 'Invalid number of tweets generated' },
        { status: 500 }
      );
    }

    return NextResponse.json({ content: tweets });
  } catch (error) {
    console.error('Error generating thread:', error);
    return NextResponse.json(
      { error: 'Failed to generate Twitter thread' },
      { status: 500 }
    );
  }
}
