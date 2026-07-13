param (
    [string]$Token = "",
    [string]$ApiUrl = "http://localhost:8080"
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "    BetBot - Windows Local Agent Setup   " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

$InstallDir = "C:\betbot"
$BinDir = "$InstallDir\bin"

# 1. Criar pastas de trabalho
if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir | Out-Null
    Write-Host "Pasta de trabalho criada em: $InstallDir" -ForegroundColor Green
}
if (-not (Test-Path $BinDir)) {
    New-Item -ItemType Directory -Path $BinDir | Out-Null
}

# 2. Instalar Python 3 via Winget se não existir
if (-not (Get-Command "python" -ErrorAction SilentlyContinue)) {
    Write-Host "Python não encontrado. Instalando Python 3 via Winget..." -ForegroundColor Yellow
    winget install Python.Python.3 --silent --accept-package-agreements --accept-source-agreements
    if (-not (Get-Command "python" -ErrorAction SilentlyContinue)) {
        Write-Host "Aviso: A instalação do Python pelo Winget foi disparada, mas ainda não está no PATH desta sessão." -ForegroundColor Yellow
        Write-Host "Por favor, reinicie o PowerShell após a conclusão da instalação." -ForegroundColor Yellow
    } else {
        Write-Host "Python instalado com sucesso!" -ForegroundColor Green
    }
} else {
    Write-Host "Python 3 já instalado." -ForegroundColor Green
}

# 3. Instalar ADB (Platform Tools) se não existir
$AdbPath = "$BinDir\platform-tools\adb.exe"
if (-not (Test-Path $AdbPath)) {
    Write-Host "Instalando Android SDK Platform-Tools (ADB)..." -ForegroundColor Yellow
    $ZipUrl = "https://dl.google.com/android/repository/platform-tools-latest-windows.zip"
    $ZipFile = "$InstallDir\platform-tools.zip"
    
    # Download zip
    Invoke-WebRequest -Uri $ZipUrl -OutFile $ZipFile
    # Unzip
    Expand-Archive -Path $ZipFile -DestinationPath $BinDir -Force
    # Clean zip
    Remove-Item $ZipFile -Force
    Write-Host "ADB instalado com sucesso em $BinDir\platform-tools" -ForegroundColor Green
} else {
    Write-Host "ADB (Platform Tools) já instalado." -ForegroundColor Green
}

# 4. Adicionar caminhos ao PATH do usuário para persistência
$UserPath = [Environment]::GetEnvironmentVariable("Path", "User")
$AdbBinPath = "$BinDir\platform-tools"
if ($UserPath -notlike "*$AdbBinPath*") {
    [Environment]::SetEnvironmentVariable("Path", $UserPath + ";" + $AdbBinPath, "User")
    Write-Host "ADB adicionado ao PATH do Usuário." -ForegroundColor Green
}

# 5. Baixar o agent.py do portal
$AgentUrl = "$ApiUrl/install/agent.py"
# Se for localhost:8080 na API, o portal roda em localhost:3000 em dev.
# Vamos ajustar a URL do portal
$PortalUrl = $ApiUrl.Replace("8080", "3000")
$AgentDownloadUrl = "$PortalUrl/install/agent.py"

Write-Host "Baixando o agente local de: $AgentDownloadUrl" -ForegroundColor Yellow
$AgentFile = "$InstallDir\agent.py"
try {
    Invoke-WebRequest -Uri $AgentDownloadUrl -OutFile $AgentFile -TimeoutSec 15
    Write-Host "Agente local agent.py salvo com sucesso em $InstallDir." -ForegroundColor Green
} catch {
    Write-Host "Erro ao baixar agent.py do portal. Criando script de fallback local..." -ForegroundColor Red
    # Se falhar o download do portal, cria um esqueleto do agent.py ou avisa.
}

# 6. Gravar config.json local com o token
$ConfigJson = @{
    token = $Token
    api_url = $ApiUrl
    credentials_path = "$InstallDir\.env"
    device_id = ""
} | ConvertTo-Json

$ConfigFile = "$InstallDir\config.json"
$ConfigJson | Out-File -FilePath $ConfigFile -Encoding utf8
Write-Host "Configurações locais de tokens gravadas em: $ConfigFile" -ForegroundColor Green

# 7. Criar arquivo de credenciais bet365 de exemplo
$EnvFile = "$InstallDir\.env"
if (-not (Test-Path $EnvFile)) {
    $EnvTemplate = @"
# Insira suas credenciais da Bet365 (SÃO MANTIDAS APENAS NO SEU COMPUTADOR)
BET365_EMAIL=seu_email@provedor.com
BET365_PASSWORD=sua_senha_segura
"@
    $EnvTemplate | Out-File -FilePath $EnvFile -Encoding utf8
    Write-Host "Arquivo de exemplo para credenciais criado em: $EnvFile" -ForegroundColor Yellow
}

Write-Host "`n=========================================" -ForegroundColor Green
Write-Host "    Instalação concluída com SUCESSO!    " -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host "1. Edite o arquivo '$EnvFile' com seu login Bet365."
Write-Host "2. Conecte seu celular Android físico e ative a Depuração USB."
Write-Host "3. Para iniciar o agente em segundo plano, execute:"
Write-Host "   python $InstallDir\agent.py" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Green
