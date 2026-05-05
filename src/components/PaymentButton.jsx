import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { paymentService, enrollmentService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const PaymentButton = ({ courseId, amount, courseTitle, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!user) {
      toast.error('Please login to enroll');
      return;
    }

    setLoading(true);
    toast.info('Initializing payment...');

    try {
      const orderData = {
        studentId: user.userId,
        courseId: courseId,
        amount: amount
      };

      const orderResponse = await paymentService.createOrder(orderData);
      const { razorpayOrderId, razorpayKeyId, amount: orderAmount, paymentId } = orderResponse.data;

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway');
        setLoading(false);
        return;
      }

      const options = {
        key: razorpayKeyId,
        amount: Math.round(orderAmount * 100),
        currency: 'INR',
        name: 'EduLearn LMS',
        description: `Enrollment for ${courseTitle}`,
        order_id: razorpayOrderId,
        handler: async (response) => {
          try {
            const verifyData = {
              paymentId: paymentId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            };

            await paymentService.verify(verifyData);
            toast.success('🎉 Payment successful! You are now enrolled!');
            
            // Direct enrollment fallback
            try {
              await enrollmentService.enroll({ 
                courseId: courseId, 
                paymentId: paymentId 
              });
            } catch (err) {
              console.log('Enrollment may already be processing');
            }
            
            if (onSuccess) onSuccess();
            
            // ✅ FIX: Redirect to My Courses, not Home
            setTimeout(() => {
              window.location.href = '/my-courses';
            }, 1500);
            
          } catch (err) {
            console.error('Verification error:', err);
            toast.error('Payment verification failed');
            setLoading(false);
          }
        },
        prefill: {
          name: user.fullName,
          email: user.email
        },
        theme: { color: '#2563EB' },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast.info('Payment cancelled');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (err) {
      console.error('Payment error:', err);
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  if (amount === 0) return null;

  return (
    <button 
      className="btn btn-primary btn-full btn-lg"
      onClick={handlePayment}
      disabled={loading}
    >
      {loading ? 'Opening Payment...' : `Pay ₹${amount} & Enroll`}
    </button>
  );
};

export default PaymentButton;