export class RequestCollector {
  constructor() {
    this.requests = [];
  }

  collect(request) {
    // Собираем информацию о запросе
    const url = new URL(request.url());
    const collectedRequest = {
      method: request.method(),
      url: request.url(),
      path: url.pathname,
      statusCode: request.response()?.status || 200,
      timestamp: new Date().toISOString(),
      headers: request.headers(),
      postData: request.postData()
    };

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