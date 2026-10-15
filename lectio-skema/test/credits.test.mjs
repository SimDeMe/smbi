import test from 'node:test';
import assert from 'node:assert/strict';
import { creditUrl } from '../credits.mjs';
test('credit reader uses only the fixed activity editor and numeric activity ID', () => {
  assert.equal(creditUrl('https://www.lectio.dk/lectio/141/SkemaNy.aspx?week=432026', '123'), 'https://www.lectio.dk/lectio/141/aktivitet/aktivitetrediger.aspx?action=edit&id=123');
  assert.throws(() => creditUrl('https://evil.example/lectio/141/SkemaNy.aspx', '123'));
  assert.throws(() => creditUrl('https://www.lectio.dk/lectio/141/SkemaNy.aspx', '123&action=save'));
});
