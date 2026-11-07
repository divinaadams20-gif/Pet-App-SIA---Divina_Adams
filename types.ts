export type ApiEnvelope<T> = {
  message: T;
  status: string;
};

export type BreedMap = Record<string, string[]>;

export type BreedPayload = ApiEnvelope<BreedMap>;

export type PhotoPayload = ApiEnvelope<string>;

export type RequestState = {
  status: string;
  endpoint: string;
};

export type Snapshot = {
  endpoint: string;
  data: unknown;
};
