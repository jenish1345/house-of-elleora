import adapter from '../lib/adapter.js';
import handlerModule from '../handlers/products.js';

export default adapter.toFunction(handlerModule.handler);
