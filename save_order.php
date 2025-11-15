<?php
/**
 * 订单保存接口
 * 接收前端订单数据，保存到文件并调用Python脚本发送到Telegram
 */

// 设置错误报告（生产环境可关闭）
error_reporting(E_ALL);
ini_set('display_errors', 0); // 不显示错误，但记录到日志

// 设置响应头
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// 处理OPTIONS预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 只接受POST请求
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false, 
        'error' => '只支持POST请求',
        'method' => $_SERVER['REQUEST_METHOD']
    ]);
    exit;
}

// 读取POST数据
$input = file_get_contents('php://input');

if (empty($input)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => '请求体为空']);
    exit;
}

$order_data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode([
        'success' => false, 
        'error' => 'JSON解析失败: ' . json_last_error_msg(),
        'input' => substr($input, 0, 100) // 只返回前100个字符用于调试
    ]);
    exit;
}

if (!$order_data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => '无效的订单数据']);
    exit;
}

// 验证必需字段
$required_fields = ['orderId', 'account', 'plan', 'priceCNY', 'priceUSDT', 'email', 'status'];
foreach ($required_fields as $field) {
    if (!isset($order_data[$field])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => "缺少必需字段: {$field}"]);
        exit;
    }
}

// 订单文件路径
$orders_file = __DIR__ . '/orders.json';

// 加载现有订单
$orders = [];
if (file_exists($orders_file)) {
    $orders = json_decode(file_get_contents($orders_file), true) ?: [];
}

// 检查订单是否已存在
$order_exists = false;
foreach ($orders as &$order) {
    if ($order['orderId'] === $order_data['orderId']) {
        // 更新现有订单
        $order = array_merge($order, $order_data);
        $order['updatedAt'] = date('Y-m-d\TH:i:s\Z');
        $order_exists = true;
        break;
    }
}

// 如果不存在，添加新订单
if (!$order_exists) {
    $order_data['createdAt'] = date('Y-m-d\TH:i:s\Z');
    $order_data['updatedAt'] = date('Y-m-d\TH:i:s\Z');
    $orders[] = $order_data;
}

// 保存订单到文件
$save_result = file_put_contents($orders_file, json_encode($orders, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

if ($save_result === false) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'error' => '保存订单文件失败，请检查文件权限',
        'file' => $orders_file
    ]);
    exit;
}

// 调用Python脚本处理订单（异步执行，不阻塞响应）
$python_script = __DIR__ . '/fetch_telegram_avatars.py';
if (file_exists($python_script)) {
    // 将订单数据写入临时文件
    $temp_file = sys_get_temp_dir() . '/order_' . $order_data['orderId'] . '.json';
    file_put_contents($temp_file, json_encode($order_data, JSON_UNESCAPED_UNICODE));
    
    // 确定Python解释器路径（优先使用虚拟环境）
    $venv_python = __DIR__ . '/venv/bin/python3';
    $python_cmd = file_exists($venv_python) ? $venv_python : 'python3';
    
    // 异步执行Python脚本（不等待结果）
    $command = $python_cmd . " " . escapeshellarg($python_script) . " --order " . escapeshellarg($temp_file) . " > /dev/null 2>&1 &";
    if (PHP_OS_FAMILY === 'Windows') {
        // Windows系统（优先使用虚拟环境）
        $venv_python_win = __DIR__ . '\\venv\\Scripts\\python.exe';
        $python_cmd_win = file_exists($venv_python_win) ? $venv_python_win : 'python';
        $command = "start /B " . escapeshellarg($python_cmd_win) . " " . escapeshellarg($python_script) . " --order " . escapeshellarg($temp_file);
    }
    exec($command);
}

// 返回成功响应
echo json_encode([
    'success' => true,
    'message' => '订单已保存',
    'orderId' => $order_data['orderId']
]);
?>

