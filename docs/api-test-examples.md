# API Test Examples

Esempi curl per testare le API dei servizi e abbonamenti.

## Setup

Prima di testare, ottieni un token di autenticazione:

```bash
# Login e salva il token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"yourpassword"}' \
  | jq -r '.data.session.accessToken')

echo "Token: $TOKEN"
```

## Services API (Pubbliche)

### GET /api/services
Lista tutti i servizi disponibili (non richiede auth):

```bash
curl -s http://localhost:3001/api/services | jq .
```

Risposta attesa:
```json
{
  "success": true,
  "data": {
    "services": [
      {
        "id": "uuid",
        "code": "smart_review",
        "name": "Smart Review",
        "description": "Gestisci le recensioni della tua attività",
        "appUrl": "https://smart-card.it/review",
        "icon": "star",
        "color": "#FFB800",
        "sortOrder": 1
      }
    ]
  }
}
```

### GET /api/services/:code
Dettaglio servizio con piani disponibili:

```bash
curl -s http://localhost:3001/api/services/smart_review | jq .
```

Risposta attesa:
```json
{
  "success": true,
  "data": {
    "service": {
      "id": "uuid",
      "code": "smart_review",
      "name": "Smart Review",
      "description": "...",
      "appUrl": "https://smart-card.it/review",
      "icon": "star",
      "color": "#FFB800"
    },
    "plans": [
      {
        "id": "uuid",
        "code": "free",
        "name": "Free",
        "priceMonthly": 0,
        "priceYearly": 0,
        "trialDays": 0,
        "features": {"platforms": 2, "filter": false}
      },
      {
        "id": "uuid",
        "code": "pro",
        "name": "Pro",
        "priceMonthly": 14.90,
        "priceYearly": 149.00,
        "trialDays": 30,
        "features": {"platforms": 10, "filter": true}
      }
    ]
  }
}
```

## Subscriptions API (Richiedono Auth)

### GET /api/subscriptions/dashboard
Dashboard con tutti i servizi e stato abbonamenti dell'utente:

```bash
curl -s http://localhost:3001/api/subscriptions/dashboard \
  -H "Authorization: Bearer $TOKEN" | jq .
```

Risposta attesa:
```json
{
  "success": true,
  "data": {
    "services": [
      {
        "service": {
          "id": "uuid",
          "code": "smart_review",
          "name": "Smart Review",
          "description": "...",
          "appUrl": "...",
          "icon": "star",
          "color": "#FFB800"
        },
        "subscription": null,
        "isActive": false,
        "canAccess": false
      },
      {
        "service": {
          "id": "uuid",
          "code": "smart_page",
          "name": "Smart Page",
          "...": "..."
        },
        "subscription": {
          "id": "uuid",
          "status": "trial",
          "plan": {"id": "uuid", "code": "pro", "name": "Pro"},
          "trialEndsAt": "2024-02-15T10:00:00Z",
          "expiresAt": "2024-02-15T10:00:00Z"
        },
        "isActive": true,
        "canAccess": true
      }
    ]
  }
}
```

### POST /api/subscriptions/trial
Attiva trial per un servizio:

```bash
curl -s -X POST http://localhost:3001/api/subscriptions/trial \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"serviceCode": "smart_review"}' | jq .
```

Risposta attesa:
```json
{
  "success": true,
  "data": {
    "subscription": {
      "id": "uuid",
      "status": "trial",
      "trialEndsAt": "2024-02-15T10:00:00Z",
      "service": {"code": "smart_review", "name": "Smart Review"},
      "plan": {"code": "pro", "name": "Pro", "trialDays": 30}
    }
  },
  "message": "Trial attivato con successo"
}
```

### POST /api/subscriptions/activate
Attiva abbonamento (senza pagamento reale):

```bash
curl -s -X POST http://localhost:3001/api/subscriptions/activate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"serviceCode": "smart_review", "planCode": "pro", "billingCycle": "monthly"}' | jq .
```

Risposta attesa:
```json
{
  "success": true,
  "data": {
    "subscription": {
      "id": "uuid",
      "status": "active",
      "billingCycle": "monthly",
      "currentPeriodEnd": "2024-02-15T10:00:00Z",
      "service": {"code": "smart_review"},
      "plan": {"code": "pro", "priceMonthly": 14.90}
    }
  },
  "message": "Abbonamento attivato con successo"
}
```

### POST /api/subscriptions/cancel
Cancella abbonamento:

```bash
curl -s -X POST http://localhost:3001/api/subscriptions/cancel \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"serviceCode": "smart_review"}' | jq .
```

Risposta attesa:
```json
{
  "success": true,
  "message": "Abbonamento cancellato con successo"
}
```

### GET /api/subscriptions/check/:serviceCode
Verifica stato abbonamento per servizio:

```bash
curl -s http://localhost:3001/api/subscriptions/check/smart_review \
  -H "Authorization: Bearer $TOKEN" | jq .
```

Risposta attesa (con abbonamento attivo):
```json
{
  "success": true,
  "data": {
    "isActive": true,
    "canAccess": true,
    "status": "trial",
    "expiresAt": "2024-02-15T10:00:00Z",
    "plan": {
      "id": "uuid",
      "code": "pro",
      "name": "Pro",
      "priceMonthly": 14.90,
      "features": {"platforms": 10, "filter": true}
    }
  }
}
```

Risposta attesa (senza abbonamento):
```json
{
  "success": true,
  "data": {
    "isActive": false,
    "canAccess": false,
    "status": null,
    "expiresAt": null,
    "plan": null
  }
}
```

### GET /api/subscriptions
Lista abbonamenti utente corrente:

```bash
curl -s http://localhost:3001/api/subscriptions \
  -H "Authorization: Bearer $TOKEN" | jq .
```

## Script di Test Completo

```bash
#!/bin/bash

BASE_URL="http://localhost:3001/api"

# Login
echo "=== LOGIN ==="
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@doid.it","password":"Test1234"}')
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.session.accessToken')
echo "Token ottenuto: ${TOKEN:0:20}..."

# Test Services (pubblico)
echo -e "\n=== GET SERVICES ==="
curl -s $BASE_URL/services | jq '.data.services | length'

echo -e "\n=== GET SERVICE DETAIL ==="
curl -s $BASE_URL/services/smart_review | jq '.data.service.name'

# Test Subscriptions Dashboard
echo -e "\n=== SUBSCRIPTIONS DASHBOARD ==="
curl -s $BASE_URL/subscriptions/dashboard \
  -H "Authorization: Bearer $TOKEN" | jq '.data.services | length'

# Attiva Trial
echo -e "\n=== ACTIVATE TRIAL ==="
curl -s -X POST $BASE_URL/subscriptions/trial \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"serviceCode": "smart_review"}' | jq '.message'

# Check Subscription
echo -e "\n=== CHECK SUBSCRIPTION ==="
curl -s $BASE_URL/subscriptions/check/smart_review \
  -H "Authorization: Bearer $TOKEN" | jq '.data.isActive'

# Cancel
echo -e "\n=== CANCEL SUBSCRIPTION ==="
curl -s -X POST $BASE_URL/subscriptions/cancel \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"serviceCode": "smart_review"}' | jq '.message'

echo -e "\n=== DONE ==="
```

## Errori Comuni

### 401 Unauthorized
Token mancante o scaduto. Rieffettua il login.

### 409 Conflict
Esiste già un abbonamento per questo servizio (quando si prova ad attivare un trial).

### 404 Not Found
Servizio o piano non trovato.

### 400 Bad Request
Parametri mancanti o non validi.
