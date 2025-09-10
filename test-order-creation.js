const mongoose = require('mongoose');
const InternalOrder = require('./backend/models/InternalOrder');
require('dotenv').config();

async function testOrderCreation() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/inventory');
    console.log('Connected to MongoDB');
    
    // Test creating an internal order
    const testOrder = new InternalOrder({
      requestedBy: new mongoose.Types.ObjectId(),
      requesterName: 'Test User',
      deliverySite: 'Test Site',
      requestedDeliveryDate: new Date(),
      items: [{
        item: new mongoose.Types.ObjectId(),
        requestedQuantity: 5,
        notes: 'Test item'
      }],
      notes: 'Test order for validation'
    });
    
    console.log('Order before save:', {
      orderNumber: testOrder.orderNumber,
      requesterName: testOrder.requesterName
    });
    
    await testOrder.save();
    
    console.log('Order after save:', {
      orderNumber: testOrder.orderNumber,
      _id: testOrder._id
    });
    
    // Clean up - delete the test order
    await InternalOrder.findByIdAndDelete(testOrder._id);
    console.log('Test order cleaned up');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

testOrderCreation();
