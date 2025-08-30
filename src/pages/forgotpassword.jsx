/* eslint-disable react/no-unescaped-entities */
import { apihost } from '@/components/contract/address';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowLeft
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: Reset Password
  const [formData, setFormData] = useState({
    email: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();

  // Password strength checker
  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'newPassword') {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const validateEmail = async () => {
    if (!formData.email.trim()) {
      setMessage("Email is required.");
      setMessageType("error");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setMessage("Please enter a valid email address.");
      setMessageType("error");
      return false;
    }

    // Check if email exists in the system
    try {
      const res = await fetch(`${apihost}/register/user/${formData.email}`);
      const data = await res.json();
      
      if (!data.user) {
        setMessage("No account found with this email address.");
        setMessageType("error");
        return false;
      }
      
      return true;
    } catch (error) {
      setMessage("Error verifying email. Please try again.");
      console.error("Email verification error:", error);
      setMessageType("error");
      return false;
    }
  };

  const validatePasswordReset = () => {
    if (!formData.newPassword) {
      setMessage("New password is required.");
      setMessageType("error");
      return false;
    }
    if (formData.newPassword.length < 8) {
      setMessage("Password must be at least 8 characters long.");
      setMessageType("error");
      return false;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage("Passwords do not match.");
      setMessageType("error");
      return false;
    }
    return true;
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const isValid = await validateEmail();
    if (isValid) {
      setStep(2);
      setMessage("Email verified! Now create your new password.");
      setMessageType("success");
    }
    
    setLoading(false);
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!validatePasswordReset()) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${apihost}/register/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          newPassword: formData.newPassword
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessage("Password reset successful! You can now login with your new password.");
        setMessageType("success");
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setMessage(data.message || "Password reset failed.");
        setMessageType("error");
      }
    } catch (err) {
      console.error("Password reset error:", err);
      setMessage("Password reset failed. Please try again.");
      setMessageType("error");
    }
    setLoading(false);
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 0:
      case 1:
        return { text: "Very Weak", color: "text-red-500" };
      case 2:
        return { text: "Weak", color: "text-orange-500" };
      case 3:
        return { text: "Fair", color: "text-yellow-500" };
      case 4:
        return { text: "Good", color: "text-blue-500" };
      case 5:
        return { text: "Strong", color: "text-green-500" };
      default:
        return { text: "", color: "" };
    }
  };

  const passwordStrengthInfo = getPasswordStrengthText();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h1>
          <p className="text-gray-600">
            {step === 1 ? "Enter your email to reset your password" : "Create a new secure password"}
          </p>
        </div>

        <Card className="border-0 shadow-xl bg-white">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-xl font-bold text-center">
              {step === 1 ? "Verify Email" : "Create New Password"}
            </CardTitle>
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back to email verification</span>
              </button>
            )}
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Step 1: Email Verification */}
            {step === 1 && (
              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base font-semibold flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>Email Address</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter your registered email"
                    className="h-12"
                    required
                  />
                  <p className="text-sm text-gray-600">
                    We'll verify if this email is registered in our system.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Verify Email"}
                </Button>
              </form>
            )}

            {/* Step 2: Password Reset */}
            {step === 2 && (
              <form onSubmit={handlePasswordReset} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email-display" className="text-base font-semibold flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>Email</span>
                  </Label>
                  <Input
                    id="email-display"
                    type="email"
                    value={formData.email}
                    className="h-12 bg-gray-50"
                    disabled
                    readOnly
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-base font-semibold flex items-center space-x-2">
                    <Lock className="w-4 h-4" />
                    <span>New Password</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={formData.newPassword}
                      onChange={(e) => handleInputChange('newPassword', e.target.value)}
                      placeholder="Create a strong password"
                      className="h-12 pr-12"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {formData.newPassword && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              passwordStrength <= 1 ? 'bg-red-500' :
                              passwordStrength <= 2 ? 'bg-orange-500' :
                              passwordStrength <= 3 ? 'bg-yellow-500' :
                              passwordStrength <= 4 ? 'bg-blue-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${(passwordStrength / 5) * 100}%` }}
                          />
                        </div>
                        <span className={`text-sm font-medium ${passwordStrengthInfo.color}`}>
                          {passwordStrengthInfo.text}
                        </span>
                      </div>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li className={formData.newPassword.length >= 8 ? 'text-green-600' : 'text-gray-600'}>
                          ✓ At least 8 characters
                        </li>
                        <li className={/[A-Z]/.test(formData.newPassword) ? 'text-green-600' : 'text-gray-600'}>
                          ✓ One uppercase letter
                        </li>
                        <li className={/[a-z]/.test(formData.newPassword) ? 'text-green-600' : 'text-gray-600'}>
                          ✓ One lowercase letter
                        </li>
                        <li className={/[0-9]/.test(formData.newPassword) ? 'text-green-600' : 'text-gray-600'}>
                          ✓ One number
                        </li>
                        <li className={/[^A-Za-z0-9]/.test(formData.newPassword) ? 'text-green-600' : 'text-gray-600'}>
                          ✓ One special character
                        </li>
                      </ul>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-base font-semibold flex items-center space-x-2">
                    <Lock className="w-4 h-4" />
                    <span>Confirm New Password</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="Re-enter your new password"
                      className="h-12 pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {formData.confirmPassword && (
                    <div className="flex items-center space-x-2">
                      {formData.newPassword === formData.confirmPassword ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`text-sm ${
                        formData.newPassword === formData.confirmPassword ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formData.newPassword === formData.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                      </span>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={loading}
                >
                  {loading ? "Resetting Password..." : "Reset Password"}
                </Button>
              </form>
            )}

            {/* Message */}
            {message && (
              <Alert className={messageType === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                {messageType === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={messageType === 'success' ? 'text-green-800' : 'text-red-800'}>
                  {message}
                </AlertDescription>
              </Alert>
            )}

            {/* Back to Login Link */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-gray-600">
                Remember your password?{" "}
                <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                  Back to Login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;