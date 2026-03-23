# API Design Contract

RESTful JSON APIs are used for platform operations. All endpoints under `/api/v1/` require an `Authorization: Bearer <JWT>` header except Auth endpoints.

## 1. Authentication
*   **`POST /api/v1/auth/register`**
    *   *Body*: `{ "name": "...", "email": "...@university.edu", "password": "..." }`
    *   *Response*: `201 Created` with JWT Token. (Future: require `.edu` email validation).
*   **`POST /api/v1/auth/login`**
    *   *Body*: `{ "email": "...", "password": "..." }`

## 2. Request System (Demand)
*   **`POST /api/v1/requests`** (Create Request)
    *   *Body*: 
        ```json
        {
          "title": "Need Mac USB-C Charger",
          "category": "ELECTRONICS",
          "description": "Exams tomorrow, battery at 5%! Help!",
          "urgency": "HIGH",
          "duration_hours": 3,
          "location_tag": "Block A Library"
        }
        ```
    *   *Response*: `201 Created` | `{ "id": "req-123", "status": "OPEN" }`
*   **`GET /api/v1/requests`** (Search/Discovery Feed)
    *   *Query Params*: `?category=ELECTRONICS&status=OPEN&page=0&size=20`
    *   *Response*: Array of Request objects.

## 3. Matching & Offers (Supply)
*   **`POST /api/v1/requests/{requestId}/offers`** (Lender offers item)
    *   *Body*: `{ "message": "I am in Block A, you can come grab it." }`
    *   *Response*: `201 Created`
*   **`GET /api/v1/requests/{requestId}/offers`** (Requester views offers)
    *   *Response*: Array of offers including lender's `trust_score`.
*   **`PUT /api/v1/requests/{requestId}/offers/{offerId}/accept`** (Requester selects a lender)
    *   *Action*: Updates offer to ACCEPTED, cancels other offers, changes Request status to FULFILLED, generates Transaction.
    *   *Response*: `200 OK` | `{ "transaction_id": "txn-789" }`

## 4. Transaction & Lending Workflow
*   **`GET /api/v1/transactions/{transactionId}`**
    *   Returns details, chat initiation context, and due dates.
*   **`PUT /api/v1/transactions/{transactionId}/status`**
    *   *Body*: `{ "status": "IN_POSSESSION" }` (Called when physical handoff occurs)
    *   *Body*: `{ "status": "RETURNED" }` (Called when item is returned)
    
## 5. Trust & Safety
*   **`POST /api/v1/transactions/{transactionId}/reviews`**
    *   *Body*: `{ "rating": 5, "comment": "Life saver, thanks!" }`
    *   *Response*: `201 Created`

## 6. WebSocket Endpoints (STOMP)
Clients connect via `ws://api.domain.com/ws`

*   **Subscribing to User Direct Notifications**:
    `SUBSCRIBE /user/queue/notifications`
    *Payload received*: 
    ```json
    {
      "type": "NEW_OFFER",
      "message": "Alex offered you a Mac Charger!",
      "reference_id": "req-123"
    }
    ```
*   **Subscribing to Local Broadcasts**:
    `SUBSCRIBE /topic/requests/blockA`
    *Payload received*: (Push notification when someone nearby makes an urgent request).
