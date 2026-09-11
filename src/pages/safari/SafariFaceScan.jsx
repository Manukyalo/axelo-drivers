import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FaceScanner from '../../components/face/FaceScanner';
import { auth, db } from '../../firebase';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import {
  doc, getDoc, setDoc, deleteDoc, writeBatch,
  collection, query, where, getDocs, addDoc, serverTimestamp
} from 'firebase/firestore';
import toast from 'react-hot-toast';

const SafariFaceScan = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { formData } = location.state || {};

  if (!formData) {
    navigate('/safari/register');
    return null;
  }

  const handleCapture = async ({ descriptor, imageBlob }) => {
    const toastId = toast.loading("Enrolling Safari Expedition Biometrics...");

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

      // 1. Update driverAuth
      await setDoc(doc(db, 'driverAuth', uid), biometricUpdate, { merge: true });

      // 2. Update drivers
      await setDoc(doc(db, 'drivers', uid), biometricUpdate, { merge: true });

      // 3. Notification to admin
      await addDoc(collection(db, 'notifications'), {
        title: `Biometrics Enrolled: ${formData?.fullName || 'Safari Guide'}`,
        message: `${formData?.fullName || 'Safari Guide'} completed Face ID biometric capture and awaits expedition dispatch approval.`,
        type: 'INFO',
        targetRole: 'admin',
        userId: uid,
        date: serverTimestamp(),
        read: false
      });

      toast.success("Expedition Face ID enrolled!", { id: toastId });
      navigate('/safari/pending');
    } catch (error) {
      console.error("Biometrics enrollment error:", error);
      toast.error(error.message || "Failed to save Face ID", { id: toastId });
    }
  };

  return (
    <div className="min-h-screen bg-primary-dark p-6 flex flex-col">
      <div className="mb-8 text-center mt-8">
        <h2 className="text-xl font-heading font-black text-white uppercase tracking-widest">
          Expedition <span className="text-accent-green">Identity</span>
        </h2>
        <p className="text-text-muted text-xs mt-2 uppercase tracking-widest font-black">STEP 2 OF 3 — BIOMETRIC ID SETUP</p>
      </div>

      <FaceScanner onCapture={handleCapture} driverEmail={formData.email} />

      <div className="mt-8 text-center text-text-muted text-xs px-8">
        Authorized personnel only. Biometric data is used strictly for identity verification and park access logging.
      </div>
    </div>
  );
};

export default SafariFaceScan;
