import { hydrateApi, hydrateContext } from '@grammyjs/hydrate';
import { MyContext, bot } from './telegram.js';
import type { queueAsPromised } from 'fastq';
import { run } from '@grammyjs/runner';
import { Filter } from 'grammy';
import cron from 'node-cron';
import fs from 'fs-extra';
import * as fastq from 'fastq';

type Task = {
  telegramId: string;
  chatId: number;
  timestamp: number;
};

const REQUEST_PATH = 'join_requests.json';

const asyncWorker = async (request: { telegramId: string, chatId: number, timestamp: number }) => {
  const requests = await fs.readJSON(REQUEST_PATH);
  requests.push(request);
  await fs.writeJSON(REQUEST_PATH, requests);
};

cron.schedule('* */12 * * *', async () => { // A cada 12 horas
  const requests = await fs.readJSON(REQUEST_PATH) as { telegramId: string, chatId: number, timestamp: number }[];
  const chunk = requests.splice(0, 50);
  for (const request of chunk) {
    await bot.api.approveChatJoinRequest(request.chatId, parseInt(request.telegramId)).catch(error => { });
    await bot.api.sendMessage(request.telegramId, 'Você foi adicionado ao grupo!').catch(error => { });
  };
  await fs.writeJSON(REQUEST_PATH, requests);
});

const q: queueAsPromised<Task> = fastq.promise(asyncWorker, 1);

export const handleJoinRequest = async (client: Filter<MyContext, 'chat_join_request'>) => {
  const telegramId = client.from.id.toString();
  const requests = await fs.readJSON(REQUEST_PATH);

  if (requests.includes(telegramId)) {
    await client.api.sendMessage(telegramId, 'Você já está na lista de espera!');
    return;
  };

  q.push({
    telegramId,
    chatId: client.chat.id,
    timestamp: Date.now(),
  });

  await client.api.sendMessage(telegramId, 'Pronto, agora você está na lista de espera para entrar no grupo, e em breve você será adicionado automaticamente!');
};

bot.api.config.use(hydrateApi());
bot.use(hydrateContext());
bot.on('chat_join_request', handleJoinRequest);

run(bot, {
  runner: {
    fetch: {
      allowed_updates: [
        'message',
        'callback_query',
        'chat_join_request',
      ],
    },
    silent: true,
    retryInterval: 1000 * 10,
  },
});