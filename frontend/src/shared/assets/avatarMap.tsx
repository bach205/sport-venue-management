// @ts-nocheck
// Resolves avatar identifiers (from mock data) to actual image URLs using figma:asset

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import img768 from '../../imports/Html→Body-1/768be8c6c602934c7f4f0c51ce322a03d7bc3607.png';
import img244 from '../../imports/Html→Body-1/244cc22520475607918c3b4e0806b6cd19231fd4.png';
import img85f from '../../imports/Html→Body-1/85f2b1fcf9fbde97cb43de566e1fc58d7dc5f9a2.png';
import imga0f from '../../imports/Html→Body-1/a0f2df621eb14a30acc7eee63a30e2de7f9d53d6.png';
import img95f from '../../imports/Html→Body-1/95f383dad4232d71e1e9fb7cf04dfe3fdab3bd30.png';
import imgfd7 from '../../imports/Html→Body-1/fd7d6df8e21abbc14fed92d1c6e27538c3dd4979.png';
import imgc1c from '../../imports/Html→Body-1/c1c6d62b4135dfdd55aafefa06abfdf8321f96cf.png';
import img781 from '../../imports/Html→Body-2/781a656a29f4ab3f37bb8c8ba8f0a14ecb4a100e.png';

const AVATAR_MAP: Record<string, string> = {
  '768be8c6c602934c7f4f0c51ce322a03d7bc3607': img768 as string,
  '244cc22520475607918c3b4e0806b6cd19231fd4': img244 as string,
  '85f2b1fcf9fbde97cb43de566e1fc58d7dc5f9a2': img85f as string,
  'a0f2df621eb14a30acc7eee63a30e2de7f9d53d6': imga0f as string,
  '95f383dad4232d71e1e9fb7cf04dfe3fdab3bd30': img95f as string,
  'fd7d6df8e21abbc14fed92d1c6e27538c3dd4979': imgfd7 as string,
  'c1c6d62b4135dfdd55aafefa06abfdf8321f96cf': imgc1c as string,
  '781a656a29f4ab3f37bb8c8ba8f0a14ecb4a100e': img781 as string,
};

/**
 * Resolves avatar/asset identifier strings from mock data.
 * Accepts:
 *   'avatar:hash' → looks up from figma:asset map (works for images too)
 *   '' | undefined → returns ''
 */
export function resolveAvatar(avatar: string | undefined | null): string {
  if (!avatar) return '';
  if (avatar.startsWith('avatar:')) {
    const hash = avatar.slice(7);
    return AVATAR_MAP[hash] ?? '';
  }
  return avatar;
}

export { imgc1c as courtPreviewImg };