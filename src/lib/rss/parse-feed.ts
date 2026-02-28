import Parser from "rss-parser";

type ParsedEpisode = {
  guid: string;
  title: string;
  publishedAt: Date | null;
  audioUrl: string;
  episodeUrl: string;
  durationSec: number | null;
};

type ParsedFeed = {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  language: string;
  episodes: ParsedEpisode[];
};

type FeedItem = {
  guid?: string;
  id?: string;
  title?: string;
  pubDate?: string;
  isoDate?: string;
  enclosure?: { url?: string };
  link?: string;
  itunes?: { duration?: string };
  itunesDuration?: string;
};

const parser = new Parser<unknown, FeedItem>({
  customFields: {
    item: [["itunes:duration", "itunesDuration"]]
  }
});

export async function parseRssFeed(url: string): Promise<ParsedFeed> {
  const feed = await parser.parseURL(url);
  const feedLanguage = (feed as unknown as { language?: string }).language;

  const episodes = (feed.items ?? [])
    .map((item) => {
      const guid = item.guid ?? item.id ?? item.link;
      const audioUrl = item.enclosure?.url;
      const title = item.title?.trim();

      if (!guid || !audioUrl || !title) {
        return null;
      }

      const publishedAt = item.isoDate ? new Date(item.isoDate) : item.pubDate ? new Date(item.pubDate) : null;
      const durationRaw = item.itunes?.duration ?? item.itunesDuration;

      return {
        guid,
        title,
        publishedAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
        audioUrl,
        episodeUrl: item.link ?? audioUrl,
        durationSec: parseDuration(durationRaw)
      } satisfies ParsedEpisode;
    })
    .filter((item): item is ParsedEpisode => Boolean(item))
    .sort((a, b) => {
      const left = a.publishedAt ? a.publishedAt.getTime() : 0;
      const right = b.publishedAt ? b.publishedAt.getTime() : 0;
      return right - left;
    });

  return {
    title: feed.title ?? null,
    description: feed.description ?? null,
    imageUrl: typeof feed.image === "object" && feed.image && "url" in feed.image ? String(feed.image.url ?? "") || null : null,
    language: feedLanguage ?? "en",
    episodes
  };
}

function parseDuration(raw: string | undefined): number | null {
  if (!raw) {
    return null;
  }

  if (/^\d+$/.test(raw)) {
    return Number(raw);
  }

  const parts = raw.split(":").map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part))) {
    return null;
  }

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  return null;
}
