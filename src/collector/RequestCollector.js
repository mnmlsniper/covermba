export class RequestCollector {
  constructor() {
    this.requests = [];
  }

  collect(request) {
    let collectedRequest;
    
    // Если это объект запроса Playwright
    if (typeof request.url === 'function') {
      const url = new URL(request.url());
      collectedRequest = {
        method: request.method(),
        url: request.url(),
        path: url.pathname,
        statusCode: request.response()?.status() || 200,
        timestamp: new Date().toISOString(),
        headers: request.headers(),
        postData: request.postData()
      };
    } 
    // Если это простой объект запроса
    else {
      const url = new URL(request.url);
      collectedRequest = {
        method: request.method,
        url: request.url,
        path: url.pathname,
        statusCode: request.statusCode,
        timestamp: new Date().toISOString(),
        headers: request.headers || {},
        postData: request.postData
      };
    }

    this.requests.push(collectedRequest);
    return request;
  }

  getRequests() {
    return this.requests;
  }

  clear() {
    this.requests = [];
  }
} 