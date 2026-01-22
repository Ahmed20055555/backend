import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: false // Will be generated in pre-save hook
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'المستخدم مطلوب']
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: String,
    price: Number,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    image: String,
    variant: {
      name: String,
      value: String
    }
  }],
  shippingAddress: {
    name: String,
    phone: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'مصر'
    }
  },
  billingAddress: {
    name: String,
    phone: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  pricing: {
    subtotal: {
      type: Number,
      required: true
    },
    shipping: {
      type: Number,
      default: 0
    },
    tax: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true
    }
  },
  payment: {
    method: {
      type: String,
      enum: ['cash', 'card', 'bank_transfer', 'stripe'],
      default: 'cash'
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    accountNumber: String,
    paidAt: Date
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  shipping: {
    method: String,
    trackingNumber: String,
    estimatedDelivery: Date,
    shippedAt: Date,
    deliveredAt: Date
  },
  notes: String,
  cancelledAt: Date,
  cancelReason: String,
  isTest: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  // Always generate order number if not set
  if (!this.orderNumber || this.orderNumber.trim() === '') {
    try {
      const Order = this.constructor;
      
      // Get count of all orders (including test orders for unique numbering)
      const count = await Order.countDocuments();
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const prefix = this.isTest ? 'TEST' : 'ORD';
      
      // Generate unique order number
      let orderNumber = `${prefix}-${year}${month}${day}-${String(count + 1).padStart(5, '0')}`;
      
      // Ensure uniqueness (in case of race condition)
      let counter = 1;
      while (await Order.findOne({ orderNumber, _id: { $ne: this._id } })) {
        orderNumber = `${prefix}-${year}${month}${day}-${String(count + 1 + counter).padStart(5, '0')}`;
        counter++;
        // Safety limit to prevent infinite loop
        if (counter > 100) {
          orderNumber = `${prefix}-${year}${month}${day}-${Date.now()}`;
          break;
        }
      }
      
      this.orderNumber = orderNumber;
      console.log('✅ Generated order number:', this.orderNumber);
    } catch (error) {
      console.error('❌ Error generating order number:', error);
      // Fallback order number
      this.orderNumber = `${this.isTest ? 'TEST' : 'ORD'}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    }
  }
  next();
});

// Validate orderNumber exists after save
orderSchema.post('save', function(doc, next) {
  if (!doc.orderNumber || doc.orderNumber.trim() === '') {
    console.error('⚠️ Warning: Order saved without orderNumber:', doc._id);
  }
  next();
});

// Indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.status': 1 });

export default mongoose.model('Order', orderSchema);
