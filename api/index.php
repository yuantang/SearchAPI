<?php

/**
 * API Router.
 * 
 * Routes API requests to the appropriate endpoint.
 */

require_once __DIR__ . '/config.php';

// Get the request path.
$request_uri = $_SERVER['REQUEST_URI'];
$base_path = '/api';

// Remove query string.
$request_path = parse_url($request_uri, PHP_URL_PATH);

// Remove base path.
if (strpos($request_path, $base_path) === 0) {
  $request_path = substr($request_path, strlen($base_path));
}

// Remove leading and trailing slashes.
$request_path = trim($request_path, '/');

// Route the request.
switch ($request_path) {
  case 'v1/search':
    require_once __DIR__ . '/v1/search.php';
    break;
    
  case '':
  case 'v1':
    // API info.
    sendJsonResponse([
      'name' => 'Meditation Search API',
      'version' => API_VERSION,
      'endpoints' => [
        'search' => '/api/v1/search',
      ],
    ]);
    break;
    
  default:
    // 404 Not Found.
    sendErrorResponse('Endpoint not found', 404);
    break;
}
