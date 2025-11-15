<?php
/**
 * PHP 测试文件
 * 用于检查 PHP 是否正常工作
 */

header('Content-Type: application/json; charset=utf-8');

$info = [
    'php_version' => phpversion(),
    'server_method' => $_SERVER['REQUEST_METHOD'] ?? 'N/A',
    'request_uri' => $_SERVER['REQUEST_URI'] ?? 'N/A',
    'script_name' => $_SERVER['SCRIPT_NAME'] ?? 'N/A',
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'N/A',
    'php_self' => $_SERVER['PHP_SELF'] ?? 'N/A',
    'file_exists' => file_exists(__FILE__),
    'is_readable' => is_readable(__FILE__),
    'current_dir' => __DIR__,
    'post_data' => file_get_contents('php://input'),
    'timestamp' => date('Y-m-d H:i:s')
];

echo json_encode($info, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>

