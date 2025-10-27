$body = @{
    year = 1990
    month = 5
    day = 15
    hour = 14
    isLunar = $false
    gender = "male"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/api/saju/analyze" -Method Post -Body $body -ContentType "application/json"
$response | ConvertTo-Json -Depth 10
