const AuditLog = require('../models/AuditLog');

// Middleware to log user actions
const auditLogger = {
  async logAction(action, entityType, entityId, userId, userEmail, userRole, changes = {}, oldValues = {}, newValues = {}, description = '', req = null) {
    try {
      const auditEntry = new AuditLog({
        action,
        entityType,
        entityId,
        userId,
        userEmail,
        userRole,
        changes,
        oldValues,
        newValues,
        ipAddress: req ? req.ip || req.connection.remoteAddress : null,
        userAgent: req ? req.get('User-Agent') : null,
        description
      });

      await auditEntry.save();
      console.log(`Audit logged: ${action} on ${entityType} by ${userEmail}`);
    } catch (error) {
      console.error('Failed to log audit entry:', error);
      // Don't throw error to avoid breaking the main operation
    }
  },

  // Helper for item changes
  async logItemChange(action, item, user, changes = {}, oldValues = {}, req = null) {
    const description = this.generateItemDescription(action, item, changes);
    await this.logAction(
      action,
      'Item',
      item._id,
      user._id,
      user.email,
      user.role,
      changes,
      oldValues,
      item.toObject ? item.toObject() : item,
      description,
      req
    );
  },

  // Helper for category changes
  async logCategoryChange(action, category, user, changes = {}, oldValues = {}, req = null) {
    const description = this.generateCategoryDescription(action, category, changes);
    await this.logAction(
      action,
      'Category',
      category._id,
      user._id,
      user.email,
      user.role,
      changes,
      oldValues,
      category.toObject ? category.toObject() : category,
      description,
      req
    );
  },

  // Helper for user changes
  async logUserChange(action, targetUser, currentUser, changes = {}, oldValues = {}, req = null) {
    const description = this.generateUserDescription(action, targetUser, changes);
    await this.logAction(
      action,
      'User',
      targetUser._id,
      currentUser._id,
      currentUser.email,
      currentUser.role,
      changes,
      oldValues,
      targetUser.toObject ? targetUser.toObject() : targetUser,
      description,
      req
    );
  },

  // Helper for purchase order changes
  async logPurchaseOrderChange(action, purchaseOrder, user, changes = {}, oldValues = {}, req = null) {
    const description = this.generatePurchaseOrderDescription(action, purchaseOrder, changes);
    await this.logAction(
      action,
      'PurchaseOrder',
      purchaseOrder._id,
      user._id,
      user.email,
      user.role,
      changes,
      oldValues,
      purchaseOrder.toObject ? purchaseOrder.toObject() : purchaseOrder,
      description,
      req
    );
  },

  // Helper for system actions
  async logSystemAction(action, user, description = '', req = null) {
    await this.logAction(
      action,
      'System',
      null,
      user._id,
      user.email,
      user.role,
      {},
      {},
      {},
      description,
      req
    );
  },

  // Description generators
  generateItemDescription(action, item, changes) {
    switch (action) {
      case 'CREATE':
        return `Created item "${item.name}" (SKU: ${item.sku})`;
      case 'UPDATE':
        const changedFields = Object.keys(changes).join(', ');
        return `Updated item "${item.name}" - Changed: ${changedFields}`;
      case 'DELETE':
        return `Deleted item "${item.name}" (SKU: ${item.sku})`;
      default:
        return `${action} on item "${item.name}"`;
    }
  },

  generateCategoryDescription(action, category, changes) {
    switch (action) {
      case 'CREATE':
        return `Created category "${category.name}"`;
      case 'UPDATE':
        const changedFields = Object.keys(changes).join(', ');
        return `Updated category "${category.name}" - Changed: ${changedFields}`;
      case 'DELETE':
        return `Deleted category "${category.name}"`;
      default:
        return `${action} on category "${category.name}"`;
    }
  },

  generateUserDescription(action, user, changes) {
    switch (action) {
      case 'CREATE':
        return `Created user account for "${user.email}" with role ${user.role}`;
      case 'UPDATE':
        const changedFields = Object.keys(changes).join(', ');
        return `Updated user "${user.email}" - Changed: ${changedFields}`;
      case 'DELETE':
        return `Deleted user account "${user.email}"`;
      default:
        return `${action} on user "${user.email}"`;
    }
  },

  generatePurchaseOrderDescription(action, po, changes) {
    switch (action) {
      case 'CREATE':
        return `Created purchase order #${po.orderNumber || po._id}`;
      case 'UPDATE':
        const changedFields = Object.keys(changes).join(', ');
        return `Updated purchase order #${po.orderNumber || po._id} - Changed: ${changedFields}`;
      case 'STATUS_CHANGE':
        return `Changed purchase order #${po.orderNumber || po._id} status to ${po.status}`;
      case 'DELETE':
        return `Deleted purchase order #${po.orderNumber || po._id}`;
      default:
        return `${action} on purchase order #${po.orderNumber || po._id}`;
    }
  }
};

module.exports = auditLogger;
