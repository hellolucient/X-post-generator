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
    const { tweets } = await req.json();
    let previousTweetId: string | undefined;
    const postedTweets = [];

    for (const tweet of tweets) {
      let mediaId: string | undefined;
      
      if (tweet.imageUrl) {
        // Download image
        const imageResponse = await fetch(tweet.imageUrl);
        const buffer = Buffer.from(await imageResponse.arrayBuffer());
        
        // Upload to Twitter
        mediaId = await client.v1.uploadMedia(buffer, { 
          mimeType: imageResponse.headers.get('content-type') || 'image/jpeg' 
        });
      }

      // Post tweet in thread
      const postedTweet = await client.v2.tweet({
        text: tweet.text,
        ...(mediaId && { media: { media_ids: [mediaId] } }),
        ...(previousTweetId && { reply: { in_reply_to_tweet_id: previousTweetId } })
      });

      previousTweetId = postedTweet.data.id;
      postedTweets.push(postedTweet);
    }

    return NextResponse.json({ success: true, tweets: postedTweets });
  } catch (error) {
    console.error('Error posting thread:', error);
    return NextResponse.json(
      { error: 'Failed to post thread' },
      { status: 500 }
    );
  }
}
