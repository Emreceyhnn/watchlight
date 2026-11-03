$certsDir = Join-Path $PSScriptRoot "..\certs"
if (-not (Test-Path $certsDir)) {
    New-Item -ItemType Directory -Path $certsDir -Force | Out-Null
}

$certFile = Join-Path $certsDir "fullchain.pem"
$keyFile = Join-Path $certsDir "privkey.pem"

if ((Test-Path $certFile) -and (Test-Path $keyFile)) {
    Write-Host "TLS certificates already exist in $certsDir. Skipping generation."
    exit 0
}

Write-Host "Generating self-signed development/staging TLS certificates in $certsDir..."
if (Get-Command openssl -ErrorAction SilentlyContinue) {
    & openssl req -x509 -nodes -days 365 -newkey rsa:2048 `
      -keyout $keyFile `
      -out $certFile `
      -subj "/C=US/ST=State/L=City/O=Watchlight/OU=SOC/CN=localhost" `
      -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
    Write-Host "TLS certificates generated via openssl."
} else {
    Write-Host "OpenSSL not found in PATH. Creating fallback placeholder cert files to prevent Nginx boot crashes..."
    "# Fallback Development Certificate - replace with real certificate or run with openssl" | Out-File -FilePath $certFile -Encoding utf8
    "# Fallback Development Private Key - replace with real key or run with openssl" | Out-File -FilePath $keyFile -Encoding utf8
}

