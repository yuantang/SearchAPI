<?php

/**
 * API Configuration file.
 */

// Enable error reporting for development.
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set headers for CORS and JSON response.
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=UTF-8');

// Handle preflight OPTIONS request.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

// Database configuration (if needed in the future).
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'meditation_search');

// API version.
define('API_VERSION', 'v1');

// Path to the courses data file.
define('COURSES_DATA_FILE', __DIR__ . '/../courses_data.json');

/**
 * Sends a JSON response.
 *
 * @param mixed $data
 *   The data to send.
 * @param int $status_code
 *   The HTTP status code.
 */
function sendJsonResponse($data, $status_code = 200) {
  http_response_code($status_code);
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}

/**
 * Sends an error response.
 *
 * @param string $message
 *   The error message.
 * @param int $status_code
 *   The HTTP status code.
 */
function sendErrorResponse($message, $status_code = 400) {
  sendJsonResponse([
    'error' => true,
    'message' => $message,
  ], $status_code);
}

/**
 * Loads the courses data from the JSON file.
 *
 * @return array
 *   The courses data.
 */
function loadCoursesData() {
  // 检查课程数据文件是否存在
  if (!file_exists(COURSES_DATA_FILE)) {
    // 如果不存在，尝试创建一个简单的测试数据文件
    createTestDataFile();

    // 再次检查文件是否存在
    if (!file_exists(COURSES_DATA_FILE)) {
      sendErrorResponse('Courses data file not found and could not be created', 500);
    }
  }

  $json_data = file_get_contents(COURSES_DATA_FILE);
  $courses = json_decode($json_data, true);

  if (json_last_error() !== JSON_ERROR_NONE) {
    sendErrorResponse('Error parsing courses data: ' . json_last_error_msg(), 500);
  }

  return $courses;
}

