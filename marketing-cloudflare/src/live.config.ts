/**
 * KafeCMS Live Content Collections
 *
 * Defines the _kafecms collection that handles all content types from the database.
 * Query specific types using getKafeCMSCollection() and getKafeCMSEntry().
 */

import { defineLiveCollection } from "astro:content";
import { kafecmsLoader } from "kafecms/runtime";

export const collections = {
	_kafecms: defineLiveCollection({ loader: kafecmsLoader() }),
};
