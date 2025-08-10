<?php
// Tiny uploader: saves site to same folder where builder.html lives
header('Content-Type: application/json; charset=utf-8');

// CONFIG
$BASE_URL = 'https://alqulol.xyz/'; // public URL base to return
$ROOT = dirname(__DIR__);           // parent of /api
$MAX_MP3 = 20 * 1024 * 1024;        // 20 MB

function fail($msg, $code=400){ http_response_code($code); echo json_encode(['ok'=>false,'error'=>$msg]); exit; }
function ok($data){ echo json_encode(['ok'=>true] + $data); exit; }

// Validate name
$name = isset($_POST['name']) ? $_POST['name'] : '';
$name = strtolower(trim($name));
if(!$name) fail('Missing name');
if(!preg_match('/^[a-z0-9_-]{1,40}$/', $name)) fail('Invalid name (use letters, numbers, - or _)');

// Inputs
if(!isset($_FILES['profile']) || !isset($_FILES['background']) || !isset($_FILES['music'])) fail('Missing files');

// Validate files
$music = $_FILES['music'];
if($music['error']!==UPLOAD_ERR_OK) fail('Music upload error');
if($music['size'] > $MAX_MP3) fail('MP3 must be ≤ 20MB');
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime_profile = finfo_file($finfo, $_FILES['profile']['tmp_name']);
$mime_bg      = finfo_file($finfo, $_FILES['background']['tmp_name']);
$mime_music   = finfo_file($finfo, $_FILES['music']['tmp_name']);
finfo_close($finfo);

$allowed_img = ['image/png'=>'png','image/jpeg'=>'jpg','image/gif'=>'gif'];
if(!isset($allowed_img[$mime_profile])) fail('Profile must be PNG/JPG/GIF');
if(!isset($allowed_img[$mime_bg])) fail('Background must be GIF/PNG/JPG');
if($mime_music !== 'audio/mpeg') fail('Music must be MP3');

// Paths
$siteDir = $ROOT . DIRECTORY_SEPARATOR . $name;
$filesDir = $ROOT . DIRECTORY_SEPARATOR . ($name . 'files');

if(!is_dir($siteDir) && !mkdir($siteDir, 0775, true)) fail('Cannot create site dir');
if(!is_dir($filesDir) && !mkdir($filesDir, 0775, true)) fail('Cannot create files dir');

// Save HTML
if(!isset($_FILES['html'])) {
  // If html was sent as raw post field 'html' (not file), read from php://input? We expect as file.
  // For simplicity require it as file field 'html'.
}
if($_FILES['html']['error']!==UPLOAD_ERR_OK) fail('HTML upload error');
$indexPath = $siteDir . DIRECTORY_SEPARATOR . 'index.html';
if(!move_uploaded_file($_FILES['html']['tmp_name'], $indexPath)) fail('Cannot save index.html');

// Save assets (keep the exact names expected by the HTML)
$profExt = $allowed_img[$mime_profile];
$bgExt   = $allowed_img[$mime_bg];
$profPath = $filesDir . DIRECTORY_SEPARATOR . "online.$profExt";
$bgPath   = $filesDir . DIRECTORY_SEPARATOR . "onlinebackground.$bgExt";
$mp3Path  = $filesDir . DIRECTORY_SEPARATOR . "online.mp3";

if(!move_uploaded_file($_FILES['profile']['tmp_name'], $profPath)) fail('Cannot save profile');
if(!move_uploaded_file($_FILES['background']['tmp_name'], $bgPath)) fail('Cannot save background');
if(!move_uploaded_file($_FILES['music']['tmp_name'], $mp3Path)) fail('Cannot save music');

// Optional: store discord_id if provided (write a tiny meta file)
if(isset($_POST['discord_id']) && preg_match('/^\d{5,}$/', $_POST['discord_id'])){
  file_put_contents($siteDir . DIRECTORY_SEPARATOR . 'presence.id', trim($_POST['discord_id']));
}

// Success
$url = rtrim($BASE_URL,'/') . '/' . rawurlencode($name);
ok(['url'=>$url]);
