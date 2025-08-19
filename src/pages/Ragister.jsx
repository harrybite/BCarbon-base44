/* eslint-disable react/no-unescaped-entities */
import { apihost } from '@/components/contract/address';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Building, 
  Mail, 
  Lock, 
  Globe, 
  UserCheck, 
  Eye, 
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Shield,
  CheckSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    roles: [],
    name: "",
    email: "",
    organizationName: "",
    website: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const roleOptions = [
    { 
      value: "user", 
      label: "Carbon Credit Buyer", 
      description: "Buy, hold, and retire carbon credits for offsetting",
      icon: User,
      color: "green"
    },
    { 
      value: "issuer", 
      label: "Project Developer", 
      description: "Create and manage carbon credit projects",
      icon: Building,
      color: "blue"
    },
    { 
      value: "validation", 
      label: "Validation Body", 
      description: "Validate carbon credit project methodologies and documentation",
      icon: CheckSquare,
      color: "purple"
    },
    { 
      value: "verification", 
      label: "Verification Body", 
      description: "Verify carbon credit project implementation and monitoring",
      icon: Shield,
      color: "orange"
    },
  ];

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
    
    if (field === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const handleRoleChange = (roleValue, checked) => {
    setFormData(prev => ({
      ...prev,
      roles: checked 
        ? [...prev.roles, roleValue]
        : prev.roles.filter(role => role !== roleValue)
    }));
  };

  const validateForm = () => {
    if (formData.roles.length === 0) {
      setMessage("Please select at least one role.");
      setMessageType("error");
      return false;
    }
    if (!formData.name.trim()) {
      setMessage("Representative name is required.");
      setMessageType("error");
      return false;
    }
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
    if (!formData.organizationName.trim()) {
      setMessage("Organization name is required.");
      setMessageType("error");
      return false;
    }
    if (!formData.password) {
      setMessage("Password is required.");
      setMessageType("error");
      return false;
    }
    if (formData.password.length < 8) {
      setMessage("Password must be at least 8 characters long.");
      setMessageType("error");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match.");
      setMessageType("error");
      return false;
    }
    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      setMessage("Please enter a valid website URL (including http:// or https://).");
      setMessageType("error");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const body = {
        roles: formData.roles,
        name: formData.name,
        email: formData.email,
        organizationName: formData.organizationName,
        website: formData.website || undefined,
        password: formData.password
      };

      const res = await fetch(`${apihost}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessage("Registration successful! Please complete your KYC to activate your account.");
        setMessageType("success");
        // Reset form
        setFormData({
          roles: [],
          name: "",
          email: "",
          organizationName: "",
          website: "",
          password: "",
          confirmPassword: ""
        });
      } else {
        setMessage(data.message || "Registration failed.");
        setMessageType("error");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setMessage("Registration failed. Please try again.");
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full mb-4">
            <UserCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h1>
          <p className="text-gray-600">Join the BiCO₂ platform and start your carbon credit journey</p>
        </div>

        <Card className="border-0 shadow-xl bg-white">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center">Registration Form</CardTitle>
            <p className="text-center text-gray-600">Please fill in all required information</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Role Selection */}
              <div className="space-y-4">
                <Label className="text-base font-semibold flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Select Role(s) *</span>
                </Label>
                <p className="text-sm text-gray-600">You can select multiple roles that apply to your organization</p>
                <div className="grid grid-cols-1 gap-3">
                  {roleOptions.map((role) => {
                    const IconComponent = role.icon;
                    return (
                      <div key={role.value} className={`flex items-start space-x-3 p-4 border-2 rounded-lg hover:bg-gray-50 transition-all duration-200 ${
                        formData.roles.includes(role.value) 
                          ? `border-${role.color}-300 bg-${role.color}-50` 
                          : 'border-gray-200'
                      }`}>
                        <Checkbox
                          id={role.value}
                          checked={formData.roles.includes(role.value)}
                          onCheckedChange={(checked) => handleRoleChange(role.value, checked)}
                          className="mt-1"
                        />
                        <IconComponent className={`w-5 h-5 mt-0.5 ${
                          formData.roles.includes(role.value) 
                            ? `text-${role.color}-600` 
                            : 'text-gray-500'
                        }`} />
                        <div className="flex-1">
                          <label htmlFor={role.value} className="font-medium text-gray-900 cursor-pointer">
                            {role.label}
                          </label>
                          <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Role Selection Summary */}
                {formData.roles.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">Selected Roles:</p>
                        <p className="text-sm text-blue-700">
                          {formData.roles.map(role => 
                            roleOptions.find(r => r.value === role)?.label
                          ).join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base font-semibold flex items-center space-x-2">
                  <UserCheck className="w-4 h-4" />
                  <span>Name of Representative *</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter representative's full name"
                  className="h-12"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-base font-semibold flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Official Email ID *</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter official email address"
                  className="h-12"
                  required
                />
              </div>

              {/* Organization Name */}
              <div className="space-y-2">
                <Label htmlFor="organizationName" className="text-base font-semibold flex items-center space-x-2">
                  <Building className="w-4 h-4" />
                  <span>Organization Name *</span>
                </Label>
                <Input
                  id="organizationName"
                  type="text"
                  value={formData.organizationName}
                  onChange={(e) => handleInputChange('organizationName', e.target.value)}
                  placeholder="Enter organization name"
                  className="h-12"
                  required
                />
              </div>

              {/* Website */}
              <div className="space-y-2">
                <Label htmlFor="website" className="text-base font-semibold flex items-center space-x-2">
                  <Globe className="w-4 h-4" />
                  <span>Organization Website</span>
                  <span className="text-sm text-gray-500 font-normal">(optional)</span>
                </Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://your-organization.com"
                  className="h-12"
                />
              </div>

              {/* KYC Information Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-amber-800">KYC Completion Required</h4>
                    <p className="text-sm text-amber-700 mt-1">
                      After registration, you'll need to complete KYC verification through our Web3Auth integration 
                      to obtain your wallet address and activate your account.
                    </p>
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-base font-semibold flex items-center space-x-2">
                  <Lock className="w-4 h-4" />
                  <span>Password *</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
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
                {formData.password && (
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
                      <li className={formData.password.length >= 8 ? 'text-green-600' : 'text-gray-600'}>
                        ✓ At least 8 characters
                      </li>
                      <li className={/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-600'}>
                        ✓ One uppercase letter
                      </li>
                      <li className={/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-600'}>
                        ✓ One lowercase letter
                      </li>
                      <li className={/[0-9]/.test(formData.password) ? 'text-green-600' : 'text-gray-600'}>
                        ✓ One number
                      </li>
                      <li className={/[^A-Za-z0-9]/.test(formData.password) ? 'text-green-600' : 'text-gray-600'}>
                        ✓ One special character
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-base font-semibold flex items-center space-x-2">
                  <Lock className="w-4 h-4" />
                  <span>Confirm Password *</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Re-enter your password"
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
                    {formData.password === formData.confirmPassword ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-sm ${
                      formData.password === formData.confirmPassword ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formData.password === formData.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                    </span>
                  </div>
                )}
              </div>

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

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            {/* Login Link */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-gray-600">
                Already have an account?{" "}
                <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;