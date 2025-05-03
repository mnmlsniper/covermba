/**
 * Логирует HTTP-запрос и ответ в отчет Playwright через testInfo.attach
 * @param {object} params - параметры запроса и ответа
 * @param {import('@playwright/test').TestInfo} testInfo - объект testInfo из Playwright
 */
export async function logHttp({ request, response }, testInfo) {
  if (!testInfo) return;

  await testInfo.attach('HTTP Request', {
    body: JSON.stringify(request, null, 2),
    contentType: 'application/json'
  });

  await testInfo.attach('HTTP Response', {
    body: JSON.stringify(response, null, 2),
    contentType: 'application/json'
  });
} 