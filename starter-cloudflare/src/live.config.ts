import { defineLiveCollection } from "astro:content";
import { kafecmsLoader } from "kafecms/runtime";

export const collections = {
	_kafecms: defineLiveCollection({ loader: kafecmsLoader() }),
};
