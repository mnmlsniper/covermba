/**
 * Универсальная обёртка для шагов Playwright.
 * Если testInfo поддерживает шаги (testInfo.step), выполняет функцию внутри шага с вложениями.
 * Если testInfo нет (например, в глобальном setup), просто выполняет функцию без шага.
 *
 * @param {object} testInfo - объект testInfo из Playwright (или undefined)
 * @param {string} stepName - название шага для отчёта
 * @param {function} fn - асинхронная функция, которая будет выполнена внутри шага или напрямую
 * @returns {Promise<any>} результат выполнения fn
 */
export async function withStep(testInfo, stepName, fn) {
  if (testInfo && typeof testInfo.step === 'function') {
    return await testInfo.step(stepName, fn);
  }
  return await fn();
} 