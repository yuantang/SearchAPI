<?php
/**
 * Router script for PHP development server.
 * 
 * This script routes requests to the appropriate files.
 */

// Get the request URI.
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// If the request is for the API, route to the API.
if (strpos($uri, '/api/') === 0) {
    // Include the API router.
    require_once __DIR__ . '/api/index.php';
    exit;
}

// If the request is for a file that exists, serve it.
if (file_exists(__DIR__ . $uri)) {
    // If the file is a PHP file, include it.
    if (preg_match('/\.php$/', $uri)) {
        require_once __DIR__ . $uri;
        exit;
    }
    
    // Otherwise, return false to let the server handle it.
    return false;
}

// For all other requests, serve the index.html file.
require_once __DIR__ . '/index.html';
exit;
