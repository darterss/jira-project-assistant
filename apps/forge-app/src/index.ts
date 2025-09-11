import Resolver from '@forge/resolver';

const resolver = new Resolver();

// тестовый handler для проверки
resolver.define('ping', async (req) => {
  console.log('Ping received:', req);
  return { ok: true, msg: 'pong from Forge backend' };
});

export const run = resolver.getDefinitions();
