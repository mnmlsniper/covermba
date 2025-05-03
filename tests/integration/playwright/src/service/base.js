import { PWRequest } from "./request";

export class BaseController {
    constructor(options) {
        this.options = options;
    }

    request() {
        const preparedUrl = new URL(
            this.options.prefixPath.endsWith('/') ? this.options.prefixPath : `${this.options.prefixPath}/`,
            this.options.prefixUrl
        );
        const preparedRequest = new PWRequest().prefixUrl(preparedUrl);
        
        if (this.options.token) {
            return preparedRequest.headers({ 'Authorization': `Bearer ${this.options.token}` });
        }
        return preparedRequest;
    }
}