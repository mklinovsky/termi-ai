import { JSONFilePreset } from 'lowdb/node';
import {
  type AiMessage,
  type Conversation,
  type ConversationType,
} from './types.ts';
import { randomUUID } from 'node:crypto';
import fs from 'fs';

type Data = {
  conversations: Conversation[];
};

const defaultData: Data = { conversations: [] };

async function getDb() {
  const db = await JSONFilePreset<Data>('db/db.json', defaultData);
  return db;
}

export async function getData() {
  const db = await getDb();
  return db.data;
}

export async function createConversation(type: ConversationType) {
  const db = await getDb();
  const conversation = { id: randomUUID(), type, messages: [] };

  db.data.conversations.push(conversation);
  await db.write();

  return conversation.id;
}

export async function saveConversation(
  type: ConversationType,
  messages: AiMessage[],
) {
  const db = await getDb();
  const conversation = {
    id: randomUUID(),
    type,
    messages,
  };

  db.data.conversations.push(conversation);
  await db.write();
  saveMessageToFile(conversation.messages.at(-1));
}

export async function saveMessages(
  conversationId: string,
  messages: AiMessage[],
) {
  const db = await getDb();
  const conversation = db.data.conversations.find(
    (c) => c.id === conversationId,
  );

  if (!conversation) {
    throw new Error(`Conversation with id ${conversationId} not found`);
  }

  conversation.messages.push(...messages);
  await db.write();
  saveMessageToFile(messages.at(-1));
}

export async function clearData() {
  const db = await getDb();
  db.data = defaultData;
  await db.write();
  console.log('Data deleted ✅');
}

function saveMessageToFile(message: AiMessage | undefined) {
  if (message?.role !== 'assistant') {
    return;
  }

  const content = (message.content as string) ?? '';
  fs.writeFileSync('db/last-message.md', content, 'utf8');
}
