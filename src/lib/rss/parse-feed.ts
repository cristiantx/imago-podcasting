import Parser from "rss-parser";

type ParsedEpisode = {
  guid: string;
  title: string;
  publishedAt: Date | null;
  audioUrl: string;
  episodeUrl: string;
  episodeImageUrl: string | null;
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
  itunes?: { duration?: string; image?: unknown };
  itunesDuration?: string;
  itunesImage?: unknown;
  mediaThumbnail?: unknown;
};

const parser = new Parser<unknown, FeedItem>({
  customFields: {
    item: [
      ["itunes:duration", "itunesDuration"],
      ["itunes:image", "itunesImage"],
      ["media:thumbnail", "mediaThumbnail"]
    ]
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
        episodeImageUrl: extractEpisodeImageUrl(item),
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

function extractEpisodeImageUrl(item: FeedItem): string | null {
  const imageCandidate = [item.itunesImage, item.mediaThumbnail, item.itunes?.image];

  for (const candidate of imageCandidate) {
    const resolved = resolveImageUrl(candidate);
    if (resolved) {
      return resolved;
    }
  }

  return null;
}

function resolveImageUrl(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const resolved = resolveImageUrl(item);
      if (resolved) {
        return resolved;
      }
    }
    return null;
  }

  if (typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;

  const directHref = record.href;
  if (typeof directHref === "string" && directHref.trim().length > 0) {
    return directHref.trim();
  }

  const directUrl = record.url;
  if (typeof directUrl === "string" && directUrl.trim().length > 0) {
    return directUrl.trim();
  }

  const attrs = record.$ as Record<string, unknown> | undefined;
  if (attrs) {
    const attrHref = attrs.href;
    if (typeof attrHref === "string" && attrHref.trim().length > 0) {
      return attrHref.trim();
    }

    const attrUrl = attrs.url;
    if (typeof attrUrl === "string" && attrUrl.trim().length > 0) {
      return attrUrl.trim();
    }
  }

  return null;
}
