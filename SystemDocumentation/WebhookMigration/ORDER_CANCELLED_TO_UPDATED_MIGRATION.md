# Order.Cancelled to Order.Updated Migration Plan

## Overview
The `order.cancelled` webhook and sheet tab can be deprecated in favor of the more comprehensive `order.updated` system. The `order.updated` tab contains all order status changes, including cancellations, with additional context and better data structure.

## Current Dependencies Analysis

### Dashboard Scripts Using order.cancelled

#### 1. General Dashboard (`/DashboardVisualization/GeneralDashboard/GeneralDashboardCode.gs`)
**Files affected:**
- `GeneralDashboardCode.gs` (lines 139-143, 367-376)

**Current usage:**
- Loads `order.cancelled` sheet data to exclude cancelled orders from metrics
- Creates a Set of cancelled order IDs for filtering: `cancelledOrderIds.has(order.order_id)`
- Used in `getTimeRangeData()` function to filter out cancelled orders from revenue calculations

**Migration needed:**
- Replace `order.cancelled` sheet reference with `order.updated` sheet
- Filter `order.updated` data for status containing "cancelled" or "deleted"
- Update logic to identify cancelled orders from status field instead of dedicated sheet

#### 2. KPI Dashboard (`/DashboardVisualization/InitialKPI/Code.gs`)
**Files affected:**
- `Code.gs` (lines 78, 814, 2133, 2164)
- `README.md` (line 55)

**Current usage:**
- Loads `order.cancelled` data for cancelled order rate calculations
- Used in `calculateCancelledOrderRefundRate()` function (lines 456-575)
- Tracks cancellation metrics and churn analysis
- Required sheet validation (line 2133)

**Migration needed:**
- Replace `getSheetData(ss, 'order.cancelled')` with filtered `order.updated` data
- Update `calculateCancelledOrderRefundRate()` to work with status-based cancellation detection
- Modify sheet validation to check for `order.updated` instead

## Migration Implementation Plan

### Phase 1: Update Data Loading Functions

#### General Dashboard Changes
```javascript
// OLD CODE (line 139):
const cancelledOrderSheet = spreadsheet.getSheetByName('order.cancelled');

// NEW CODE:
const orderUpdatedSheet = spreadsheet.getSheetByName('order.updated');
// Filter for cancelled/deleted orders
const cancelledOrderData = orderUpdatedData.filter(order =>
  order.updated_status &&
  (order.updated_status.toLowerCase().includes('cancelled') ||
   order.updated_status.toLowerCase().includes('deleted'))
);
```

#### KPI Dashboard Changes
```javascript
// OLD CODE (line 78, 814, 2164):
cancelled: getSheetData(ss, 'order.cancelled'),

// NEW CODE:
cancelled: getSheetData(ss, 'order.updated').filter(order =>
  order.updated_status &&
  (order.updated_status.toLowerCase().includes('cancelled') ||
   order.updated_status.toLowerCase().includes('deleted'))
),
```

### Phase 2: Update Calculation Logic

#### Cancelled Order Rate Function Updates
The `calculateCancelledOrderRefundRate()` function needs modification to:
1. Extract unique order IDs from filtered `order.updated` data
2. Use `Datetime Updated` instead of cancellation-specific timestamp
3. Maintain same calculation logic but with new data source

#### Data Structure Mapping
| Old (order.cancelled) | New (order.updated) | Notes |
|----------------------|---------------------|-------|
| `order_id` | `order_id` | Direct mapping |
| `deleted_datetime` | `Datetime Updated` | When status changed to cancelled |
| N/A | `updated_status` | New field to identify cancellation type |
| N/A | `Datetime Created` | Original order creation time |

### Phase 3: Enhanced Cancellation Analytics

#### Benefits of Migration
1. **Better granularity**: Track partial vs full cancellations through status values
2. **Timeline visibility**: See order progression before cancellation
3. **Multiple status tracking**: Handle refunds, returns, exchanges in addition to cancellations
4. **Consolidated data source**: Reduce dependency on multiple webhook endpoints

#### New Capabilities
- Distinguish between different cancellation types (customer-initiated, pharmacy-initiated, etc.)
- Track time-to-cancellation metrics
- Analyze cancellation patterns by status progression
- Better refund vs cancellation distinction

## Implementation Steps

### Step 1: Backup Current System
1. Export current `order.cancelled` data
2. Document existing metric calculations
3. Create test environment copies of dashboards

### Step 2: Update Dashboard Code
1. **General Dashboard**:
   - Update `loadAllData()` function (line 139)
   - Modify `getTimeRangeData()` filtering logic (line 367)
   - Test cancellation exclusion logic

2. **KPI Dashboard**:
   - Update data loading in main function (lines 78, 814, 2164)
   - Modify `calculateCancelledOrderRefundRate()` function
   - Update required sheets validation (line 2133)

### Step 3: Deploy and Test
1. Deploy updated dashboard code
2. Verify cancelled order metrics match previous calculations
3. Test edge cases and data quality
4. Monitor for 1-2 weeks to ensure stability

### Step 4: Deprecate order.cancelled Webhook
1. Update webhook documentation
2. Disable `order.cancelled` webhook processing
3. Archive `order.cancelled` sheet tab
4. Update system documentation

## Data Quality Considerations

### Validation Checklist
- [ ] Ensure all historically cancelled orders appear in `order.updated` with appropriate status
- [ ] Verify timestamps align between old and new systems
- [ ] Confirm order ID consistency across data sources
- [ ] Test edge cases (orders with multiple status changes)
- [ ] Validate metric calculations produce same results

### Potential Issues
1. **Historical data gaps**: Some old cancellations might not be in `order.updated`
2. **Status standardization**: Different cancellation reasons might use different status values
3. **Timing differences**: `Datetime Updated` vs `deleted_datetime` might have slight variations
4. **Multiple status entries**: Orders might have multiple entries in `order.updated`

## Testing Plan

### Unit Tests
1. Test cancelled order identification logic
2. Verify metric calculation accuracy
3. Validate data filtering functions

### Integration Tests
1. Compare dashboard outputs before/after migration
2. Test with real production data
3. Verify performance impact

### User Acceptance Tests
1. Dashboard functionality unchanged from user perspective
2. Metric values consistent with historical trends
3. New capabilities working as expected

## Rollback Plan

### If Migration Fails
1. Revert dashboard code to use `order.cancelled`
2. Re-enable `order.cancelled` webhook processing
3. Document issues for future migration attempt
4. Investigate data quality problems

### Success Criteria
- [ ] All dashboards function without errors
- [ ] Cancelled order metrics match previous calculations (±2% tolerance)
- [ ] Performance is equal or better than current system
- [ ] No data quality issues reported
- [ ] Stakeholder approval on functionality

## Related Documentation Updates

### Files to Update After Migration
1. `/DashboardVisualization/InitialKPI/README.md` - Remove order.cancelled references
2. `/DashboardVisualization/GeneralDashboard/README.md` - Update data source documentation
3. `/CLASP_STANDARDIZED_SETUP_GUIDE.md` - Remove order.cancelled webhook
4. System architecture diagrams
5. Data flow documentation

### New Documentation Needed
1. Order status lifecycle documentation
2. `order.updated` data structure guide
3. Status value standardization guide
4. Migration completion report

---

**Created:** October 2025
**Priority:** Medium
**Estimated Effort:** 2-3 days development + 1 week testing
**Dependencies:** Stable `order.updated` webhook system
**Risk Level:** Low (reversible migration with clear rollback plan)