import { request } from "@playwright/test";
import { logHttp } from "../utils/http-logger.js";

export class PWRequest {

 constructor() {
        this.options = {};
    }

    prefixUrl(prefixUrl) {
        this.options.prefixUrl = prefixUrl.toString();
        return this;
    }
    url(url) {
        this.options.url = url.toString();
        return this;
    }
    method(method) {
        this.options.method = method;
        return this;
    }
    headers(headers) {
        this.options.headers = this.options.headers ?? {};
        this.options.headers = {
            ...this.options.headers,
            ...headers
        };
        return this;
    }
    searchParams(searchParams) {
        this.options.params = searchParams;
        return this;
    }
    body(data) {
        this.options.data = data;
        return this;
    }
    async send(step) {
        if (this.options.url) {
            this.options.headers = this.options.headers ?? {};
            this.options.headers = {
                ...this.options.headers,
                'Accept': 'application/json'
            };

            const reqContext = await request.newContext({
                baseURL: this.options.prefixUrl
            });

            const response = await reqContext.fetch(this.options.url, {
                ...this.options
            });

            const contentType = response.headers()['content-type'] || '';
            let responseBody;
            if (contentType.includes('application/json')) {
                responseBody = await response.json();
            } else {
                responseBody = await response.text();
            }

            const status = response.status();


            const responseText = await response.text();
    

            // Логгирование запроса и ответа в отчет Playwright через step.attach
            if (step) {
                await logHttp({
                    request: {
                        url: this.options.prefixUrl + this.options.url,
                        method: this.options.method,
                        headers: this.options.headers,
                        data: this.options.data
                    },
                    response: {
                        status,
                        headers: response.headers(),
                        body: responseBody
                    }
                }, step);
            }

            return {
                status,
                body: responseBody,
                headers: response.headers()
            };
        }
        throw new Error('[PWRequest] url is undefined, make sure you called .url("some/url") method');
    }
}
