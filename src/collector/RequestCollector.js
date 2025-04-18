export class RequestCollector {
  constructor() {
    this.requests = [];
  }

  collect(target) {
    const self = this;
    
    return new Proxy(target, {
      get(target, prop) {
        if (typeof target[prop] === 'function') {
          return async function(...args) {
            const startTime = Date.now();
            const response = await target[prop].apply(target, args);
            
            // Собираем информацию о запросе
            const request = {
              method: args[1]?.method || 'GET',
              url: args[0],
              path: new URL(args[0]).pathname,
              statusCode: response.status,
              duration: Date.now() - startTime,
              timestamp: new Date().toISOString()
            };

            // Добавляем заголовки, если они есть
            if (args[1]?.headers) {
              request.headers = args[1].headers;
            }

            // Добавляем тело запроса, если оно есть
            if (args[1]?.body) {
              request.body = args[1].body;
            }

            self.requests.push(request);
            return response;
          };
        }
        return target[prop];
      }
    });
  }

  getRequests() {
    return this.requests;
  }

  clear() {
    this.requests = [];
  }
} 