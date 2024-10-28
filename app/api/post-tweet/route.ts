import { NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_SECRET!,
  accessToken: process.env.TWITTER_ACCESS_TOKEN!,
  accessSecret: process.env.TWITTER_ACCESS_SECRET!,
});

export async function POST(req: Request) {
  try {
    const { text, imageUrl } = await req.json();

    // If there's an image, download it and upload to Twitter
    let mediaId: string | undefined;
    if (imageUrl) {
      // Download image
      const imageResponse = await fetch(imageUrl);
      const buffer = Buffer.from(await imageResponse.arrayBuffer());
      
      // Upload to Twitter
      mediaId = await client.v1.uploadMedia(buffer, { 
        mimeType: imageResponse.headers.get('content-type') || 'image/jpeg' 
      });
    }

    // Post tweet with media if available
    const tweet = await client.v2.tweet({
      text,
      ...(mediaId && { media: { media_ids: [mediaId] } })
    });

    return NextResponse.json({ success: true, tweet });
  } catch (error) {
    console.error('Error posting tweet:', error);
    return NextResponse.json(
      { error: 'Failed to post tweet' },
      { status: 500 }
    );
  }
}
