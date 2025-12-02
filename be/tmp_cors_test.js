const pattern = 'https://*.trycloudflare.com';
const escaped = pattern.replace(/[-+?.^${}()|[\\]\\]/g, '\\$&');
const regexStr = '^' + escaped.replace(/\*/g, '.*') + '$';
const origin = 'https://considered-computational-glen-webpage.trycloudflare.com';
console.log({ pattern, escaped, regexStr, match: new RegExp(regexStr).test(origin) });
