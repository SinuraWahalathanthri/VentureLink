<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$merchant_id = "1227708";
$merchant_secret = "MTE1NjExMzY1MTMzOTM4MTcyNTcxNTc0NzI0ODk0NDAyMDI3MTE3NQ==";


$order_id = $_GET["order_id"];
$amount = $_GET["amount"];
$currency = "LKR";

$hash = strtoupper(
    md5(
        $merchant_id .
            $order_id .
            number_format($amount, 2, '.', '') .
            $currency .
            strtoupper(md5($merchant_secret))
    )
);

echo json_encode([
    "merchant_id" => $merchant_id,
    "hash" => $hash
]);
