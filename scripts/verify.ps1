#!/usr/bin/env pwsh
<#
.SYNOPSIS
    프로젝트 검증 스크립트 — lint, typecheck, test를 순서대로 실행한다.
.DESCRIPTION
    각 단계의 명령어가 존재하지 않으면 안내 메시지를 출력하고 건너뛴다.
    하나라도 실패하면 종료 코드 1을 반환한다.
#>

$ErrorActionPreference = "Stop"
$failed = $false

function Write-Step {
    param([string]$Name)
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host " $Name" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
}

function Test-Command {
    param([string]$Cmd)
    $null = Get-Command $Cmd -ErrorAction SilentlyContinue
    return $?
}

# --- Lint ---
Write-Step "LINT"

if (Test-Path "package.json") {
    $pkg = Get-Content "package.json" | ConvertFrom-Json
    if ($pkg.scripts -and $pkg.scripts.lint) {
        Write-Host "Running: npm run lint"
        npm run lint
        if ($LASTEXITCODE -ne 0) { $failed = $true }
    } else {
        Write-Host "[SKIP] 'lint' script not found in package.json. Add a lint script to enable this step." -ForegroundColor Yellow
    }
} elseif (Test-Path "pyproject.toml") {
    if (Test-Command "ruff") {
        Write-Host "Running: ruff check ."
        ruff check .
        if ($LASTEXITCODE -ne 0) { $failed = $true }
    } else {
        Write-Host "[SKIP] ruff not installed. Install with: pip install ruff" -ForegroundColor Yellow
    }
} else {
    Write-Host "[SKIP] No recognized project config found for linting." -ForegroundColor Yellow
}

# --- Typecheck ---
Write-Step "TYPECHECK"

if (Test-Path "tsconfig.json") {
    if (Test-Command "npx") {
        Write-Host "Running: npx tsc --noEmit"
        npx tsc --noEmit
        if ($LASTEXITCODE -ne 0) { $failed = $true }
    } else {
        Write-Host "[SKIP] npx not found. Install Node.js to enable TypeScript type checking." -ForegroundColor Yellow
    }
} elseif (Test-Path "pyproject.toml") {
    if (Test-Command "mypy") {
        Write-Host "Running: mypy ."
        mypy .
        if ($LASTEXITCODE -ne 0) { $failed = $true }
    } else {
        Write-Host "[SKIP] mypy not installed. Install with: pip install mypy" -ForegroundColor Yellow
    }
} else {
    Write-Host "[SKIP] No recognized project config found for type checking." -ForegroundColor Yellow
}

# --- Test ---
Write-Step "TEST"

if (Test-Path "package.json") {
    $pkg = Get-Content "package.json" | ConvertFrom-Json
    if ($pkg.scripts -and $pkg.scripts.test) {
        Write-Host "Running: npm test"
        npm test
        if ($LASTEXITCODE -ne 0) { $failed = $true }
    } else {
        Write-Host "[SKIP] 'test' script not found in package.json. Add a test script to enable this step." -ForegroundColor Yellow
    }
} elseif (Test-Path "pyproject.toml") {
    if (Test-Command "pytest") {
        Write-Host "Running: pytest"
        pytest
        if ($LASTEXITCODE -ne 0) { $failed = $true }
    } else {
        Write-Host "[SKIP] pytest not installed. Install with: pip install pytest" -ForegroundColor Yellow
    }
} else {
    Write-Host "[SKIP] No recognized project config found for testing." -ForegroundColor Yellow
}

# --- Result ---
Write-Host ""
if ($failed) {
    Write-Host "VERIFICATION FAILED" -ForegroundColor Red
    exit 1
} else {
    Write-Host "VERIFICATION PASSED" -ForegroundColor Green
    exit 0
}
