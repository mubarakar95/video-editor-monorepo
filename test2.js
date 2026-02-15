const assert = require('assert');

describe('Additional Tests', () => {
  it('should handle string operations', () => {
    const str = 'hello world';
    assert.strictEqual(str.toUpperCase(), 'HELLO WORLD');
    assert.strictEqual(str.length, 11);
  });

  it('should handle math operations', () => {
    assert.strictEqual(Math.max(1, 5, 3), 5);
    assert.strictEqual(Math.min(1, 5, 3), 1);
  });

  it('should handle boolean logic', () => {
    assert.strictEqual(true && true, true);
    assert.strictEqual(true || false, true);
    assert.strictEqual(!false, true);
  });
});
