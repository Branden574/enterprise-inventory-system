// MongoDB Maintenance Script for InventoryTest Database
// Run these commands in MongoDB Compass or MongoDB shell

// ============================================================================
// DAILY MAINTENANCE (Run every day - 2 minutes)
// ============================================================================

// 1. Quick health check
use InventoryTest
db.runCommand({ping: 1})
db.stats(1024*1024)

// 2. Check collection counts
db.items.countDocuments()
db.users.countDocuments()
db.categories.countDocuments()
db.auditlogs.countDocuments()

// ============================================================================
// WEEKLY MAINTENANCE (Run every Monday - 15 minutes)
// ============================================================================

// 1. Check for slow operations
db.currentOp({"secs_running": {"$gt": 1}})

// 2. Analyze collection performance
db.runCommand({collStats: "items"})
db.runCommand({collStats: "auditlogs"})

// 3. Check index usage
db.items.aggregate([{$indexStats:{}}])
db.users.aggregate([{$indexStats:{}}])

// 4. Clean old audit logs (older than 90 days)
var cutoffDate = new Date();
cutoffDate.setDate(cutoffDate.getDate() - 90);
var result = db.auditlogs.deleteMany({timestamp: {$lt: cutoffDate}});
print("Deleted " + result.deletedCount + " old audit log entries");

// ============================================================================
// MONTHLY MAINTENANCE (Run first Monday of each month - 30 minutes)
// ============================================================================

// 1. Ensure all critical indexes exist
db.users.createIndex({ "username": 1 }, { unique: true })
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "role": 1 })

db.items.createIndex({ "name": 1 })
db.items.createIndex({ "category": 1 })
db.items.createIndex({ "barcode": 1 }, { unique: true, sparse: true })
db.items.createIndex({ "createdAt": -1 })
db.items.createIndex({ "alertEnabled": 1, "minimumQuantity": 1 })

db.categories.createIndex({ "name": 1 }, { unique: true })

db.auditlogs.createIndex({ "timestamp": -1 })
db.auditlogs.createIndex({ "userId": 1 })
db.auditlogs.createIndex({ "action": 1 })

db.purchaseorders.createIndex({ "createdAt": -1 })
db.purchaseorders.createIndex({ "status": 1 })
db.purchaseorders.createIndex({ "createdBy": 1 })

db.internalorders.createIndex({ "createdAt": -1 })
db.internalorders.createIndex({ "status": 1 })
db.internalorders.createIndex({ "requestedBy": 1 })

db.completedpos.createIndex({ "completedAt": -1 })
db.completedpos.createIndex({ "originalPOId": 1 })

db.notifications.createIndex({ "userId": 1, "read": 1 })
db.notifications.createIndex({ "createdAt": -1 })

// 2. Data integrity checks
print("=== DATA INTEGRITY CHECKS ===");

// Check for orphaned category references in items
print("Checking for orphaned category references...");
var orphanedItems = 0;
db.items.find({category: {$exists: true, $ne: null}}).forEach(function(item) {
    if (item.category && !db.categories.findOne({_id: item.category})) {
        print("Orphaned category reference in item: " + item._id + " (category: " + item.category + ")");
        orphanedItems++;
    }
});
print("Found " + orphanedItems + " items with orphaned category references");

// Check for duplicate barcodes
print("Checking for duplicate barcodes...");
var duplicateBarcodes = db.items.aggregate([
    {$match: {barcode: {$exists: true, $ne: "", $ne: null}}},
    {$group: {_id: "$barcode", count: {$sum: 1}, items: {$push: "$_id"}}},
    {$match: {count: {$gt: 1}}}
]).toArray();

if (duplicateBarcodes.length > 0) {
    print("Found duplicate barcodes:");
    duplicateBarcodes.forEach(function(dup) {
        print("Barcode: " + dup._id + " appears " + dup.count + " times in items: " + dup.items.join(", "));
    });
} else {
    print("No duplicate barcodes found");
}

// Check for users without proper roles
print("Checking user roles...");
var invalidRoles = db.users.find({role: {$nin: ["user", "staff", "admin", "superadmin"]}}).count();
print("Users with invalid roles: " + invalidRoles);

// 3. Performance optimization
print("=== PERFORMANCE OPTIMIZATION ===");

// Rebuild indexes for optimal performance
print("Rebuilding indexes...");
db.items.reIndex();
db.users.reIndex();
db.auditlogs.reIndex();
print("Index rebuild completed");

// 4. Space reclamation
print("=== SPACE RECLAMATION ===");
print("Compacting collections...");
db.runCommand({compact: "auditlogs"});
db.runCommand({compact: "items"});
print("Compaction completed");

// Final statistics
print("=== FINAL STATISTICS ===");
db.stats(1024*1024);

print("=== MAINTENANCE COMPLETED ===");
print("Run date: " + new Date());
