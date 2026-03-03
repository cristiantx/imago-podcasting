import Parser from "rss-parser";

type ParsedEpisode = {
  guid: string;
  title: string;
  summary: string | null;
  publishedAt: Date | null;
  audioUrl: string;
  episodeUrl: string;
  episodeImageUrl: string | null;
  durationSec: number | null;
};

type ParsedFeed = {
  title: string | null;
  description: string | null;
  author: string | null;
  category: string | null;
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
  content?: string;
  contentSnippet?: string;
  contentEncoded?: string;
  summary?: string;
  description?: string;
};

type FeedMeta = {
  language?: string;
  managingEditor?: string;
  itunes?: {
    author?: string;
    category?: unknown;
  };
};

const parser = new Parser<unknown, FeedItem>({
  customFields: {
    item: [
      ["itunes:duration", "itunesDuration"],
      ["itunes:image", "itunesImage"],
      ["media:thumbnail", "mediaThumbnail"],
      ["content:encoded", "contentEncoded"]
    ]
  }
});

export async function parseRssFeed(url: string): Promise<ParsedFeed> {
  const feed = await parser.parseURL(url);
  const feedMeta = feed as unknown as FeedMeta & Record<string, unknown>;

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
        summary: extractEpisodeSummary(item),
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
    author: extractFeedAuthor(feedMeta),
    category: extractFeedCategory(feedMeta),
    imageUrl: typeof feed.image === "object" && feed.image && "url" in feed.image ? String(feed.image.url ?? "") || null : null,
    language: feedMeta.language ?? "en",
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

function extractEpisodeSummary(item: FeedItem): string | null {
  const candidates = [item.contentSnippet, item.summary, item.description, item.contentEncoded, item.content];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "string") {
      continue;
    }

    const normalized = normalizeSummaryText(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function normalizeSummaryText(input: string): string | null {
  const withoutTags = input.replace(/<[^>]+>/g, " ");
  const withoutEntities = withoutTags
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
  const collapsed = withoutEntities.replace(/\s+/g, " ").trim();
  return collapsed.length > 0 ? collapsed : null;
}

function extractFeedAuthor(feed: FeedMeta & Record<string, unknown>): string | null {
  const candidates = [feed.itunes?.author, feed["itunes:author"], feed.managingEditor];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "string") {
      continue;
    }

    const normalized = candidate.trim();
    if (normalized.length > 0) {
      return normalized;
    }
  }

  return null;
}

function extractFeedCategory(feed: FeedMeta & Record<string, unknown>): string | null {
  const candidates = [feed["itunes:category"], feed.itunes?.category];

  for (const candidate of candidates) {
    const normalized = resolveCategoryValue(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function resolveCategoryValue(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const normalized = resolveCategoryValue(item);
      if (normalized) {
        return normalized;
      }
    }
    return null;
  }

  if (typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;

  const directText = record.text;
  if (typeof directText === "string" && directText.trim().length > 0) {
    return directText.trim();
  }

  const underscoreText = record._;
  if (typeof underscoreText === "string" && underscoreText.trim().length > 0) {
    return underscoreText.trim();
  }

  const attrs = record.$ as Record<string, unknown> | undefined;
  if (attrs) {
    const attrText = attrs.text;
    if (typeof attrText === "string" && attrText.trim().length > 0) {
      return attrText.trim();
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
