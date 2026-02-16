
console.time('Import LocalInference');
import { localInference } from './lib/inference/local';
console.timeEnd('Import LocalInference');

console.time('Initialize LocalInference');
localInference.initialize().then(() => {
  console.timeEnd('Initialize LocalInference');
  console.log('Done');
}).catch(err => {
  console.error('Error:', err);
});
