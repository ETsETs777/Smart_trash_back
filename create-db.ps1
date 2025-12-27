# PowerShell script to create PostgreSQL database
# Usage: .\create-db.ps1

$env:PGPASSWORD = "1qa2ws3ed"

# Try to find psql.exe
$psqlPaths = @(
    "C:\Program Files\PostgreSQL\18\bin\psql.exe",
    "C:\Program Files\PostgreSQL\17\bin\psql.exe",
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files\PostgreSQL\14\bin\psql.exe"
)

$psql = $null
foreach ($path in $psqlPaths) {
    if (Test-Path $path) {
        $psql = $path
        break
    }
}

if (-not $psql) {
    Write-Host "PostgreSQL psql.exe not found. Please install PostgreSQL or provide the path." -ForegroundColor Red
    Write-Host "`nYou can create the database manually using pgAdmin or SQL:" -ForegroundColor Yellow
    Write-Host "CREATE DATABASE smart_trash_app_template_dev;" -ForegroundColor Cyan
    exit 1
}

Write-Host "Creating database 'smart_trash_app_template_dev'..." -ForegroundColor Yellow

# Connect to postgres database and create the new database
& $psql -U postgres -h localhost -p 5432 -d postgres -c "CREATE DATABASE smart_trash_app_template_dev;" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Database created successfully!" -ForegroundColor Green
} else {
    Write-Host "Error creating database. It might already exist." -ForegroundColor Yellow
    Write-Host "Trying to continue anyway..." -ForegroundColor Yellow
}

Write-Host "`nDatabase 'smart_trash_app_template_dev' should now be available." -ForegroundColor Green

# Usage: .\create-db.ps1

$env:PGPASSWORD = "1qa2ws3ed"

# Try to find psql.exe
$psqlPaths = @(
    "C:\Program Files\PostgreSQL\18\bin\psql.exe",
    "C:\Program Files\PostgreSQL\17\bin\psql.exe",
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files\PostgreSQL\14\bin\psql.exe"
)

$psql = $null
foreach ($path in $psqlPaths) {
    if (Test-Path $path) {
        $psql = $path
        break
    }
}

if (-not $psql) {
    Write-Host "PostgreSQL psql.exe not found. Please install PostgreSQL or provide the path." -ForegroundColor Red
    Write-Host "`nYou can create the database manually using pgAdmin or SQL:" -ForegroundColor Yellow
    Write-Host "CREATE DATABASE smart_trash_app_template_dev;" -ForegroundColor Cyan
    exit 1
}

Write-Host "Creating database 'smart_trash_app_template_dev'..." -ForegroundColor Yellow

# Connect to postgres database and create the new database
& $psql -U postgres -h localhost -p 5432 -d postgres -c "CREATE DATABASE smart_trash_app_template_dev;" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Database created successfully!" -ForegroundColor Green
} else {
    Write-Host "Error creating database. It might already exist." -ForegroundColor Yellow
    Write-Host "Trying to continue anyway..." -ForegroundColor Yellow
}

Write-Host "`nDatabase 'smart_trash_app_template_dev' should now be available." -ForegroundColor Green

# Usage: .\create-db.ps1

$env:PGPASSWORD = "1qa2ws3ed"

# Try to find psql.exe
$psqlPaths = @(
    "C:\Program Files\PostgreSQL\18\bin\psql.exe",
    "C:\Program Files\PostgreSQL\17\bin\psql.exe",
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files\PostgreSQL\14\bin\psql.exe"
)

$psql = $null
foreach ($path in $psqlPaths) {
    if (Test-Path $path) {
        $psql = $path
        break
    }
}

if (-not $psql) {
    Write-Host "PostgreSQL psql.exe not found. Please install PostgreSQL or provide the path." -ForegroundColor Red
    Write-Host "`nYou can create the database manually using pgAdmin or SQL:" -ForegroundColor Yellow
    Write-Host "CREATE DATABASE smart_trash_app_template_dev;" -ForegroundColor Cyan
    exit 1
}

Write-Host "Creating database 'smart_trash_app_template_dev'..." -ForegroundColor Yellow

# Connect to postgres database and create the new database
& $psql -U postgres -h localhost -p 5432 -d postgres -c "CREATE DATABASE smart_trash_app_template_dev;" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Database created successfully!" -ForegroundColor Green
} else {
    Write-Host "Error creating database. It might already exist." -ForegroundColor Yellow
    Write-Host "Trying to continue anyway..." -ForegroundColor Yellow
}

Write-Host "`nDatabase 'smart_trash_app_template_dev' should now be available." -ForegroundColor Green



