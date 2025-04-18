class RequestCollector {
  constructor(apiCoverage) {
    this.requests = [];
    this.apiCoverage = apiCoverage;
  }

  collect(target) {
    const proxy = new Proxy(target, {
      get: (obj, prop) => {
        const originalMethod = obj[prop];
        if (typeof originalMethod === 'function') {
          return async (...args) => {
            const [url, options = {}] = args;
            const method = prop.toUpperCase();
            
            // Make the actual request
            const response = await originalMethod.apply(obj, args);
            
            // Collect request data
            const urlObj = new URL(url);
            const requestData = {
              timestamp: new Date().toISOString(),
              method,
              path: urlObj.pathname,
              queryParams: Object.fromEntries(urlObj.searchParams),
              statusCode: response.status(),
              headers: options.headers || {},
              body: options.data || null
            };

            this.requests.push(requestData);
            // Record request in ApiCoverage
            if (this.apiCoverage) {
              console.log(`[RequestCollector] Recording request in ApiCoverage: ${method} ${urlObj.pathname}`);
              this.apiCoverage.recordRequest(requestData);
            } else {
              console.warn(`[RequestCollector] ApiCoverage is not set, request not recorded: ${method} ${urlObj.pathname}`);
            }
            console.log(`[RequestCollector] Request collected: ${method} ${urlObj.pathname}`, requestData);

            return response;
          };
        }
        return originalMethod;
      }
    });

    return proxy;
  }

  getRequests() {
    return this.requests;
  }

  clear() {
    this.requests = [];
  }
}

export { RequestCollector }; 