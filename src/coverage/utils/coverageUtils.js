/**
 * Coverage utility functions
 */

/**
 * Determines if an endpoint is partially covered
 * @param {Object} endpoint - The endpoint object
 * @returns {boolean} - True if endpoint is partially covered
 */
export function isPartiallyCovered(endpoint) {
    if (!endpoint.requests?.length) return false;
    
    const expectedStatusCodes = Object.keys(endpoint.responses || {});
    const actualStatusCodes = new Set(endpoint.requests.map(r => r.statusCode));
    return actualStatusCodes.size > 0 && expectedStatusCodes.some(code => !actualStatusCodes.has(code));
}

/**
 * Gets the CSS class for a status code
 * @param {number|string} statusCode - The HTTP status code
 * @param {Object} declaredResponses - The responses declared in Swagger
 * @returns {string} - The CSS class name
 */
export function getStatusCodeClass(statusCode, declaredResponses) {
    if (!statusCode) return 'status-undeclared';
    
    const statusCodeStr = statusCode.toString();
    if (!statusCodeStr) return 'status-undeclared';
    
    const firstDigit = statusCodeStr.charAt(0);
    if (!firstDigit) return 'status-undeclared';
    
    const isDeclared = declaredResponses && declaredResponses[statusCodeStr];
    return isDeclared ? `status-${firstDigit}xx` : 'status-undeclared';
}

/**
 * Formats a parameter for display
 * @param {Object} param - The parameter object
 * @returns {Object} - Formatted parameter object
 */
export function formatParameter(param) {
    return {
        name: param.name,
        in: param.in,
        required: param.required ? 'Yes' : 'No',
        type: param.type || param.schema?.type || '-',
        description: param.description || '-'
    };
}

/**
 * Formats a response for display
 * @param {Object} response - The response object
 * @returns {Object} - Formatted response object
 */
export function formatResponse(response) {
    return {
        code: response.code,
        description: response.description,
        schema: response.schema || null
    };
}

/**
 * Formats a request for display
 * @param {Object} request - The request object
 * @returns {Object} - Formatted request object
 */
export function formatRequest(request) {
    return {
        statusCode: request.statusCode,
        timestamp: new Date(request.timestamp).toLocaleString(),
        requestData: request.requestData,
        responseData: request.responseData
    };
} 