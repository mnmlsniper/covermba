import { UsersService } from "./users.service";
import { API_CONFIG } from "../config/api.config";

export class ApiClient {
    constructor(options = {}) {
        const mergedOptions = {
            ...options
        }
        this.options = mergedOptions;
        this.users = new UsersService({
            ...API_CONFIG.services.auth,
            ...mergedOptions
        });
    }

    static un() {
        return new ApiClient();
    }
}