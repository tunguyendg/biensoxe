import config from '../../data/offers.config.json';
import raw from '../../data/offers.json';
import type { Offer, OfferConfigItem } from './offers';

export const offerConfig = config as OfferConfigItem[];
export const offers = raw as Offer[];
