export function resolveRequestedEpisodeCount(input: {
  requestedEpisodes?: number;
  selectedEpisodeGuids?: string[];
}) {
  const selectedEpisodeCount = new Set((input.selectedEpisodeGuids ?? []).filter((guid) => guid.length > 0)).size;

  if (selectedEpisodeCount > 0) {
    return selectedEpisodeCount;
  }

  return input.requestedEpisodes;
}
