"use client";

import { createLocalList } from "./use-local-list";

export const useWishlist = createLocalList("noks.wishlist", 60);
