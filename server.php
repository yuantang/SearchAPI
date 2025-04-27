<?php
/**
 * Simple PHP development server.
 * 
 * This script starts a PHP development server for testing the meditation search application.
 */

$host = 'localhost';
$port = 8000;
$root = __DIR__;

echo "Starting PHP development server at http://{$host}:{$port}\n";
echo "Document root: {$root}\n";
echo "Press Ctrl+C to stop the server.\n\n";

// Start the server.
passthru("php -S {$host}:{$port} -t {$root} {$root}/router.php");
