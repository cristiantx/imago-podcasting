export function resolvePodcastTitleForFeedSync(input: { currentTitle: string | null; feedTitle: string | null }) {
  return input.currentTitle ?? input.feedTitle;
}
