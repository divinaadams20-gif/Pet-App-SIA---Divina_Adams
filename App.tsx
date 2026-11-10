import { useCallback, useEffect, useRef, useState } from "react";
import { listDogBreeds, randomDogImage } from "./api";
import type { BreedMap, RequestState, Snapshot } from "./types";

const imageEndpoint = (breed: string): string => `/breed/${breed}/images/random`;

const flattenBreeds = (map: BreedMap): string[] => {
  const names = Object.entries(map).flatMap(([breed, subs]) => [
    breed,
    ...subs.map((sub) => `${breed}/${sub}`)
  ]);

  return names.sort((a, b) => a.localeCompare(b));
};

const describeError = (error: unknown): string =>
  error instanceof Error ? error.message : "Something went wrong.";

const preload = (src: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve();
    image.onerror = () => reject(new Error("The photo could not be shown."));
    image.src = src;
  });

type EchoProps = {
  endpoint: string;
  data: unknown;
  delayed: boolean;
};

function ApiEcho({ endpoint, data, delayed }: EchoProps) {
  const shown = data ?? { status: "loading", endpoint };

  return (
    <div className="rounded-2xl border border-red-300/25 bg-black/50 p-4">
      <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.2em] text-red-200/70">
        <span>Dog API</span>
        <span className="flex items-center gap-1.5 normal-case tracking-normal text-red-100/60">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-300" />
          {delayed ? "slow response" : "request sent"}
        </span>
      </div>
      <pre className="mt-3 max-h-36 overflow-auto whitespace-pre-wrap break-words text-[11px] leading-relaxed text-red-50/80">
        {JSON.stringify(shown, null, 2)}
      </pre>
    </div>
  );
}

export default function App() {
  const [photo, setPhoto] = useState("");
  const [breed, setBreed] = useState("");
  const [breeds, setBreeds] = useState<string[]>([]);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [request, setRequest] = useState<RequestState | null>(null);
  const [delayed, setDelayed] = useState(false);
  const [error, setError] = useState("");
  const ticket = useRef(0);
  const busy = request !== null;
  const showEcho = busy && (delayed || photo === "");

  useEffect(() => {
    if (!request) {
      setDelayed(false);
      return;
    }

    const timer = window.setTimeout(() => setDelayed(true), 1500);

    return () => window.clearTimeout(timer);
  }, [request]);

  const loadCatalogue = useCallback(async () => {
    setError("");
    setRequest({ status: "loading", endpoint: "/breeds/list/all" });

    try {
      const payload = await listDogBreeds();
      setBreeds(flattenBreeds(payload.message));
      setSnapshot({ endpoint: "/breeds/list/all", data: payload });
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setRequest(null);
    }
  }, []);

  useEffect(() => {
    void loadCatalogue();
  }, [loadCatalogue]);

  const changePhoto = useCallback(async (selected: string) => {
    const current = ticket.current + 1;
    ticket.current = current;
    setError("");
    setRequest({ status: "loading", endpoint: imageEndpoint(selected) });

    try {
      const payload = await randomDogImage(selected);

      if (current !== ticket.current) {
        return;
      }

      await preload(payload.message);

      if (current !== ticket.current) {
        return;
      }

      setSnapshot({ endpoint: imageEndpoint(selected), data: payload });
      setPhoto(payload.message);
    } catch (caught) {
      if (current !== ticket.current) {
        return;
      }

      setError(describeError(caught));
      setPhoto("");
    } finally {
      if (current === ticket.current) {
        setRequest(null);
      }
    }
  }, []);

  const pickBreed = (value: string) => {
    setBreed(value);

    if (!value) {
      ticket.current += 1;
      setPhoto("");
      setRequest(null);
      return;
    }

    void changePhoto(value);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-4 py-10">
      <section className="w-full rounded-[36px] border-4 border-red-500/50 bg-black/45 p-6 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9)] sm:p-10">
        <header>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Pet App - Divina  
          </h1>
        </header>

        <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-stretch">
          <figure className="relative flex min-h-[360px] flex-1 items-center justify-center overflow-hidden rounded-3xl border-2 border-red-400/30 bg-black/60 lg:min-h-[540px]">
            {breed && (
              <span className="absolute right-5 bottom-5 z-10 rounded-lg border border-red-300/40 bg-black/70 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-red-100">
                {breed}
              </span>
            )}
            {photo ? (
              <img
                src={photo}
                alt={`Photo of ${breed}`}
                className={`h-full w-full object-cover transition-opacity duration-300 ${
                  busy ? "opacity-40" : "opacity-100"
                }`}
              />
            ) : (
              <p className="px-8 text-center text-sm text-red-100/60">
               Select a breed
              </p>
            )}
          </figure>

          <aside className="flex w-full flex-col justify-between gap-8 lg:w-80">
            <div className="flex flex-col gap-3">
              <label
                htmlFor="breed"
                className="text-[11px] uppercase tracking-[0.22em] text-red-200/80"
              >
                Choose a breed
              </label>
              <select
                id="breed"
                value={breed}
                disabled={breeds.length === 0}
                onChange={(event) => pickBreed(event.target.value)}
                className="breed-caret w-full cursor-pointer rounded-xl border border-red-300/30 bg-black/60 px-4 py-4 pr-11 text-sm text-red-50 outline-none transition focus:border-red-300/70 focus:ring-2 focus:ring-red-400/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">
                  {breeds.length === 0 ? "Loading breeds..." : "Breed"}
                </option>
                {breeds.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col items-center gap-4">
              <button
                type="button"
                onClick={() => void changePhoto(breed)}
                disabled={!breed || busy}
                className="flex h-36 w-36 items-center justify-center rounded-full border-4 border-red-200/30 bg-red-600 text-base font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-red-500 focus:outline-none focus:ring-4 focus:ring-red-300/40 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-red-950 disabled:text-red-200/40"
              >
                Change
              </button>
            </div>

            {request && showEcho && (
              <ApiEcho
                endpoint={request.endpoint}
                data={
                  snapshot !== null && snapshot.endpoint === request.endpoint
                    ? snapshot.data
                    : null
                }
                delayed={delayed}
              />
            )}

            {error && (
              <div className="rounded-xl border border-red-300/40 bg-red-600/20 px-4 py-3 text-xs text-red-50">
                <span className="font-semibold">Error: </span>
                {error}
                <button
                  type="button"
                  onClick={() => void loadCatalogue()}
                  className="ml-2 underline underline-offset-2 hover:text-white"
                >
                  Try again
                </button>
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
