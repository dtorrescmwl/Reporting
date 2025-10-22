# Customer Support Order Tracking System - Visual Documentation

## Quick Visual Overview

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor':'#e3f2fd','primaryTextColor':'#000','primaryBorderColor':'#1976d2','lineColor':'#1976d2','secondaryColor':'#fff3e0','tertiaryColor':'#e8f5e9','noteBkgColor':'#fff9c4','noteTextColor':'#000','noteBorderColor':'#f57f17'}}}%%
flowchart LR
    subgraph INPUT[" "]
        WH["🌐 CarePortals Webhook<br/><br/>order.updated<br/><br/>POST /exec"]
    end

    subgraph PROCESS[" "]
        SCRIPT["⚙️ Apps Script Processing<br/><br/>• Parse webhook<br/>• Lookup product name<br/>• Update customer dictionary<br/>• Convert UTC → ET<br/>• Check for duplicates"]
    end

    subgraph OUTPUT[" "]
        LOG["📋 full_log Tab<br/><br/>ALL updates logged here<br/>(append-only history)"]

        subgraph TABS["📊 Status-Specific Tabs"]
            direction TB
            STATUS["✓ IF status is tracked:<br/><br/>• pending<br/>• awaiting_payment<br/>• awaiting_requirements<br/>• awaiting_script<br/>• awaiting_shipment<br/>• processing<br/>• shipped"]
        end
    end

    WH -->|"JSON payload"| SCRIPT
    SCRIPT -->|"ALWAYS"| LOG
    SCRIPT -->|"CONDITIONAL"| STATUS

    style INPUT fill:#e3f2fd,stroke:#1976d2,stroke-width:3px
    style PROCESS fill:#fff3e0,stroke:#f57c00,stroke-width:3px
    style OUTPUT fill:#e8f5e9,stroke:#388e3c,stroke-width:3px
    style WH fill:#bbdefb,stroke:#1976d2,stroke-width:2px
    style SCRIPT fill:#ffe0b2,stroke:#f57c00,stroke-width:2px
    style LOG fill:#c8e6c9,stroke:#388e3c,stroke-width:2px
    style TABS fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    style STATUS fill:#fff59d,stroke:#f57f17,stroke-width:2px
```

**Legend:**
- 🔵 **Blue** = External webhook input from CarePortals
- 🟠 **Orange** = Apps Script processing & transformation
- 🟢 **Green** = Always logged (full history)
- 🟡 **Yellow** = Conditionally logged (only tracked statuses)

---

## System Overview

```mermaid
graph TB
    subgraph "External System"
        CP[CarePortals<br/>order.updated webhook]
    end

    subgraph "Apps Script Processing"
        WH[Webhook Receiver<br/>doPost]
        PARSE[Parse JSON Payload]
        EXTRACT[Extract & Transform Data]

        subgraph "Data Enrichment"
            PROD[Product Lookup<br/>product_dictionary]
            CUST[Customer Dictionary<br/>Update/Create]
            TZ[Timezone Conversion<br/>UTC → ET]
        end

        subgraph "Decision Logic"
            CHECK{Status in<br/>tracking list?}
            RACE{Existing entry<br/>more recent?}
        end
    end

    subgraph "Google Sheets Storage"
        LOG[full_log<br/>All updates]

        subgraph "Status Tabs"
            PEND[pending]
            AWPAY[awaiting_payment]
            AWREQ[awaiting_requirements]
            AWSCR[awaiting_script]
            AWSHIP[awaiting_shipment]
            PROC[processing]
            SHIP[shipped]
        end

        PRODDICT[product_dictionary]
        CUSTDICT[customer_dictionary]
    end

    CP -->|POST JSON| WH
    WH --> PARSE
    PARSE --> EXTRACT

    EXTRACT --> PROD
    EXTRACT --> CUST
    EXTRACT --> TZ

    PROD -.->|lookup| PRODDICT
    CUST -.->|update| CUSTDICT

    PROD --> LOG
    CUST --> LOG
    TZ --> LOG

    LOG --> CHECK

    CHECK -->|Yes| RACE
    CHECK -->|No| LOG

    RACE -->|Remove old| PEND
    RACE -->|Remove old| AWPAY
    RACE -->|Remove old| AWREQ
    RACE -->|Remove old| AWSCR
    RACE -->|Remove old| AWSHIP
    RACE -->|Remove old| PROC
    RACE -->|Remove old| SHIP

    RACE -->|Add new| PEND
    RACE -->|Add new| AWPAY
    RACE -->|Add new| AWREQ
    RACE -->|Add new| AWSCR
    RACE -->|Add new| AWSHIP
    RACE -->|Add new| PROC
    RACE -->|Add new| SHIP

    style CP fill:#e1f5ff
    style WH fill:#fff4e6
    style LOG fill:#e8f5e9
    style PRODDICT fill:#f3e5f5
    style CUSTDICT fill:#f3e5f5
```

## Detailed Data Flow

```mermaid
sequenceDiagram
    participant CP as CarePortals<br/>Webhook
    participant AS as Apps Script
    participant PD as Product<br/>Dictionary
    participant CD as Customer<br/>Dictionary
    participant FL as full_log<br/>Tab
    participant ST as Status<br/>Tabs

    CP->>AS: POST webhook data<br/>(order.updated)

    Note over AS: doPost() receives webhook
    AS->>AS: Parse JSON payload

    Note over AS: extractOrderInfo()
    AS->>PD: Lookup product name<br/>by productId
    PD-->>AS: Return product name<br/>or productId

    AS->>AS: Extract pharmacy<br/>from assignedTo fields

    AS->>AS: Build EMR profile link<br/>from customer._id

    AS->>AS: Convert UTC dates<br/>to Eastern Time

    Note over AS: ensureCustomerInDictionary()
    AS->>CD: Check if customer exists
    alt Customer not in dictionary
        AS->>CD: Add customer entry<br/>(ID + Name)
    end

    Note over AS: addToFullLog()
    AS->>FL: Append order record<br/>(always)

    Note over AS: removeFromAllTrackingTabs()
    loop For each status tab
        AS->>ST: Find existing entries<br/>for order number
        alt New entry is more recent
            AS->>ST: Delete old entry
        else Existing is more recent
            AS->>ST: Keep existing entry<br/>Skip new insert
        end
    end

    Note over AS: addToTrackingTab()
    alt Status in tracking list
        AS->>ST: Insert to status tab
    end

    AS-->>CP: Return JSON response<br/>{success: true}
```

## Field Mapping & Transformations

```mermaid
graph LR
    subgraph "Webhook Payload Fields"
        ID["_id<br/>(Internal Order ID)"]
        NUM["id<br/>(Order Number)"]
        CFIRST["customer.firstName"]
        CLAST["customer.lastName"]
        CID["customer._id"]
        STATUS["status"]
        CREATED["createdAt (UTC)"]
        UPDATED["updatedAt (UTC)"]
        STATE["state"]
        PID["productId"]
        TOTAL["totalAmount"]
        AFIRST["assignedTo.firstName"]
        ALAST["assignedTo.lastName"]
    end

    subgraph "Transformations"
        PRODLOOK[Product Lookup]
        PHARMA[Pharmacy Concat]
        EMRLINK[EMR Link Build]
        TZCONV[Timezone Convert]
        NAMECAT[Name Concat]
    end

    subgraph "Sheet Columns"
        COL1["Order #"]
        COL2["Product"]
        COL3["Total Amount"]
        COL4["Name"]
        COL5["Created Date"]
        COL6["Last Update"]
        COL7["Status"]
        COL8["State"]
        COL9["Pharmacy"]
        COL10["EMR Profile"]
    end

    NUM --> COL1
    PID --> PRODLOOK --> COL2
    TOTAL --> COL3
    CFIRST --> NAMECAT
    CLAST --> NAMECAT
    NAMECAT --> COL4
    CREATED --> TZCONV --> COL5
    UPDATED --> TZCONV --> COL6
    STATUS --> COL7
    STATE --> COL8
    AFIRST --> PHARMA
    ALAST --> PHARMA
    PHARMA --> COL9
    CID --> EMRLINK --> COL10

    style PRODLOOK fill:#ffe0b2
    style PHARMA fill:#ffe0b2
    style EMRLINK fill:#ffe0b2
    style TZCONV fill:#ffe0b2
    style NAMECAT fill:#ffe0b2
```

## Race Condition Protection Logic

```mermaid
flowchart TD
    START([New Webhook Received])
    PARSE[Parse Order Data]
    EXTRACT[Extract Order Info<br/>with lastUpdate timestamp]
    FULLLOG[Add to full_log<br/>Always]

    CHECKSTATUS{Status in<br/>tracking list?}

    LOOPTABS[Loop through all<br/>status tabs]
    FINDROWS[Find rows with<br/>matching Order #]

    HASROWS{Found existing<br/>rows?}
    COMPARE{New lastUpdate ><br/>Existing lastUpdate?}

    REMOVE[Delete existing row]
    KEEP[Keep existing row<br/>Skip new insert]

    INSERT[Insert to status tab]
    SKIP[Skip status tab insert]

    END([Return Success])

    START --> PARSE
    PARSE --> EXTRACT
    EXTRACT --> FULLLOG
    FULLLOG --> CHECKSTATUS

    CHECKSTATUS -->|Yes| LOOPTABS
    CHECKSTATUS -->|No| SKIP

    LOOPTABS --> FINDROWS
    FINDROWS --> HASROWS

    HASROWS -->|Yes| COMPARE
    HASROWS -->|No| INSERT

    COMPARE -->|Yes| REMOVE
    COMPARE -->|No| KEEP

    REMOVE --> INSERT
    KEEP --> END
    INSERT --> END
    SKIP --> END

    style START fill:#e3f2fd
    style END fill:#e3f2fd
    style COMPARE fill:#fff9c4
    style CHECKSTATUS fill:#fff9c4
```

## Tracked Status Categories

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor':'#fff3e0','secondaryColor':'#e8f5e9','tertiaryColor':'#e3f2fd'}}}%%
graph TB
    subgraph TRACKED["✅ Tracked Statuses<br/>(Get their own tabs)"]
        direction LR
        S1[pending]
        S2[awaiting_payment]
        S3[awaiting_requirements]
        S4[awaiting_script]
        S5[awaiting_shipment]
        S6[processing]
        S7[shipped]
    end

    subgraph LOGIC["Script Behavior"]
        direction TB
        CHECK{Is status<br/>in tracked list?}
        YES["✓ Create/update status tab<br/>✓ Log to full_log"]
        NO["✓ Log to full_log only<br/>✗ No status tab"]
    end

    WEBHOOK["🌐 Incoming Webhook<br/>(any status)"]

    WEBHOOK --> CHECK
    CHECK -->|Yes| YES
    CHECK -->|No| NO

    YES -.->|"Uses one of"| TRACKED

    style TRACKED fill:#fff3e0,stroke:#f57c00,stroke-width:3px
    style LOGIC fill:#e3f2fd,stroke:#1976d2,stroke-width:3px
    style WEBHOOK fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    style CHECK fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    style YES fill:#c8e6c9,stroke:#388e3c,stroke-width:2px
    style NO fill:#ffccbc,stroke:#d84315,stroke-width:2px
    style S1 fill:#ffe0b2,stroke:#f57c00
    style S2 fill:#ffe0b2,stroke:#f57c00
    style S3 fill:#ffe0b2,stroke:#f57c00
    style S4 fill:#ffe0b2,stroke:#f57c00
    style S5 fill:#ffe0b2,stroke:#f57c00
    style S6 fill:#ffe0b2,stroke:#f57c00
    style S7 fill:#ffe0b2,stroke:#f57c00
```

**Important Notes:**
- ⚠️ The script does **NOT enforce** any specific status progression
- ⚠️ Orders can have **ANY status** - these are just the 7 that get tracked in separate tabs
- ⚠️ Orders can move to **ANY status from ANY other status** (including backwards)
- ⚠️ Statuses not in this list are still logged to `full_log`, just not given their own tab
- ✅ All status changes are **always logged** to the `full_log` tab regardless of status
- ✅ **Cancelled orders ARE removed** from their current tracking tab (e.g., "pending", "processing") when the cancellation webhook is received
- ❌ Cancelled orders are **NOT added** to a "cancelled" tracking tab (since "cancelled" is not in TRACKING_STATUSES)
- ✅ Cancelled orders **ARE still recorded** in `full_log` with status "cancelled"

## Data Dictionary

### Input Source
- **System**: CarePortals
- **Trigger**: `order.updated` webhook
- **Format**: JSON POST request
- **URL Parameter**: None required

### Webhook Payload Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `_id` | String | Internal order ID | `"7893efc2581fe0505d48c681"` |
| `id` | Number | Order number (4-digit) | `9876` |
| `customer._id` | String | Customer internal ID | `"7820cf7b9fdd8c7aae179818"` |
| `customer.firstName` | String | Customer first name | `"Jane"` |
| `customer.lastName` | String | Customer last name | `"Doe"` |
| `status` | String | Current order status | `"pending"` |
| `createdAt` | String | Order creation time (UTC) | `"2024-07-25T10:00:00.000Z"` |
| `updatedAt` | String | Last update time (UTC) | `"2024-07-25T10:05:00.000Z"` |
| `state` | String | US state code | `"NY"` |
| `productId` | String | Product internal ID | `"778e289d7ea1698a8757aa44"` |
| `totalAmount` | Number | Order total in dollars | `99.50` |
| `assignedTo.firstName` | String | Pharmacy first part | `"CityCentral"` |
| `assignedTo.lastName` | String | Pharmacy last part | `"Pharmacy"` |

### Sheet Output Structure

**Sheet Name**: Customer support order tracking
**Spreadsheet ID**: `1h-ttn7R6s2KszovW_NvBI1x6fVUaXAjcID6-Xa0ISsw`

#### Tabs Created

| Tab Name | Purpose | Clearing Logic |
|----------|---------|----------------|
| `full_log` | Complete history of all updates | Never cleared, append-only |
| `pending` | Orders in pending status | Entries removed when order changes to ANY other status (including cancelled) |
| `awaiting_payment` | Orders awaiting payment | Entries removed when order changes to ANY other status (including cancelled) |
| `awaiting_requirements` | Orders awaiting requirements | Entries removed when order changes to ANY other status (including cancelled) |
| `awaiting_script` | Orders awaiting prescription | Entries removed when order changes to ANY other status (including cancelled) |
| `awaiting_shipment` | Orders awaiting shipment | Entries removed when order changes to ANY other status (including cancelled) |
| `processing` | Orders being processed | Entries removed when order changes to ANY other status (including cancelled) |
| `shipped` | Orders that have shipped | Entries removed when order changes to ANY other status (including cancelled) |
| `product_dictionary` | Product ID → Name mapping | Reference data |
| `customer_dictionary` | Customer ID → Name mapping | Auto-updated |
| `upcoming_renewal` | Renewal webhooks (via ?trigger=renewal) | Manual management |

#### Column Structure (All tabs except dictionaries)

| Column | Field Name | Type | Source | Transformation |
|--------|-----------|------|--------|----------------|
| A | Order # | Number | `id` | Direct |
| B | Product | String | `productId` | Lookup from product_dictionary |
| C | Total Amount | Number | `totalAmount` | Direct |
| D | Name | String | `customer.firstName` + `customer.lastName` | Concatenated with space |
| E | Created Date | Date | `createdAt` | UTC → Eastern Time |
| F | Last Update | Date | `updatedAt` | UTC → Eastern Time |
| G | Status | String | `status` | Direct |
| H | State | String | `state` | Direct |
| I | Pharmacy | String | `assignedTo.firstName` + `assignedTo.lastName` | Concatenated with space |
| J | EMR Profile | URL | `customer._id` | `https://emr.portals.care/customers/{id}?tab=orders` |

### Tracked Statuses
```
pending
awaiting_payment
awaiting_requirements
awaiting_script
awaiting_shipment
processing
shipped
```

Orders with statuses outside this list (e.g., "cancelled", "completed", "refunded") are:
- ✅ Logged to `full_log` with their status
- ✅ Removed from their previous tracking tab (if they were in one)
- ❌ NOT added to any new tracking tab

### Race Condition Protection
- Compares `updatedAt` timestamps between incoming webhook and existing sheet entries
- Only overwrites existing entry if new entry has more recent timestamp
- Prevents out-of-order webhooks from corrupting current status
- Uses timestamp comparison: `new Date(newLastUpdate).getTime() > new Date(existingLastUpdate).getTime()`

### Timezone Handling
- **Input**: UTC timestamps from CarePortals
- **Output**: Eastern Time (automatically handles EST/EDT)
- **Method**: JavaScript `toLocaleString()` with timezone `"America/New_York"`
- **Format**: `MM/DD/YYYY, HH:MM:SS AM/PM`

## Deployment Information

- **Script ID**: `1Gbz9NS7OPRrSi_P8GSy2f_cCspXAX8HbxpJMkAKsbopWHiryXhHK9FvK`
- **Deployment URL**: https://script.google.com/macros/s/AKfycbxci3zpOxCyTHRLh47aje0nx9HrAUSvRFflDV8Kz8TSK1Ogst5w0Y_A-65xQMTOTsupdQ/exec
- **Execute As**: Owner (you)
- **Access**: Anyone (required for webhooks)
- **Target Spreadsheet**: https://docs.google.com/spreadsheets/d/1h-ttn7R6s2KszovW_NvBI1x6fVUaXAjcID6-Xa0ISsw/edit

## Key Features

1. **Real-time Status Tracking**: Each order status gets its own tab for easy customer support filtering
2. **Complete History**: `full_log` maintains append-only history of all status changes
3. **Race Condition Safe**: Timestamp comparison prevents out-of-order webhook processing
4. **Data Enrichment**:
   - Product names looked up from dictionary
   - Direct links to EMR profiles
   - Pharmacy names extracted and formatted
5. **Automatic Dictionary Management**: Customer entries automatically added/updated
6. **Timezone Aware**: All dates converted to Eastern Time for consistent viewing

## Error Handling

- All errors logged to console with stack traces
- Failed webhook returns JSON error response
- Dictionary lookup failures fall back to displaying raw IDs
- Date conversion errors fall back to removing old entry (safe default)

## Testing

Use the `testWithSampleData()` function in the script to test with sample order data without triggering actual webhooks.

---

**Last Updated**: 2025-10-14
**Script Version**: Latest
**Diagram Format**: Mermaid (GitHub/Markdown compatible)
