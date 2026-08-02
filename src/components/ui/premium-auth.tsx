'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { cn } from "@/lib/utils";
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff,  
  Shield,
  AlertTriangle,
  KeyRound,
  Phone,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// Types
type AuthMode = 'login' | 'signup' | 'reset';
type RegistrationStep = 'details' | 'verification' | 'complete';

interface AuthFormProps {
  onSuccess?: (userData: { email: string; name?: string }) => void;
  onClose?: () => void;
  initialMode?: AuthMode;
  className?: string;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  agreeToTerms: boolean;
  rememberMe: boolean;
  verificationCode: string;
}

type FormErrors = Partial<Record<keyof FormData | 'general', string>>;

interface PasswordStrength {
  score: number;
  feedback: string[];
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

const calculatePasswordStrength = (password: string): PasswordStrength => {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
  };

  const score = Object.values(requirements).filter(Boolean).length;
  const feedback: string[] = [];

  if (!requirements.length) feedback.push('At least 8 characters');
  if (!requirements.uppercase) feedback.push('One uppercase letter');
  if (!requirements.lowercase) feedback.push('One lowercase letter');
  if (!requirements.number) feedback.push('One number');
  if (!requirements.special) feedback.push('One special character');

  return { score, feedback, requirements };
};

const PasswordStrengthIndicator: React.FC<{ password: string }> = ({ password }) => {
  const strength = calculatePasswordStrength(password);
  
  const getStrengthColor = (score: number) => {
    if (score <= 1) return 'text-destructive';
    if (score <= 2) return 'text-orange-500';
    if (score <= 3) return 'text-yellow-500';
    if (score <= 4) return 'text-blue-500';
    return 'text-primary';
  };

  const getStrengthText = (score: number) => {
    if (score <= 1) return 'Very Weak';
    if (score <= 2) return 'Weak';
    if (score <= 3) return 'Fair';
    if (score <= 4) return 'Good';
    return 'Strong';
  };

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2 animate-in fade-in-50 slide-in-from-bottom-1">
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
          <div
            className={`h-full ${getStrengthColor(strength.score)} bg-current rounded-full`}
            style={{ width: `${(strength.score / 5) * 100}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground min-w-[60px]">
          {getStrengthText(strength.score)}
        </span>
      </div>
      {strength.feedback.length > 0 && (
        <div className="grid grid-cols-2 gap-1">
          {strength.feedback.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-1 text-xs text-amber-500 dark:text-amber-400"
            >
              <AlertTriangle className="h-3 w-3" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export function PremiumAuthForm({
  onSuccess,
  onClose,
  initialMode = 'login',
  className,
}: AuthFormProps) {
  const { signInWithEmail, signUpWithEmail } = useAuth();
  
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [registrationStep, setRegistrationStep] = useState<RegistrationStep>('details');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    agreeToTerms: false,
    rememberMe: false,
    verificationCode: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [fieldTouched, setFieldTouched] = useState<Record<string, boolean>>({});

  React.useEffect(() => {
    const savedEmail = localStorage.getItem('userEmail');
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    if (savedEmail && authMode === 'login') {
      setFormData(prev => ({ ...prev, email: savedEmail, rememberMe }));
    }
  }, [authMode]);

  const validateField = useCallback((field: keyof FormData, value: string | boolean) => {
    let error = '';
    
    switch (field) {
      case 'name':
        if (typeof value === 'string' && authMode === 'signup' && !value.trim()) {
          error = 'Name is required';
        }
        break;
      case 'email':
        if (!value || (typeof value === 'string' && !value.trim())) {
          error = 'Email is required';
        } else if (typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Please enter a valid email address';
        }
        break;
      case 'password':
        if (!value) {
          error = 'Password is required';
        } else if (typeof value === 'string') {
          if (value.length < 8) {
            error = 'Password must be at least 8 characters';
          } else if (authMode === 'signup') {
            const strength = calculatePasswordStrength(value);
            if (strength.score < 3) {
              error = 'Password is too weak';
            }
          }
        }
        break;
      case 'confirmPassword':
        if (authMode === 'signup' && value !== formData.password) {
          error = 'Passwords do not match';
        }
        break;
      case 'agreeToTerms':
        if (authMode === 'signup' && !value) {
          error = 'You must agree to the terms and conditions';
        }
        break;
    }
    return error;
  }, [formData.password, authMode, registrationStep]);

  const handleInputChange = useCallback((field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (fieldTouched[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error || undefined }));
    }
  }, [fieldTouched, validateField]);

  const handleFieldBlur = useCallback((field: keyof FormData) => {
    setFieldTouched(prev => ({ ...prev, [field]: true }));
    const value = formData[field];
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error || undefined }));
  }, [formData, validateField]);

  const validateForm = useCallback(() => {
    const newErrors: FormErrors = {};
    const fieldsToValidate: (keyof FormData)[] = ['email', 'password'];
    
    if (authMode === 'signup') {
      fieldsToValidate.push('name', 'confirmPassword', 'agreeToTerms');
    }

    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [authMode, registrationStep, formData, validateField]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});
    setSuccessMessage('');
    
    try {
      if (authMode === 'login') {
        const { error } = await signInWithEmail(formData.email, formData.password);
        if (error) {
          setErrors({ general: error });
          setIsLoading(false);
          return;
        }

        if (formData.rememberMe) {
          localStorage.setItem('userEmail', formData.email);
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('userEmail');
          localStorage.removeItem('rememberMe');
        }
        
        setSuccessMessage('Login successful');
        onSuccess?.({ email: formData.email });
        
      } else if (authMode === 'signup') {
        if (registrationStep === 'details') {
          // Because we don't have email verification turned on in Supabase, we skip the verify step
          const { error } = await signUpWithEmail(formData.email, formData.password, formData.name);
          if (error) {
            setErrors({ general: error });
            setIsLoading(false);
            return;
          }
          
          setRegistrationStep('complete');
          setSuccessMessage('Account created successfully!');
        }
        
      } else if (authMode === 'reset') {
        setSuccessMessage('Password reset email sent (simulation)!');
        setTimeout(() => setAuthMode('login'), 2000);
      }
    } catch (error: any) {
      setErrors({ 
        general: error.message || 'Authentication failed. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderAuthContent = () => {
    if (authMode === 'reset') {
      return (
        <div className="space-y-4 animate-in fade-in-50 slide-in-from-right-5">
          <div className="text-center mb-6">
            <KeyRound className="h-12 w-12 text-primary mx-auto mb-3" />
            <h3 className="text-xl font-semibold mb-2">Password Recovery</h3>
            <p className="text-muted-foreground text-sm">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>
          <div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                onBlur={() => handleFieldBlur('email')}
                className={cn(
                  "w-full pl-10 pr-4 py-3 bg-muted/50 border rounded-xl placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all",
                  errors.email ? "border-destructive" : "border-input"
                )}
              />
              {errors.email && (
                <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.email}
                </p>
              )}
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading || !formData.email}
            className={cn(
              "w-full relative bg-primary text-primary-foreground font-medium py-3 px-6 rounded-xl transition-all",
              "hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/20",
              "disabled:opacity-50"
            )}
          >
            <span className="flex items-center justify-center gap-2">
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <KeyRound className="h-5 w-5" />
                  Send Reset Link
                </>
              )}
            </span>
          </button>
          <div className="text-center">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className="text-primary hover:text-primary/80 text-sm transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      );
    }

    if (authMode === 'signup' && registrationStep === 'complete') {
      return (
        <div className="text-center space-y-6 animate-in fade-in-50 slide-in-from-right-5">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-2">Welcome Aboard!</h3>
            <p className="text-muted-foreground mb-4">
              Your account has been created successfully. Wait for an admin to grant you access, or return to login!
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setRegistrationStep('details');
              setAuthMode('login');
              setSuccessMessage('');
            }}
            className={cn(
              "w-full bg-primary text-primary-foreground font-medium py-3 px-6 rounded-xl",
              "hover:opacity-90"
            )}
          >
            Go to Login
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4 animate-in fade-in-50 slide-in-from-right-5">
        {authMode === 'signup' && (
          <div>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                onBlur={() => handleFieldBlur('name')}
                className={cn(
                  "w-full pl-10 pr-4 py-3 bg-muted/50 border rounded-xl placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all",
                  errors.name ? "border-destructive" : "border-input"
                )}
              />
              {errors.name && (
                <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.name}
                </p>
              )}
            </div>
          </div>
        )}

        <div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              onBlur={() => handleFieldBlur('email')}
              className={cn(
                "w-full pl-10 pr-4 py-3 bg-muted/50 border rounded-xl placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all",
                errors.email ? "border-destructive" : "border-input"
              )}
            />
            {errors.email && (
              <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {errors.email}
              </p>
            )}
          </div>
        </div>

        <div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              onBlur={() => handleFieldBlur('password')}
              className={cn(
                "w-full pl-10 pr-12 py-3 bg-muted/50 border rounded-xl placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all",
                errors.password ? "border-destructive" : "border-input"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
            {errors.password && (
              <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {errors.password}
              </p>
            )}
          </div>
          {authMode === 'signup' && (
            <PasswordStrengthIndicator password={formData.password} />
          )}
        </div>

        {authMode === 'signup' && (
          <div>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                onBlur={() => handleFieldBlur('confirmPassword')}
                className={cn(
                  "w-full pl-10 pr-12 py-3 bg-muted/50 border rounded-xl placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all",
                  errors.confirmPassword ? "border-destructive" : "border-input"
                )}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
              {errors.confirmPassword && (
                <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          {authMode === 'login' ? (
            <>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                  className="w-4 h-4 rounded border-input bg-muted text-primary focus:ring-primary focus:ring-offset-0"
                />
                <span className="text-sm text-muted-foreground">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => setAuthMode('reset')}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Forgot password?
              </button>
            </>
          ) : (
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-input bg-muted text-primary focus:ring-primary focus:ring-offset-0"
              />
              <span className="text-sm text-muted-foreground">
                I agree to terms
              </span>
            </label>
          )}
        </div>

        {errors.agreeToTerms && (
          <p className="text-destructive text-xs flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {errors.agreeToTerms}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "w-full relative bg-primary text-primary-foreground font-medium py-3 px-6 rounded-xl transition-all",
            "hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/20",
            "disabled:opacity-50"
          )}
        >
          <span className="flex items-center justify-center gap-2">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              authMode === 'login' ? 'Sign In' : 'Create Account'
            )}
          </span>
        </button>
      </div>
    );
  };

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      {successMessage && (
        <div className="mb-4 p-3 bg-green-500/20 border border-green-400/30 rounded-xl flex items-center gap-2 animate-in fade-in-0 slide-in-from-top-5">
          <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-green-700 dark:text-green-300 text-sm">{successMessage}</span>
        </div>
      )}

      {errors.general && (
        <div className="mb-4 p-3 bg-destructive/20 border border-destructive/30 rounded-xl flex items-center gap-2 animate-in fade-in-0 slide-in-from-top-5">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span className="text-destructive text-sm">{errors.general}</span>
        </div>
      )}

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">
          {authMode === 'login' ? 'Welcome Back' : 
           authMode === 'reset' ? 'Reset Password' : 'Create Account'}
        </h2>
        <p className="text-muted-foreground">
          {authMode === 'login' ? 'Sign in to your account' : 
           authMode === 'reset' ? 'Recover your account access' :
           'Create a new account'}
        </p>
      </div>

      {authMode !== 'reset' && (
        <div className="flex bg-muted rounded-xl p-1 mb-6">
          <button
            onClick={() => setAuthMode('login')}
            className={cn(
              "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all",
              authMode === 'login'
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
            type="button"
          >
            Login
          </button>
          <button
            onClick={() => {
              setAuthMode('signup');
              setRegistrationStep('details');
            }}
            className={cn(
              "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all",
              authMode === 'signup'
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
            type="button"
          >
            Sign Up
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {renderAuthContent()}
      </form>

      {authMode !== 'reset' && registrationStep === 'details' && (
        <div className="text-center mt-6">
          <p className="text-muted-foreground text-sm">
            {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              {authMode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
