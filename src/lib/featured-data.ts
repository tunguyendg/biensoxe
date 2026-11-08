import config from '../../data/featured.config.json';
import raw from '../../data/featured.json';
import type { FeaturedConfigItem, FeaturedLink } from './featured';

export const featuredConfig = config as FeaturedConfigItem[];
export const featuredLinks = raw as FeaturedLink[];
