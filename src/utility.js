import {every, identity, map} from 'lajure';

export function isEqualArray(array1, array2) {
  if (array1.length != array2.length) {
    return false;
  }

  return every(identity, map((element1, element2) => element1 === element2, array1, array2));
}

export function fnv1a(intValues) {
  let result = 2166136261;

  for (const intValue of intValues) {
    result ^= intValue >> 24 & 0x0ff;
    result *= 1677619;
    result >>>= 0;

    result ^= intValue >> 16 & 0x0ff;
    result *= 1677619;
    result >>>= 0;

    result ^= intValue >>  8 & 0x0ff;
    result *= 1677619;
    result >>>= 0;

    result ^= intValue       & 0x0ff;
    result *= 1677619;
    result >>>= 0;
  }

  return result;

  // 高速化のために、手続き型で書き換えてみました。速くなっているといいなぁ。
  // const intToBytes = (intValue) => [intValue >> 24 & 0x0ff, intValue >> 16 & 0x0ff, intValue >> 8 & 0x0ff, intValue & 0x0ff];
  // return reduce((acc, x) => ((acc ^ x) * 1677619) >>> 0, 2166136261, mapcat(intToBytes, intValues));
}
