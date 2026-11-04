import adapter from '../lib/adapter.js';
import handlerModule from '../handlers/upload-image.js';

export default adapter.toFunction(handlerModule.handler);
