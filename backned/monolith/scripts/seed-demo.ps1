param(
    [string]$BaseUrl = "http://127.0.0.1:8080",
    [string]$Password = "HireTrackDemo123!"
)

$ErrorActionPreference = "Stop"
$companyId = 1
$jobTitle = "Demo Platform Engineer"

function Invoke-Api {
    param(
        [ValidateSet("Get", "Post", "Put")][string]$Method,
        [string]$Path,
        [object]$Body,
        [string]$Token
    )

    $params = @{
        Method      = $Method
        Uri         = "$BaseUrl$Path"
        ContentType = "application/json"
    }
    if ($null -ne $Body) { $params.Body = ($Body | ConvertTo-Json -Depth 6) }
    if ($Token) { $params.Headers = @{ Authorization = "Bearer $Token" } }
    Invoke-RestMethod @params
}

function Login-OrNull {
    param([string]$Path, [string]$Email)
    try {
        Invoke-Api -Method Post -Path $Path -Body @{ email = $Email; password = $Password }
    } catch {
        $null
    }
}

function Ensure-Employee {
    param([object]$Admin, [string]$Name, [string]$Email, [string]$Role, [string]$EmployeeId)

    $existing = Login-OrNull -Path "/companies/employees/login" -Email $Email
    if ($existing) { return $existing }

    Invoke-Api -Method Post -Path "/companies/$companyId/employees" -Token $Admin.token -Body @{
        name       = $Name
        email      = $Email
        password   = $Password
        role       = $Role
        status     = "ACTIVE"
        department = "Recruitment"
        location   = "Bengaluru"
        employeeId = $EmployeeId
    } | Out-Null

    Login-OrNull -Path "/companies/employees/login" -Email $Email
}

Write-Host "Seeding HireTrack demo workflow at $BaseUrl" -ForegroundColor Cyan

$candidateEmail = "demo.candidate@hiretrack.local"
$candidate = Login-OrNull -Path "/users/login" -Email $candidateEmail
if (-not $candidate) {
    Invoke-Api -Method Post -Path "/users/signup" -Body @{
        name     = "Demo Candidate"
        email    = $candidateEmail
        password = $Password
    } | Out-Null
    $candidate = Login-OrNull -Path "/users/login" -Email $candidateEmail
}

$adminEmail = "demo.company@hiretrack.local"
$admin = Login-OrNull -Path "/companies/login" -Email $adminEmail
if (-not $admin) {
    Invoke-Api -Method Post -Path "/companies/register" -Body @{
        companyName = "Demo HireTrack Labs"
        email       = $adminEmail
        password    = $Password
        location    = "Bengaluru, IN"
        description = "Local integration test company"
    } | Out-Null
    $admin = Login-OrNull -Path "/companies/login" -Email $adminEmail
}

$delivery = Ensure-Employee -Admin $admin -Name "Demo Delivery" -Email "demo.delivery@hiretrack.local" -Role "DELIVERY" -EmployeeId "DEMO-DELIVERY"
$tfg = Ensure-Employee -Admin $admin -Name "Demo TFG" -Email "demo.tfg@hiretrack.local" -Role "TFG" -EmployeeId "DEMO-TFG"
$tag = Ensure-Employee -Admin $admin -Name "Demo TAG" -Email "demo.tag@hiretrack.local" -Role "TAG" -EmployeeId "DEMO-TAG"

$companyJobs = @(Invoke-Api -Method Get -Path "/api/jobs/company/$companyId" -Token $delivery.token)
$job = $companyJobs | Where-Object { $_.title -eq $jobTitle } | Select-Object -First 1
if (-not $job) {
    Invoke-Api -Method Post -Path "/api/jobs" -Token $delivery.token -Body @{
        title            = $jobTitle
        description      = "Build reliable product experiences for the HireTrack platform."
        techStack        = "React, Spring Boot, PostgreSQL"
        experience       = "2-4 years"
        location         = "Bengaluru / Remote"
        salary           = 1200000
        companyId        = $companyId
        createdBy        = $delivery.userId
        openings         = 2
        deadline         = "2027-12-31"
        responsibilities = "Build, test and ship features"
        requirements     = "Strong JavaScript and Java fundamentals"
        assignedTag      = "demo.tag@hiretrack.local"
    } | Out-Null
    $companyJobs = @(Invoke-Api -Method Get -Path "/api/jobs/company/$companyId" -Token $delivery.token)
    $job = $companyJobs | Where-Object { $_.title -eq $jobTitle } | Sort-Object id | Select-Object -Last 1
}

if ($job.status -eq "CREATED") {
    Invoke-Api -Method Put -Path "/api/jobs/$($job.id)/approve/$($tfg.userId)" -Token $tfg.token | Out-Null
}

$candidateJobs = @(Invoke-Api -Method Get -Path "/api/jobs" -Token $candidate.token)
$publishedJob = $candidateJobs | Where-Object { $_.id -eq $job.id } | Select-Object -First 1
if (-not $publishedJob) { throw "Demo job was not published after TFG approval." }

$applications = @(Invoke-Api -Method Get -Path "/applications/user/$($candidate.userId)" -Token $candidate.token)
$application = $applications | Where-Object { $_.jobId -eq $job.id } | Select-Object -First 1
if (-not $application) {
    $application = Invoke-Api -Method Post -Path "/applications" -Token $candidate.token -Body @{
        userId    = $candidate.userId
        jobId     = $job.id
        resumeUrl = "https://example.test/demo-resume.pdf"
    }
}

$tagApplications = @(Invoke-Api -Method Get -Path "/applications/job/$($job.id)" -Token $tag.token)
if ($application.status -eq "APPLIED") {
    $application = Invoke-Api -Method Put -Path "/applications/$($application.id)/status?status=SHORTLISTED" -Token $tag.token
}

$interviews = @(Invoke-Api -Method Get -Path "/interviews/application/$($application.id)" -Token $tag.token)
$interview = $interviews | Select-Object -First 1
if (-not $interview) {
    $interview = Invoke-Api -Method Post -Path "/interviews" -Token $tag.token -Body @{
        applicationId = $application.id
        round         = "L1"
        scheduledAt   = "2027-01-15T10:00:00"
    }
}

if ($interview.status -eq "SCHEDULED") {
    Invoke-Api -Method Put -Path "/interviews/$($interview.id)/feedback?feedback=Strong%20technical%20round" -Token $tag.token | Out-Null
    $interview = Invoke-Api -Method Put -Path "/interviews/$($interview.id)/offer" -Token $tag.token
}

$offer = $null
try { $offer = Invoke-Api -Method Get -Path "/offers/application/$($application.id)" -Token $tag.token } catch { }
if (-not $offer) {
    $offer = Invoke-Api -Method Post -Path "/offers" -Token $tag.token -Body @{
        applicationId = $application.id
        joiningDate   = "2027-02-01"
    }
}
if ($offer.status -eq "OFFER_RELEASED") {
    Invoke-Api -Method Put -Path "/offers/$($offer.id)/accept" -Token $candidate.token | Out-Null
    $offer = Invoke-Api -Method Put -Path "/offers/$($offer.id)/join?joiningDate=2027-02-01" -Token $candidate.token
}

Write-Host "Demo workflow ready" -ForegroundColor Green
[pscustomobject]@{
    CandidateEmail = $candidateEmail
    CompanyEmail   = $adminEmail
    JobId          = $job.id
    JobStatus      = "APPROVED"
    ApplicationId  = $application.id
    InterviewId    = $interview.id
    OfferId        = $offer.id
    OfferStatus    = $offer.status
} | Format-List
