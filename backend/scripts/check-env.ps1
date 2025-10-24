# check-env.ps1
Write-Host "=== Vérification de l'environnement Node.js ==="

# 1. Vérifie la version de Node.js
try {
  $nodeVersion = node -v
  Write-Host "OK - Node.js installé : $nodeVersion"
} catch {
  Write-Host "ERREUR - Node.js non détecté."
}

# 2. Vérifie la connectivité à nodejs.org
Write-Host "`nTest de connexion à https://nodejs.org..."
try {
  $response = Invoke-WebRequest -Uri "https://nodejs.org" -Method Head -UseBasicParsing
  if ($response.StatusCode -eq 200) {
    Write-Host "OK - Connexion réussie"
  } else {
    Write-Host "ATTENTION - Réponse inattendue : $($response.StatusCode)"
  }
} catch {
  Write-Host "ERREUR - Échec de la connexion à nodejs.org"
}

# 3. Vérifie l'accès au cache npm
Write-Host "`nVérification du dossier .npm..."
$npmPath = "$env:USERPROFILE\.npm"
if (Test-Path $npmPath) {
  try {
    Get-ChildItem -Path $npmPath -Force | Out-Null
    Write-Host "OK - Dossier .npm accessible"
  } catch {
    Write-Host "ATTENTION - Erreur d'accès au contenu de .npm"
  }

  # 4. Vérifie les permissions sur .npm
  try {
    $acl = Get-Acl -Path $npmPath
    Write-Host "Propriétaire du dossier .npm : $($acl.Owner)"
  } catch {
    Write-Host "ATTENTION - Impossible de lire les permissions"
  }
} else {
  Write-Host "ERREUR - Dossier .npm introuvable"
}

Write-Host "`n=== Vérification terminée ==="
