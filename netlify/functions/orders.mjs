import { getStore } from '@netlify/blobs';
import adapter from '../lib/adapter.js';
import store from '../lib/store.js';
import handlerModule from '../handlers/orders.js';

store.init(getStore);

export default adapter.toFunction(handlerModule.handler);
