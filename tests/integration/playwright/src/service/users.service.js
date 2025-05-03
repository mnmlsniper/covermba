import { BaseController } from "./base";
import { withStep } from "../utils/with-step.js";

export class UsersService extends BaseController {

    async register(username, email, password, testInfo) {
        return withStep(testInfo, `Регистрация пользователя `, async (step) => {
            return this.request()
                .url('users')
                .method('POST')
                .headers({
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                })
                .body({ username, password, email })
                .send(step || testInfo);
        });
    }
}

