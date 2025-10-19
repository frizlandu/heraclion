# Guide de configuration S3 pour le backend

Ce guide explique comment configurer un bucket S3 (AWS ou Scaleway) pour stocker les fichiers uploadés de l’application en production.

## 1. Créer un bucket S3

### AWS
- Connecte-toi à la console AWS (https://console.aws.amazon.com/s3/)
- Clique « Create bucket »
- Donne un nom unique (ex: heraclion-uploads-prod)
- Choisis la région (ex: eu-west-3 pour Paris)
- Désactive le blocage public si tu veux des fichiers accessibles publiquement (optionnel)
- Crée le bucket

### Scaleway
- Connecte-toi à https://console.scaleway.com/object-storage/buckets
- Clique « Create a bucket »
- Donne un nom et choisis la région
- Crée le bucket

## 2. Créer un utilisateur et récupérer les clés d’accès

### AWS
- Va dans IAM → Users → Add user
- Donne un nom (ex: heraclion-uploader)
- Coche « Programmatic access »
- Attache la politique « AmazonS3FullAccess » (ou restreins à ton bucket)
- Crée l’utilisateur et copie l’Access Key ID et Secret Access Key

### Scaleway
- Va dans « API Keys » → « Create API Key »
- Copie l’Access Key et Secret Key

## 3. Configurer les variables d’environnement Render

Ajoute dans l’onglet Environment du backend :

```
S3_BUCKET=<nom-du-bucket>
S3_REGION=<region>
S3_ACCESS_KEY=<access-key>
S3_SECRET_KEY=<secret-key>
S3_ENDPOINT=<endpoint-URL> # Scaleway: https://s3.<region>.scw.cloud
```

Exemple pour Scaleway Paris :
```
S3_BUCKET=heraclion-uploads-prod
S3_REGION=fr-par
S3_ACCESS_KEY=SCW123...
S3_SECRET_KEY=abc123...
S3_ENDPOINT=https://s3.fr-par.scw.cloud
```

## 4. Adapter le backend

- Vérifie que le backend utilise bien ces variables pour uploader/servir les fichiers (voir `backend/config` ou `backend/utils`)
- Pour AWS, le SDK détecte automatiquement la région et l’endpoint
- Pour Scaleway, il faut souvent préciser l’endpoint dans la config du SDK

## 5. Sécurité et bonnes pratiques

- Ne jamais commettre les clés dans le code
- Limite les permissions de l’utilisateur IAM/API aux opérations nécessaires (putObject, getObject, deleteObject)
- Active le versioning et le lifecycle si tu veux gérer l’archivage ou la suppression automatique

---

Pour toute question sur l’intégration SDK (Node.js, Python, etc.), demande à l’assistant !