<?php
/**
 * 订单保存接口
 * 接收前端订单数据，保存到文件并调用Python脚本发送到Telegram
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// 处理OPTIONS请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 只接受POST请求
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => '只支持POST请求']);
    exit;
}

// 读取POST数据
$input = file_get_contents('php://input');
$order_data = json_decode($input, true);

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
file_put_contents($orders_file, json_encode($orders, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

// 调用Python脚本处理订单（异步执行，不阻塞响应）
$python_script = __DIR__ . '/fetch_telegram_avatars.py';
if (file_exists($python_script)) {
    // 将订单数据写入临时文件
    $temp_file = sys_get_temp_dir() . '/order_' . $order_data['orderId'] . '.json';
    file_put_contents($temp_file, json_encode($order_data, JSON_UNESCAPED_UNICODE));
    
    // 异步执行Python脚本（不等待结果）
    $command = "python3 " . escapeshellarg($python_script) . " --order " . escapeshellarg($temp_file) . " > /dev/null 2>&1 &";
    if (PHP_OS_FAMILY === 'Windows') {
        // Windows系统
        $command = "start /B python " . escapeshellarg($python_script) . " --order " . escapeshellarg($temp_file);
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

