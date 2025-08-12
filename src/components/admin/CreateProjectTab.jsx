/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useState } from 'react';
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useContractInteraction } from '../contract/ContractInteraction';
import { apihost, methodology } from '../contract/address';
import { useToast } from '../ui/use-toast';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useActionState } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  MapPin, 
  Calendar, 
  DollarSign, 
  Leaf, 
  FileText, 
  MapIcon, 
  Plus, 
  Search,
  Maximize2,
  Minimize2,
  Clock,
  Target,
  Settings,
  CheckCircle2,
  Info
} from 'lucide-react';

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CreateProjectTab = ({ setUpdate }) => {
  const { userAddress, createAndListProject } = useContractInteraction();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    mintPrice: '',
    isPresale: false, // New boolean field replacing treasury
    defaultIsPermanent: false,
    defaultValidity: '',
    defaultVintage: new Date(),
    methodologyIndex: '',
    location: '',
    emissionReductions: '',
    projectDetails: '',
  });
  const [mapError, setMapError] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [coordinatesList, setCoordinatesList] = useState([{ lat: '', lng: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const account = useActiveAccount()

  // Component to handle map interactions
  const LocationPicker = ({ setLocation }) => {
    const map = useMap();
    try {
      useMapEvents({
        click(e) {
          const { lat, lng } = e.latlng;
          setCoordinatesList((prev) => {
            const newList = [...prev];
            newList[newList.length - 1] = { lat: lat.toFixed(6), lng: lng.toFixed(6) };
            updateLocationString(newList);
            return newList;
          });
          map.setView([lat, lng], map.getZoom());
        },
      });

      return coordinatesList.map((coord, index) => (
        coord.lat && coord.lng ? (
          <Marker
            key={index}
            position={[Number(coord.lat), Number(coord.lng)]}
            draggable={true}
            eventHandlers={{
              dragend(e) {
                const { lat, lng } = e.target.getLatLng();
                setCoordinatesList((prev) => {
                  const newList = [...prev];
                  newList[index] = { lat: lat.toFixed(6), lng: lng.toFixed(6) };
                  updateLocationString(newList);
                  return newList;
                });
                map.setView([lat, lng], map.getZoom());
              },
            }}
          />
        ) : null
      ));
    } catch (error) {
      setMapError(error.message);
      return null;
    }
  };

  // Update location string in formData
  const updateLocationString = (coords) => {
    const locationString = coords
      .filter(coord => coord.lat && coord.lng)
      .map((coord, index) => `Location ${index + 1} - (${coord.lng}, ${coord.lat})`)
      .join(', ');
    setFormData((prev) => ({ ...prev, location: locationString }));
  };

  // Handle location search
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast({
        title: "Empty Search",
        description: "Please enter a location to search.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const results = await response.json();
      if (results.length > 0) {
        const { lat, lon } = results[0];
        setCoordinatesList((prev) => {
          const newList = [...prev];
          newList[0] = { lat: parseFloat(lat).toFixed(6), lng: parseFloat(lon).toFixed(6) };
          updateLocationString(newList);
          return newList;
        });
        toast({
          title: "Location Found",
          description: `Set to ${results[0].display_name}`,
          variant: "success",
        });
      } else {
        toast({
          title: "Location Not Found",
          description: "No results found for the search query.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: "Failed to search location. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Add new coordinate input field
  const addCoordinateField = () => {
    setCoordinatesList((prev) => [...prev, { lat: '', lng: '' }]);
  };

  // Handle coordinate input change
  const handleCoordinateChange = (index, field, value) => {
    setCoordinatesList((prev) => {
      const newList = [...prev];
      newList[index] = { ...newList[index], [field]: value };
      updateLocationString(newList);
      return newList;
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'defaultIsPermanent') {
      setFormData({
        ...formData,
        [name]: checked,
        defaultValidity: checked ? '100' : formData.defaultValidity
      });
    } else {
      setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const {
      mintPrice,
      isPresale,
      defaultIsPermanent,
      defaultValidity,
      defaultVintage,
      methodologyIndex,
      location,
      emissionReductions,
      projectDetails,
    } = formData;

    // Validation
    if (!mintPrice || isNaN(mintPrice) || Number(mintPrice) <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please provide a valid mint price greater than 0.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if ((defaultIsPermanent && defaultValidity !== '0') || (!defaultIsPermanent && defaultValidity === '0')) {
      toast({
        title: "Invalid Validity",
        description: "Validity must be 0 if permanent, non-zero otherwise.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (
      !defaultIsPermanent &&
      (isNaN(defaultValidity) || defaultValidity <= 0 || defaultValidity > 100)
    ) {
      toast({
        title: "Invalid Validity",
        description: "Validity must be a number between 1 and 100 years if not permanent.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (
      !emissionReductions ||
      isNaN(emissionReductions) ||
      emissionReductions <= 0 ||
      emissionReductions > 1000000000
    ) {
      toast({
        title: "Invalid Emission Reductions",
        description: "Emission reductions must be a number between 1 and 1,000,000,000.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (!projectDetails || projectDetails.trim().length === 0) {
      toast({
        title: "Empty Project Details",
        description: "Please provide project details.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (parseInt(methodology.length) <= parseInt(methodologyIndex) || parseInt(methodologyIndex) < 0) {
      toast({
        title: "Invalid Methodology Index",
        description: "Methodology index must be between 0 and 31.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (!location) {
      toast({
        title: "No Location Selected",
        description: "Please select a location on the map or via search.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    const vintageTimestamp = formData.defaultVintage
      ? Math.floor(new Date(formData.defaultVintage).getTime() / 1000)
      : "";

    const preparedData = {
      ...formData,
      defaultVintage: vintageTimestamp,
    };

    try {
      console.log("formdata", preparedData);
      const receipt = await createAndListProject(preparedData, account);
      if (receipt.status === "success") {
        // store project details in the backend
        const response = await fetch(`${apihost}/project/addproject`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ hash: receipt.transactionHash }),
        });
        if (!response.ok) {
          throw new Error('Failed to store project details in the backend');
        }
        const data = await response.json();
        if (data.success) {
          console.log('Project details stored successfully:', data);
        }
        setUpdate(4);
        toast({
          title: "Project Created Successfully",
          description: `Your carbon credit project has been submitted for review.`,
          variant: "success",
        });
        
        // Reset form
        setFormData({
          mintPrice: '',
          isPresale: false,
          defaultIsPermanent: false,
          defaultValidity: '',
          defaultVintage: new Date(),
          methodologyIndex: '',
          location: '',
          emissionReductions: '',
          projectDetails: '',
        });
        setCoordinatesList([{ lat: '', lng: '' }]);
      } else {
        toast({
          title: "Transaction Failed",
          description: "The transaction was not successful.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Project creation failed:', error);
      toast({
        title: "Project Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
            <Leaf className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Carbon Credit Project</h1>
            <p className="text-gray-600 mt-2">Submit your project for validation and carbon credit issuance</p>
          </div>
        </div>
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Info className="w-3 h-3" />
            <span>Review Period: 30 days</span>
          </Badge>
          <Badge variant="outline" className="flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>VVB Verification Required</span>
          </Badge>
        </div>
      </div>

      {mapError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="text-red-600 text-sm">
              <strong>Map Error:</strong> {mapError}. Please try refreshing or reverting to manual location input.
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span>Project Pricing & Type</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mintPrice" className="text-sm font-medium">
                  Target Price (RUSD per tCO₂)
                </Label>
                <Input
                  id="mintPrice"
                  name="mintPrice"
                  type="text"
                  step="0.01"
                  min="0"
                  value={formData.mintPrice}
                  onChange={handleChange}
                  placeholder="e.g., 25.00"
                  className="w-full"
                  required
                />
                <p className="text-xs text-gray-500">Price per carbon credit token in RUSD</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="isPresale" className="text-sm font-medium">
                  Project Type
                </Label>
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Switch
                    id="isPresale"
                    checked={formData.isPresale}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPresale: checked }))}
                  />
                  <div className="flex-1">
                    <Label htmlFor="isPresale" className="text-sm font-medium cursor-pointer">
                      {formData.isPresale ? "Presale Project" : "Regular Project"}
                    </Label>
                    <p className="text-xs text-gray-500">
                      {formData.isPresale 
                        ? "Credits available for advance purchase before verification"
                        : "Credits available after full verification process"
                      }
                    </p>
                  </div>
                  <Badge variant={formData.isPresale ? "default" : "secondary"}>
                    {formData.isPresale ? "Presale" : "Standard"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Validity Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span>Credit Validity</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <Switch
                id="defaultIsPermanent"
                checked={formData.defaultIsPermanent}
                onCheckedChange={(checked) => setFormData(prev => ({
                  ...prev,
                  defaultIsPermanent: checked,
                  defaultValidity: checked ? '0' : prev.defaultValidity,
                }))}
              />
              <div className="flex-1">
                <Label htmlFor="defaultIsPermanent" className="text-sm font-medium cursor-pointer">
                  Permanent Validity
                </Label>
                <p className="text-xs text-gray-500">
                  {formData.defaultIsPermanent 
                    ? "Credits never expire"
                    : "Credits have a limited validity period"
                  }
                </p>
              </div>
              <Badge variant={formData.defaultIsPermanent ? "default" : "secondary"}>
                {formData.defaultIsPermanent ? "Permanent" : "Limited"}
              </Badge>
            </div>

            {!formData.defaultIsPermanent && (
              <div className="space-y-2">
                <Label htmlFor="defaultValidity" className="text-sm font-medium">
                  Validity Period (Years)
                </Label>
                <Input
                  id="defaultValidity"
                  name="defaultValidity"
                  type="text"
                  min="1"
                  max="100"
                  value={formData.defaultValidity}
                  onChange={handleChange}
                  placeholder="e.g., 10"
                  className="w-full md:w-48"
                  required={!formData.defaultIsPermanent}
                />
                <p className="text-xs text-gray-500">Number of years the credits remain valid</p>
              </div>
            )}

            {formData.defaultIsPermanent && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  ✓ Credits set to permanent validity (100+ years)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-orange-600" />
              <span>Project Specifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="defaultVintage" className="text-sm font-medium">
                  Project Vintage
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <ReactDatePicker
                    id="defaultVintage"
                    selected={formData.defaultVintage}
                    onChange={(date) => setFormData(prev => ({ ...prev, defaultVintage: date }))}
                    showTimeSelect
                    dateFormat="PPpp"
                    className="w-full pl-10 border rounded-md px-3 py-2"
                    wrapperClassName="w-full"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500">When the emission reductions occurred</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="methodologyIndex" className="text-sm font-medium">
                  Methodology
                </Label>
                <Select value={formData.methodologyIndex} onValueChange={(value) => setFormData(prev => ({ ...prev, methodologyIndex: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select methodology" />
                  </SelectTrigger>
                  <SelectContent>
                    {methodology.map((method, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {index}
                          </Badge>
                          <span className="truncate">{method}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Carbon accounting methodology used</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emissionReductions" className="text-sm font-medium">
                Emission Reduction Goal (tCO₂)
              </Label>
              <Input
                id="emissionReductions"
                name="emissionReductions"
                type="text"
                min="1"
                max="1000000000"
                value={formData.emissionReductions}
                onChange={handleChange}
                placeholder="e.g., 10000"
                className="w-full"
                required
              />
              <p className="text-xs text-gray-500">Total tonnes of CO₂ equivalent to be reduced/removed</p>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-red-600" />
              <span>Project Location</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Location Search */}
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for a location (e.g., New York, NY)"
                  className="pl-10"
                />
              </div>
              <Button
                type="button"
                onClick={handleSearch}
                disabled={isSearching}
                variant="outline"
                className="px-4"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>

            {/* Manual Coordinates */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Manual Coordinates</Label>
                <Button
                  type="button"
                  onClick={addCoordinateField}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Point</span>
                </Button>
              </div>
              
              {coordinatesList.map((coord, index) => (
                <div key={index} className="grid grid-cols-2 gap-2">
                  <Input
                    type="text"
                    placeholder="Latitude"
                    value={coord.lat}
                    onChange={(e) => handleCoordinateChange(index, 'lat', e.target.value)}
                  />
                  <Input
                    type="text"
                    placeholder="Longitude"
                    value={coord.lng}
                    onChange={(e) => handleCoordinateChange(index, 'lng', e.target.value)}
                  />
                </div>
              ))}
            </div>

            {/* Map */}
            <div className="relative">
              <div className={`${isFullScreen ? 'fixed inset-0 bg-white' : 'w-full h-80 border rounded-lg overflow-hidden'}`}>
                <MapContainer
                  center={coordinatesList[0].lat && coordinatesList[0].lng 
                    ? [Number(coordinatesList[0].lat), Number(coordinatesList[0].lng)] 
                    : [51.505, -0.09]}
                  zoom={13}
                  style={{ height: '100%', width: '100%', zIndex: 0 }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <LocationPicker setLocation={(location) => setFormData({ ...formData, location })} />
                </MapContainer>
              </div>
              <Button
                type="button"
                onClick={() => setIsFullScreen(!isFullScreen)}
                variant="secondary"
                size="sm"
                className="absolute top-2 right-2 z-10"
              >
                {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </div>
            
            {formData.location && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Selected Location:</strong> {formData.location}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <span>Project Documentation</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectDetails" className="text-sm font-medium">
                Project Details & Documentation
              </Label>
              <Textarea
                id="projectDetails"
                name="projectDetails"
                value={formData.projectDetails}
                onChange={handleChange}
                placeholder="Upload all project-related files to a public GitHub repository and paste the link here."
                className="min-h-[100px] resize-vertical"
                required
              />
              <div className="text-xs text-gray-500">
                <p>Please include comprehensive project documentation. </p>
                <p>
                  <strong>Example:</strong>{' '}
                  <a 
                    href="https://github.com/arrnaya/BCO2_Listing_Application" 
                    className="text-green-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Sample project repository
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <Button 
                type="submit" 
                size="lg"
                disabled={isSubmitting}
                className="w-full md:w-auto px-8 bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Creating Project...
                  </>
                ) : (
                  <>
                    <Leaf className="w-4 h-4 mr-2" />
                    Create Carbon Credit Project
                  </>
                )}
              </Button>
              <p className="text-sm text-gray-500">
                By submitting, you agree to the platform terms and validation process
              </p>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default CreateProjectTab;