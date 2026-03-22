export type SearchDateRange = "30d" | "90d" | "365d" | "all";
export type SearchSortOrder = "relevance" | "date" | "confidence";

export type SemanticSearchResult = {
  podcastId: string;
  podcastTitle: string;
  podcastImageUrl: string | null;
  episodeId: string;
  episodeTitle: string;
  episodeUrl: string;
  episodeHref: string;
  publishedAt: string | null;
  startSec: number;
  endSec: number;
  speaker: string | null;
  snippet: string;
  score: number;
};

export type HighlightToken = {
  text: string;
  highlighted: boolean;
};

const SEARCH_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "for",
  "from",
  "how",
  "in",
  "into",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with"
]);

export function formatSearchScorePercent(score: number) {
  return Math.max(0, Math.min(100, Math.round(score * 100)));
}

export function getSearchResultKey(result: SemanticSearchResult) {
  return `${result.episodeId}:${result.startSec}`;
}

export function resolveInitialActiveResultKey(results: SemanticSearchResult[]) {
  return results.length > 0 ? getSearchResultKey(results[0]) : null;
}

export function resolveRetainedActiveResultKey(
  results: SemanticSearchResult[],
  currentKey: string | null
) {
  if (currentKey !== null && results.some((result) => getSearchResultKey(result) === currentKey)) {
    return currentKey;
  }

  return resolveInitialActiveResultKey(results);
}

export function formatPreviewSpeakerLabel(speaker: string | null) {
  return speaker ?? "Transcript match";
}

export function filterSearchResults(
  results: SemanticSearchResult[],
  options: {
    dateRange: SearchDateRange;
    minScorePercent: number;
    now?: Date;
  }
) {
  const threshold = getDateThreshold(options.dateRange, options.now ?? new Date());

  return results.filter((result) => {
    if (formatSearchScorePercent(result.score) < options.minScorePercent) {
      return false;
    }

    if (!threshold) {
      return true;
    }

    if (!result.publishedAt) {
      return false;
    }

    const publishedAtMs = Date.parse(result.publishedAt);
    return Number.isFinite(publishedAtMs) && publishedAtMs >= threshold;
  });
}

export function sortSearchResults(results: SemanticSearchResult[], sortOrder: SearchSortOrder) {
  if (sortOrder === "relevance") {
    return [...results];
  }

  return results
    .map((result, index) => ({ result, index }))
    .sort((left, right) => {
      if (sortOrder === "confidence") {
        const scoreDelta = right.result.score - left.result.score;
        if (scoreDelta !== 0) {
          return scoreDelta;
        }
      }

      const dateDelta = getPublishedAtSortValue(right.result.publishedAt) - getPublishedAtSortValue(left.result.publishedAt);
      if (dateDelta !== 0) {
        return dateDelta;
      }

      if (sortOrder === "date") {
        const scoreDelta = right.result.score - left.result.score;
        if (scoreDelta !== 0) {
          return scoreDelta;
        }
      }

      return left.index - right.index;
    })
    .map(({ result }) => result);
}

export function paginateSearchResults(results: SemanticSearchResult[], visibleCount: number) {
  return results.slice(0, Math.max(0, visibleCount));
}

export function getHighlightTokens(text: string, query: string): HighlightToken[] {
  const terms = extractMeaningfulSearchTerms(query);
  if (terms.length === 0) {
    return [{ text, highlighted: false }];
  }

  const expression = new RegExp(`\\b(${terms.map(escapeRegExp).join("|")})\\b`, "gi");
  const tokens: HighlightToken[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(expression)) {
    const matchIndex = match.index ?? 0;

    if (matchIndex > lastIndex) {
      tokens.push({
        text: text.slice(lastIndex, matchIndex),
        highlighted: false
      });
    }

    tokens.push({
      text: match[0],
      highlighted: true
    });

    lastIndex = matchIndex + match[0].length;
  }

  if (lastIndex < text.length) {
    tokens.push({
      text: text.slice(lastIndex),
      highlighted: false
    });
  }

  return tokens.length > 0 ? tokens : [{ text, highlighted: false }];
}

export function extractMeaningfulSearchTerms(query: string) {
  return Array.from(
    new Set(
      query
        .toLowerCase()
        .split(/[^a-z0-9]+/i)
        .map((term) => term.trim())
        .filter((term) => term.length >= 2 && !SEARCH_STOP_WORDS.has(term))
    )
  ).sort((left, right) => right.length - left.length);
}

function getDateThreshold(dateRange: SearchDateRange, now: Date) {
  if (dateRange === "all") {
    return null;
  }

  const dayWindow = dateRange === "30d" ? 30 : dateRange === "90d" ? 90 : 365;
  return now.getTime() - dayWindow * 24 * 60 * 60 * 1000;
}

function getPublishedAtSortValue(publishedAt: string | null) {
  if (!publishedAt) {
    return -1;
  }

  const timestamp = Date.parse(publishedAt);
  return Number.isFinite(timestamp) ? timestamp : -1;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
