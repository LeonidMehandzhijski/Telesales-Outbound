# Configuration
$projectId = "pauzi-a69be"
$apiKey = "AIzaSyBFuCWUIZP4TRy9vlwe6vxMM794SKIK-Jo"

# Firebase REST API endpoints
$firestoreUrl = "https://firestore.googleapis.com/v1/projects/$projectId/databases/(default)/documents"

# Shifts configuration
$shifts = @(
    @{id="shift_07_15"; name="07:00 - 15:00"; startTime="07:00"; endTime="15:00"},
    @{id="shift_09_17"; name="09:00 - 17:00"; startTime="09:00"; endTime="17:00"},
    @{id="shift_10_18"; name="10:00 - 18:00"; startTime="10:00"; endTime="18:00"},
    @{id="shift_14_22"; name="14:00 - 22:00"; startTime="14:00"; endTime="22:00"},
    @{id="shift_15_23"; name="15:00 - 23:00"; startTime="15:00"; endTime="23:00"},
    @{id="shift_22_06"; name="22:00 - 06:00"; startTime="22:00"; endTime="06:00"; isOvernight=$true}
)

# Common break types for all shifts
$breakTypes = @("Прва пауза", "Втора пауза", "Трета пауза")

# Headers - no authentication needed with open rules
$headers = @{
    "Content-Type" = "application/json"
}

Write-Host "Initializing shifts..."

foreach ($shift in $shifts) {
    $shiftId = $shift.id
    $shiftData = @{
        fields = @{
            id = @{ stringValue = $shift.id }
            name = @{ stringValue = $shift.name }
            startTime = @{ stringValue = $shift.startTime }
            endTime = @{ stringValue = $shift.endTime }
            breakTypes = @{
                arrayValue = @{
                    values = $breakTypes | ForEach-Object { @{ stringValue = $_ } }
                }
            }
            isActive = @{ booleanValue = $true }
            isOvernight = @{ booleanValue = [bool]($shift.isOvernight) }
        }
    }

    $url = "$firestoreUrl/shifts/$shiftId"
    
    try {
        $response = Invoke-RestMethod -Uri $url -Method Patch -Headers $headers -Body ($shiftData | ConvertTo-Json -Depth 10)
        Write-Host "✅ Shift $($shift.name) initialized" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to initialize shift $($shift.name): $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "Error details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
}

# Create settings document
$settingsData = @{
    fields = @{
        lastUpdated = @{ timestampValue = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }
        version = @{ stringValue = "1.0" }
    }
}

try {
    $url = "$firestoreUrl/settings/shifts"
    $response = Invoke-RestMethod -Uri $url -Method Patch -Headers $headers -Body ($settingsData | ConvertTo-Json -Depth 10)
    Write-Host "`n✅ Settings initialized" -ForegroundColor Green
}
catch {
    Write-Host "❌ Failed to initialize settings: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Error details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host "`nInitialization complete!" -ForegroundColor Cyan