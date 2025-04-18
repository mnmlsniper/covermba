import { test, expect } from '@playwright/test';


test('get challenges', async ({ request }) => {
    const swagger = 'https://apichallenges.herokuapp.com/sim/docs/swagger';
    const response = await request.post(`https://apichallenges.herokuapp.com/challenger`);
    const body = await response.json();
    expect(response.status()).toBe(200);
    expect(body.challenges.length).toBe(59);
});