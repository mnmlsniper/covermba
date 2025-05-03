import { test, expect } from '@playwright/test';
import { ApiClient } from './src/service/client.js';

test.only('Пользователь может зарегистрироваться', async ({}, testInfo) => {
    function generateUsername(length = 8) {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let username = '';
        for (let i = 0; i < length; i++) {
          username += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return username;
      };
  
      function generatePassword(length = 12) {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=';
        let password = '';
        for (let i = 0; i < length; i++) {
          password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
      };
  
      function generateEmail(username) {
        const domains = ['example.com', 'mail.com', 'test.org', 'demo.net'];
        const domain = domains[Math.floor(Math.random() * domains.length)];
        return `${username}@${domain}`;
      };
      const username = generateUsername();
      const password = generatePassword();
      const email = generateEmail(username);
      
      console.log({ username, password, email });
      //  const client = new ApiClient().withToken(adminToken);
      const client = ApiClient.un();

       // const client = new ApiClient.un();

        const response = await client.users.register(username, email, password, testInfo);
        expect(response.status).toEqual(200);

   // const client = new ApiClient().withToken(adminToken);

  //const response = await client.external.getSummary(76927, testInfo);
  //expect(response.status).toEqual(403);
});
