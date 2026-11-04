import adapter from '../lib/adapter.js';
import handlerModule from '../handlers/orders.js';

export default adapter.toFunction(handlerModule.handler);
