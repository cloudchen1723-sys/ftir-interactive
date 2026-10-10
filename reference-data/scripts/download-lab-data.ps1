$ErrorActionPreference = 'Stop'
$dataRoot = Split-Path $PSScriptRoot -Parent
$sourceRoot = Join-Path $dataRoot 'source'
$records = @(
    @{ Name = 'octanoic-acid'; Cas = '124072' },
    @{ Name = 'methyl-acetate'; Cas = '79209' },
    @{ Name = 'tert-butylamine'; Cas = '75649' },
    @{ Name = 'octane'; Cas = '111659' },
    @{ Name = 'acetonitrile'; Cas = '75058' },
    @{ Name = 'styrene'; Cas = '100425' }
)
foreach ($record in $records) {
    $recordUrl = "https://webbook.nist.gov/cgi/cbook.cgi?Contrib=IARPA-IR-L&ID=C$($record.Cas)&Index=0&Type=IR-SPEC"
    $page = Invoke-WebRequest -Uri $recordUrl -TimeoutSec 60
    $jcamp = $page.Links | Where-Object href -Match 'JCAMP=' | Select-Object -First 1
    $metadata = $page.Links | Where-Object href -Match 'silmarils-liquids-n-k/docs/' | Select-Object -First 1
    if (-not $jcamp -or -not $metadata -or $page.Content -notmatch 'Public domain') { throw "Missing PNNL links/license: $($record.Name)" }
    $jcampUrl = [Uri]::new([Uri]$recordUrl, [System.Net.WebUtility]::HtmlDecode([string]$jcamp.href)).AbsoluteUri
    $metadataUrl = [Uri]::new([Uri]$recordUrl, [System.Net.WebUtility]::HtmlDecode([string]$metadata.href)).AbsoluteUri
    $jcampFile = "$($record.Name)-pnnl.jdx"
    $metadataFile = [Uri]::UnescapeDataString(([Uri]$metadataUrl).Segments[-1])
    Invoke-WebRequest -Uri $jcampUrl -OutFile (Join-Path $sourceRoot $jcampFile) -TimeoutSec 60
    Invoke-WebRequest -Uri $metadataUrl -OutFile (Join-Path $sourceRoot $metadataFile) -TimeoutSec 60
    [ordered]@{recordUrl=$recordUrl;downloadUrl=$jcampUrl;metadataUrl=$metadataUrl;owner='Public domain';ownerEvidence='Official PNNL record OWNER field and NIST record Owner row';jcampFile=$jcampFile;metadataFile=$metadataFile} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $sourceRoot "$($record.Name)-provenance.json") -Encoding utf8
    Write-Output "$($record.Name): downloaded original JCAMP and official metadata PDF"
}
