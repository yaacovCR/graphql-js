import { expect } from 'chai';

import { mapValue } from '../jsutils/mapValue';
import { isObjectLike } from '../jsutils/isObjectLike';

/**
 * Deeply transforms an arbitrary value to a JSON-safe value by calling toJSON
 * on any nested value which defines it.
 */
function toJSONDeep(value: unknown): unknown {
  if (!isObjectLike(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(toJSONDeep);
  }

  return mapValue(value, toJSONDeep);
}

export function expectJSON(actual: unknown) {
  return {
    toDeepEqual(expected: unknown) {
      expect(toJSONDeep(actual)).to.deep.equal(toJSONDeep(expected));
    },
  };
}
