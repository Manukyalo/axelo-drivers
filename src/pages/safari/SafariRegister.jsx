import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { User, Mail, Phone, Lock, ArrowRight, ShieldCheck, Map, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const SafariRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [isVerifying, setIsVerifying] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }
    if (formData.password !== formData.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    setIsVerifying(true);
    const toastId = toast.loading("Registering expedition credentials...");
    try {
      const cleanEmail = formData.email.trim().toLowerCase();

      // 1. Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, formData.password);
      const user = userCredential.user;

      // 2. Prepare registration payload
      const registrationPayload = {
        uid: user.uid,
        id: user.uid,
        driverDocId: user.uid,
        name: formData.fullName.trim(),
        email: cleanEmail,
        personalEmail: cleanEmail,
        phone: formData.phone.trim(),
        role: 'safari_driver',
        type: 'Safari Guide',
        status: 'Pending',
        approved: false,
        registeredAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        biometricsConfigured: false,
        faceImageUrl: '',
        faceDescriptor: null,
        loginAttempts: 0,
        lockedUntil: null,
        fcmToken: null
      };

      // 3. Write directly to driverAuth queue (source of truth for admin approval)
      await setDoc(doc(db, 'driverAuth', user.uid), registrationPayload);

      // 4. Write primary driver profile
      await setDoc(doc(db, 'drivers', user.uid), registrationPayload);

      // 5. Alert Admin Dashboard via real-time notifications
      await addDoc(collection(db, 'notifications'), {
        title: 'New Safari Driver Registration',
        message: `${formData.fullName.trim()} (${cleanEmail}) submitted credentials for Safari Expeditions and awaits approval.`,
        type: 'WARNING',
        targetRole: 'admin',
        userId: user.uid,
        date: serverTimestamp(),
        read: false
      });

      setFormData(prev => ({ ...prev, uid: user.uid }));
      toast.success("Expedition profile registered! Pending admin approval.", { id: toastId });
      
      // Advance to Face ID Setup
      setStep(2);
    } catch (error) {
      console.error("Registration error:", error);
      let msg = error.message;
      if (error.code === 'auth/email-already-in-use') {
        msg = "An account with this email already exists. Please log in instead.";
      }
      toast.error(msg, { id: toastId });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen pt-12 pb-24 px-6 bg-primary-dark">
      <div className="max-w-md mx-auto">
        <div className="mb-8 text-center">
          <div className="w-12 h-12 bg-accent-green/20 rounded-xl flex items-center justify-center text-accent-green mx-auto mb-4">
            <Map size={24} />
          </div>
          <h2 className="text-2xl font-heading font-black text-white mb-2 uppercase tracking-tight">
            Safari <span className="text-accent-green">Expedition</span> Portal
          </h2>
          <p className="text-[10px] text-text-muted uppercase tracking-[0.3em] font-bold">Driver Registration</p>
        </div>

        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-green" size={20} />
              <input
                type="text"
                name="fullName"
                placeholder="Full Name as per ID"
                required
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full bg-surface border border-border rounded-xl py-4 pl-12 pr-4 text-white focus:border-accent-green outline-none"
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-green" size={20} />
              <input
                type="email"
                name="email"
                placeholder="Personal Email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full bg-surface border border-border rounded-xl py-4 pl-12 pr-4 text-white focus:border-accent-green outline-none"
              />
            </div>

            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-green" size={20} />
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                required
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full bg-surface border border-border rounded-xl py-4 pl-12 pr-4 text-white focus:border-accent-green outline-none"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-green" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Access Password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="w-full bg-surface border border-border rounded-xl py-4 pl-12 pr-12 text-white focus:border-accent-green outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-accent-green transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-green" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Access Password"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full bg-surface border border-border rounded-xl py-4 pl-12 pr-12 text-white focus:border-accent-green outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-accent-green transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full bg-accent-green text-white font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all mt-6"
            >
              {isVerifying ? 'Verifying...' : 'Continue to Face ID'}
              <ArrowRight size={20} />
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="animate-in slide-in-from-right-4 duration-500">
             <div className="bg-card border border-accent-green/20 p-6 rounded-3xl mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-accent-green/20 rounded-lg flex items-center justify-center text-accent-green">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="font-bold text-lg text-white">Biometric Scan Required</h3>
              </div>
              <p className="text-text-muted text-sm leading-relaxed">
                Safari drivers require high-security biometric ID for park access logging and live tracking verification.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/safari/face-scan', { state: { formData } })}
                className="w-full bg-accent-green text-white font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all text-xs uppercase tracking-widest"
              >
                Start Face ID Scan
                <ArrowRight size={20} />
              </button>

              <button
                type="button"
                onClick={() => navigate('/safari/pending')}
                className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-text-muted hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
              >
                Complete Face ID Later & View Status
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SafariRegister;
