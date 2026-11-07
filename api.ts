import type { BreedPayload, PhotoPayload } from "./types";

const API_ROOT = "https://dog.ceo/api";

const fetchJson = async <T>(path: string): Promise<T> => {
  const response = await fetch(API_ROOT + path, {
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    throw new Error(`The Dog API returned status ${response.status}.`);
  }

  return (await response.json()) as T;
};

export const randomDogImage = (breed: string): Promise<PhotoPayload> => {
  const slug = breed.split("/").map(encodeURIComponent).join("/");

  return fetchJson<PhotoPayload>(`/breed/${slug}/images/random`);
};

export const listDogBreeds = (): Promise<BreedPayload> =>
  fetchJson<BreedPayload>("/breeds/list/all");
