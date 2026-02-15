const assert = require('assert');

describe('Sample Tests', () => {
  it('should pass a basic test', () => {
    assert.strictEqual(1 + 1, 2);
  });

  it('should demonstrate array operations', () => {
    const arr = [1, 2, 3];
    assert.strictEqual(arr.length, 3);
    assert.strictEqual(arr.includes(2), true);
  });

  it('should demonstrate object operations', () => {
    const obj = { name: 'test', value: 42 };
    assert.strictEqual(obj.name, 'test');
    assert.strictEqual(obj.value, 42);
  });
});
