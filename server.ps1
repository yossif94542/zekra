$port = 5500
$root = $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }

$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$port/"
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
} catch {
    Write-Host "Port $port might already be in use or access denied. Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Zekra Local Server (v2 ⚡) Running!    " -ForegroundColor Green
Write-Host "  URL: http://localhost:$port/login.html   " -ForegroundColor Yellow
Write-Host "  Press Ctrl+C to stop.                  " -ForegroundColor Gray
Write-Host "==========================================" -ForegroundColor Cyan

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8";
    ".htm"  = "text/html; charset=utf-8";
    ".js"   = "application/javascript; charset=utf-8";
    ".css"  = "text/css; charset=utf-8";
    ".json" = "application/json; charset=utf-8";
    ".svg"  = "image/svg+xml";
    ".png"  = "image/png";
    ".jpg"  = "image/jpeg";
    ".jpeg" = "image/jpeg";
    ".gif"  = "image/gif";
    ".webp" = "image/webp";
    ".mp3"  = "audio/mpeg";
    ".mp4"  = "video/mp4";
    ".ico"  = "image/x-icon"
}

# Open browser automatically if not in a headless/background command
if ([System.Environment]::UserInteractive) {
    try {
        Start-Process "http://localhost:$port/login.html"
    } catch {}
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $urlPath = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($urlPath)) { $urlPath = "login.html" }
        $urlPath = [System.Uri]::UnescapeDataString($urlPath)

        $filePath = Join-Path $root $urlPath

        # Security check: ensure path is within root
        $fullPath = [System.IO.Path]::GetFullPath($filePath)
        $fullRoot = [System.IO.Path]::GetFullPath($root)

        if ($fullPath.StartsWith($fullRoot) -and [System.IO.File]::Exists($fullPath)) {
            $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
            $mime = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
            $response.ContentType = $mime
            $response.AddHeader("Access-Control-Allow-Origin", "*")
            $response.AddHeader("Cache-Control", "no-cache")

            $bytes = [System.IO.File]::ReadAllBytes($fullPath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.StatusCode = 200
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.Close()
    } catch {
        # Handle connection resets or aborted requests gracefully
    }
}
