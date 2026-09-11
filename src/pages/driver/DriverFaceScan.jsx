import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FaceScanner from '../../components/face/FaceScanner';
import { auth, db } from '../../firebase';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, writeBatch, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

const DriverFaceScan = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { formData } = location.state || {};

  if (!formData) {
    navigate('/driver/register');
    return null;
  }

  const handleCapture = async ({ descriptor, imageBlob }) => {
    const toastId = toast.loading("Enrolling Face ID Biometrics...");
    
    try {
      const user = auth.currentUser;
      const uid = user?.uid || formData?.uid;
      
      if (!uid) {
        throw new Error("User session expired. Please sign in or re-register credentials.");
      }

      const biometricUpdate = {
        faceDescriptor: descriptor,
        faceImageUrl: imageBlob,
        biometricsConfigured: true,
        biometricsEnrolledAt: serverTimestamp()
      };

      // 1. Update driverAuth document
      await setDoc(doc(db, 'driverAuth', uid), biometricUpdate, { merge: true });

      // 2. Update drivers collection
      await setDoc(doc(db, 'drivers', uid), biometricUpdate, { merge: true });

      // 3. If porter, also update porters collection
      if (formData?.role === 'porter') {
        await setDoc(doc(db, 'porters', uid), {
          faceImageUrl: imageBlob
        }, { merge: true });
      }

      // 4. Update notification that biometrics are complete
      await addDoc(collection(db, 'notifications'), {
        title: `Biometrics Enrolled: ${formData?.fullName || 'Driver'}`,
        message: `${formData?.fullName || 'Driver'} has completed Face ID biometric capture and is ready for operational approval.`,
        type: 'INFO',
        targetRole: 'admin',
        userId: uid,
        date: serverTimestamp(),
        read: false
      });

      toast.success("Face ID enrolled successfully!", { id: toastId });
      navigate('/driver/pending');
    } catch (error) {
      console.error("Biometrics enrollment error:", error);
      toast.error(error.message || "Failed to save Face ID", { id: toastId });
    }
  };

  return (
    <div className="min-h-screen bg-primary-dark p-6 flex flex-col">
      <div className="mb-8 text-center mt-8">
        <h2 className="text-xl font-heading font-black text-white uppercase tracking-widest">
          Face <span className="text-accent-gold">Verification</span>
        </h2>
        <p className="text-text-muted text-xs mt-2 uppercase tracking-widest font-black">STEP 3 OF 3 — BIOMETRIC ID SETUP</p>
      </div>

      <FaceScanner onCapture={handleCapture} driverEmail={formData.email} />

      <div className="mt-8 text-center text-text-muted text-xs px-8">
        By continuing, you agree to biometric authentication for secure logging. Your data is encrypted and stored securely.
      </div>
    </div>
  );
};

export default DriverFaceScan;
