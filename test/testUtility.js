import assert from 'assert';
import {isEqualArray, fnv1a} from '../src/utility';

describe('test isEqualArray', () => {
  it('equal case', () => {
    assert.ok(isEqualArray([1, 2, 3], [1, 2, 3]));
    assert.ok(isEqualArray([], []));
  });

  it('not equal case', () => {
    assert.ifError(isEqualArray([1, 2, 3], [1, 2]));
    assert.ifError(isEqualArray([1, 2, 3], [1, 2, 4]));
  });
});

describe('test fnv1a', () => {
  it('from one value', () => {
    assert.equal(fnv1a([0x11222344]), 3138057805);  // 正解はC++で計算して出しました。
  });

  it('from two values', () => {
    assert.equal(fnv1a([0x11222344, 0x55667788]), 217018493);
  });
});
