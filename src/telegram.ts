import { Api, Bot, Context } from 'grammy';
import { HydrateApiFlavor, HydrateFlavor } from '@grammyjs/hydrate';

const prod = '8528258379:AAHJGH3zNYHnvlu9Jwo0J9yVPVg7XNoWJbw';

export type MyContext = HydrateFlavor<Context>;
type MyApi = HydrateApiFlavor<Api>;

const bot = new Bot<MyContext, MyApi>(prod);

export {
  bot,
};