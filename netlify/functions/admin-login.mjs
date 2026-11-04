import adapter from '../lib/adapter.js';
import handlerModule from '../handlers/admin-login.js';

export default adapter.toFunction(handlerModule.handler);
