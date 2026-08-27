#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Harness Guardrail — 멀티 에이전트 개발 계약 준수 검사
.DESCRIPTION
    다음을 자동 검증한다:
    1. 모든 Spec에 requirements.md, design.md, tasks.md가 존재하는가
    2. Task에 필수 필드(ID, Owner, Acceptance, Verify)가 있는가
    3. DONE 상태 Task에 handoff 기록이 있는가
    4. 환경변수·시크릿이 Git에 포함되지 않았는가
    위반 시 exit code 1을 반환한다.
#>

$ErrorActionPreference = "Continue"
$violations = @()
$script:passCount = 0

function Write-Check {
    param([string]$Name)
    Write-Host ""
    Write-Host "[CHECK] $Name" -ForegroundColor Cyan
}

function Add-Violation {
    param([string]$Message)
    $script:violations += $Message
    Write-Host "  FAIL: $Message" -ForegroundColor Red
}

function Write-Pass {
    param([string]$Message)
    $script:passCount += 1
    Write-Host "  PASS: $Message" -ForegroundColor Green
}

function Get-TaskBlocks {
    param([string]$Content)

    $lines = $Content -split "`r?`n"
    $blocks = @()
    $current = @()

    foreach ($line in $lines) {
        if ($line -match '^- \[[ x]\] TASK-[A-Z0-9]+-\d+\b') {
            if ($current.Count -gt 0) {
                $blocks += ,($current -join "`n")
            }
            $current = @($line)
            continue
        }

        if ($current.Count -gt 0) {
            if ($line -match '^- \[[ x]\] ' -and $line -notmatch '^- \[[ x]\] TASK-[A-Z0-9]+-\d+\b') {
                $blocks += ,($current -join "`n")
                $current = @()
            } else {
                $current += $line
            }
        }
    }

    if ($current.Count -gt 0) {
        $blocks += ,($current -join "`n")
    }

    return $blocks
}

# ============================================================
# CHECK 1: Spec 필수 파일 존재 검사
# ============================================================
Write-Check "Spec 필수 파일 존재 검사"

$specsDir = ".kiro/specs"
if (Test-Path $specsDir) {
    $specFolders = Get-ChildItem -Path $specsDir -Directory
    if ($specFolders.Count -eq 0) {
        Write-Host "  INFO: Spec 폴더가 비어 있습니다. 첫 Spec 생성 시 검사가 활성화됩니다." -ForegroundColor Yellow
    }
    foreach ($folder in $specFolders) {
        $requiredFiles = @("requirements.md", "design.md", "tasks.md")
        foreach ($file in $requiredFiles) {
            $filePath = Join-Path $folder.FullName $file
            if (-not (Test-Path $filePath)) {
                Add-Violation "Spec '$($folder.Name)'에 $file 이 없습니다."
            }
        }
        # 모든 필수 파일 존재 시
        $allExist = $true
        foreach ($file in $requiredFiles) {
            if (-not (Test-Path (Join-Path $folder.FullName $file))) { $allExist = $false }
        }
        if ($allExist) {
            Write-Pass "Spec '$($folder.Name)' — 필수 파일 완비"
        }
    }
} else {
    Write-Host "  INFO: .kiro/specs 디렉토리가 아직 없습니다." -ForegroundColor Yellow
}

# ============================================================
# CHECK 2: Task 계약 필수 필드 검사
# ============================================================
Write-Check "Task 계약 필수 필드 검사"

$taskFiles = @()
if (Test-Path $specsDir) {
    $taskFiles = Get-ChildItem -Path $specsDir -Recurse -Filter "tasks.md"
}

if ($taskFiles.Count -eq 0) {
    Write-Host "  INFO: tasks.md 파일이 없습니다. Spec 생성 후 검사가 활성화됩니다." -ForegroundColor Yellow
} else {
    foreach ($taskFile in $taskFiles) {
        $content = Get-Content $taskFile.FullName -Raw
        $taskBlocks = Get-TaskBlocks -Content $content

        foreach ($taskBlock in $taskBlocks) {
            $taskIdMatch = [regex]::Match($taskBlock, 'TASK-[A-Z0-9]+-\d+')
            if (-not $taskIdMatch.Success) {
                continue
            }

            $taskId = $taskIdMatch.Value
            $requiredFields = @("Status:", "Owner:", "Requirement:", "Acceptance:", "Verify:")
            foreach ($field in $requiredFields) {
                if ($taskBlock -notmatch [regex]::Escape($field)) {
                    Add-Violation "Task '$taskId'에 '$field' 필드가 없습니다. ($($taskFile.Name))"
                }
            }

            if ($taskBlock -match 'Status:\s*(\S+)') {
                $status = $Matches[1]
                $validStatuses = @("READY", "IN_PROGRESS", "VERIFYING", "DONE", "BLOCKED")
                if ($validStatuses -notcontains $status) {
                    Add-Violation "Task '$taskId'의 Status '$status'가 허용 목록에 없습니다."
                }
            }
        }

        if ($taskBlocks.Count -gt 0 -and $violations.Count -eq 0) {
            Write-Pass "$($taskFile.FullName) — 계약 필드 완비 ($($taskBlocks.Count) tasks)"
        }
    }
}

# ============================================================
# CHECK 3: DONE Task의 handoff 기록 검사
# ============================================================
Write-Check "DONE Task의 handoff 기록 검사"

$handoffPath = "docs/handoff.md"
$handoffContent = ""
if (Test-Path $handoffPath) {
    $handoffContent = Get-Content $handoffPath -Raw
}

foreach ($taskFile in $taskFiles) {
    $content = Get-Content $taskFile.FullName -Raw
    $taskBlocks = Get-TaskBlocks -Content $content

    foreach ($taskBlock in $taskBlocks) {
        if ($taskBlock -notmatch 'Status:\s*DONE') {
            continue
        }

        $taskIdMatch = [regex]::Match($taskBlock, 'TASK-[A-Z0-9]+-\d+')
        if (-not $taskIdMatch.Success) {
            continue
        }

        $taskId = $taskIdMatch.Value
        if ($handoffContent -notmatch [regex]::Escape($taskId)) {
            Add-Violation "Task '$taskId'가 DONE이지만 handoff.md에 기록이 없습니다."
        } else {
            Write-Pass "Task '$taskId' — handoff 기록 확인됨"
        }
    }
}

if ($taskFiles.Count -gt 0) {
    $allContent = ($taskFiles | ForEach-Object { Get-Content $_.FullName -Raw }) -join ""
    if ($allContent -notmatch "Status:\s*DONE") {
        Write-Host "  INFO: DONE 상태 Task가 아직 없습니다." -ForegroundColor Yellow
    }
}

# ============================================================
# CHECK 4: 환경변수·시크릿 Git 포함 검사
# ============================================================
Write-Check "환경변수·시크릿 Git 포함 검사"

$sensitivePatterns = @(
    ".env",
    ".env.local",
    ".env.production",
    "credentials.json",
    "*.pem",
    "*.key"
)

$gitTracked = $false
if (Get-Command "git" -ErrorAction SilentlyContinue) {
    $gitFiles = git ls-files 2>$null
    if ($LASTEXITCODE -eq 0 -and $gitFiles) {
        $gitTracked = $true
        foreach ($pattern in $sensitivePatterns) {
            $matches = $gitFiles | Where-Object { $_ -like $pattern }
            foreach ($match in $matches) {
                # .env.example은 허용
                if ($match -eq ".env.example") { continue }
                Add-Violation "민감 파일 '$match'가 Git에 추적되고 있습니다."
            }
        }
        if ($violations.Count -eq 0) {
            Write-Pass "민감 파일 Git 미포함 확인"
        }
    }
}

if (-not $gitTracked) {
    Write-Host "  INFO: Git 저장소가 초기화되지 않았거나 추적 파일이 없습니다." -ForegroundColor Yellow
}

# ============================================================
# RESULT
# ============================================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " HARNESS CHECK RESULT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($violations.Count -gt 0) {
    Write-Host ""
    Write-Host "위반 사항 $($violations.Count)건:" -ForegroundColor Red
    $violations | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host ""
    Write-Host "HARNESS CHECK FAILED" -ForegroundColor Red
    exit 1
} else {
    Write-Host ""
    Write-Host "HARNESS CHECK PASSED ($passCount checks)" -ForegroundColor Green
    exit 0
}
