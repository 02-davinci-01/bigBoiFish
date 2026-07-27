export type Song = {
  id: string;
  title: string;
  artist: string;
  /** Path to the audio file under /public, e.g. "/audio/my-track.mp3" */
  src: string;
};

/**
 * The record crate — "song of the day".
 *
 * The FIRST entry is the current song of the day. Over the months you can keep
 * adding tracks below; the vinyl player's ‹ ›  buttons flip through the crate.
 *
 * To add a song:
 *   1. Drop the .mp3 into  /public/audio/
 *   2. Add an entry here with its title, artist and src path.
 *
 * The player degrades gracefully — if an mp3 is missing the vinyl still
 * spins for the animation, it just won't make sound.
 */
export const songs: Song[] = [
  {
    id: "sotd",
    title: "weird fishes / arpeggi",
    artist: "radiohead",
    src: "/audio/weird-fishes-arpeggi.mp3",
  },
];
