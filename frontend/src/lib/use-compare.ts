"use client";

import { createLocalList } from "./use-local-list";

/** Up to four products can be compared side by side. */
export const useCompare = createLocalList("noks.compare", 4);
