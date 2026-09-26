import { describe, it, expect } from 'vitest';
import { parseRange } from '../src/lib/range.js';

describe('parseRange', () => {
  it('reads a closed range', () => {
    expect(parseRange('bytes=0-1', 1000)).toEqual({ start: 0, end: 1 });
  });

  it('reads an open-ended range to the last byte', () => {
    expect(parseRange('bytes=100-', 1000)).toEqual({ start: 100, end: 999 });
  });

  it('reads a suffix range as the last n bytes', () => {
    expect(parseRange('bytes=-500', 1000)).toEqual({ start: 500, end: 999 });
    expect(parseRange('bytes=-5000', 1000)).toEqual({ start: 0, end: 999 });
  });

  it('clamps an end past the file', () => {
    expect(parseRange('bytes=900-5000', 1000)).toEqual({ start: 900, end: 999 });
  });

  it('ignores a missing or invalid header, so the whole file is sent', () => {
    expect(parseRange(null, 1000)).toBeNull();
    expect(parseRange('', 1000)).toBeNull();
    expect(parseRange('bytes=abc', 1000)).toBeNull();
    expect(parseRange('items=0-1', 1000)).toBeNull();
    expect(parseRange('bytes=-', 1000)).toBeNull();
    expect(parseRange('bytes=5-2', 1000)).toBeNull();
    expect(parseRange('bytes=0-1,5-6', 1000)).toBeNull();
  });

  it('calls a range starting past the end unsatisfiable', () => {
    expect(parseRange('bytes=1000-', 1000)).toBe('unsatisfiable');
    expect(parseRange('bytes=2000-3000', 1000)).toBe('unsatisfiable');
    expect(parseRange('bytes=-0', 1000)).toBe('unsatisfiable');
  });
});
