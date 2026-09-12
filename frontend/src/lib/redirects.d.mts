/** Types for the plain-JS redirect table shared with next.config.mjs. */
export type Redirect = {
  source: string;
  destination: string;
  permanent: boolean;
  note: string;
};

export declare const REDIRECTS: Redirect[];
export declare const INTENTIONAL_404: Record<string, string>;
export declare function nextRedirects(): Omit<Redirect, "note">[];
