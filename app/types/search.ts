export interface GoogleResult {
  id: string;
  title: string;
  snippet: string;
  link: string;
  images: string[];
  isTwitter: boolean;
}

export interface TwitterResult {
  id: string;
  text: string;
  metrics: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
  };
  created_at: string;
}

export interface SearchResult {
  google: GoogleResult[];
  twitter: TwitterResult[];
}
