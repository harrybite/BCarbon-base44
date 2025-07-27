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
    treasury: '',
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
    const {
      mintPrice,
      treasury,
      defaultIsPermanent,
      defaultValidity,
      defaultVintage,
      methodologyIndex,
      location,
      emissionReductions,
      projectDetails,
    } = formData;

    if (!treasury || treasury === '0x0000000000000000000000000000000000000000') {
      toast({
        title: "Invalid Treasury Address",
        description: "Please provide a valid treasury address.",
        variant: "destructive",
      });
      return;
    }

    if ((defaultIsPermanent && defaultValidity !== '0') || (!defaultIsPermanent && defaultValidity === '0')) {
      toast({
        title: "Invalid Validity",
        description: "Validity must be 0 if permanent, non-zero otherwise.",
        variant: "destructive",
      });
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
      return;
    }

    if (!projectDetails || projectDetails.trim().length === 0) {
      toast({
        title: "Empty Project Details",
        description: "Please provide project details.",
        variant: "destructive",
      });
      return;
    }

    if (parseInt(methodology.length) <= parseInt(methodologyIndex) || parseInt(methodologyIndex) < 0) {
      toast({
        title: "Invalid Methodology Index",
        description: "Methodology index must be between 0 and 31.",
        variant: "destructive",
      });
      return;
    }

    if (!location) {
      toast({
        title: "No Location Selected",
        description: "Please select a location on the map or via search.",
        variant: "destructive",
      });
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
          title: "Project Created",
          description: `Project created successfully`,
          variant: "success",
        });
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
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Create New Project</h2>
      {mapError && (
        <div className="text-red-500 mb-4">
          Map Error: {mapError}. Please try refreshing or reverting to manual location input.
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block">Target Price (in RUSD)</label>
          <input
            type="text"
            name="mintPrice"
            value={formData.mintPrice}
            onChange={handleChange}
            className="w-full border rounded px-2 py-1"
            required
          />
        </div>
        <div>
          <label className="block">{"Issuer's Treasury Wallet"}</label>
          <input
            type="text"
            name="treasury"
            value={formData.treasury}
            onChange={handleChange}
            className="w-full border rounded px-2 py-1"
            required
          />
          <p className="mt-1">
            <a href="https://genzvault.com/#download" className="text-green-600 hover:underline">
              Download GenZ Wallet
            </a>
          </p>
        </div>
        <div className="flex items-center">
          <button
            type="button"
            onClick={() =>
              setFormData((prev) => ({
                ...prev,
                defaultIsPermanent: !prev.defaultIsPermanent,
                defaultValidity: !prev.defaultIsPermanent ? '0' : prev.defaultValidity,
              }))
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.defaultIsPermanent ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.defaultIsPermanent ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
          <label className="block ml-4">Is Validity Permanent?</label>
        </div>
        <div>
          <label className="block">Default Validity (in years)</label>
          {!formData.defaultIsPermanent ? (
            <input
              type="text"
              name="defaultValidity"
              value={formData.defaultValidity}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
              disabled={formData.defaultIsPermanent}
              required={!formData.defaultIsPermanent}
            />
          ) : (
            <input
              type="text"
              name="defaultValidity"
              value={'100+ years'}
              disabled={formData.defaultIsPermanent}
              className="w-full border rounded px-2 py-1"
            />
          )}
          {formData.defaultIsPermanent && (
            <p className="text-sm text-gray-500 mt-1">Disabled because validity is set to permanent.</p>
          )}
        </div>
        <div className="relative">
          <label className="block">Location</label>
          <div className="flex items-center mb-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a location (e.g., New York, NY)"
              className="w-full border rounded px-2 py-1 mr-2"
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={isSearching}
              className="bg-blue-500 text-white px-4 py-1 rounded disabled:bg-gray-400"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
          {coordinatesList.map((coord, index) => (
            <div key={index} className="flex items-center mb-2">
              <input
                type="text"
                placeholder="Latitude"
                value={coord.lat}
                onChange={(e) => handleCoordinateChange(index, 'lat', e.target.value)}
                className="w-1/2 border rounded px-2 py-1 mr-2"
              />
              <input
                type="text"
                placeholder="Longitude"
                value={coord.lng}
                onChange={(e) => handleCoordinateChange(index, 'lng', e.target.value)}
                className="w-1/2 border rounded px-2 py-1"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={addCoordinateField}
            className="bg-green-500 text-white px-4 py-1 rounded mb-2"
          >
            + Add Coordinate
          </button>
          <div className="relative">
            <div className={`${isFullScreen ? 'fixed inset-0 z-50 bg-white' : 'w-full h-64 border rounded'}`}>
              <MapContainer
                center={coordinatesList[0].lat && coordinatesList[0].lng 
                  ? [Number(coordinatesList[0].lat), Number(coordinatesList[0].lng)] 
                  : [51.505, -0.09]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <LocationPicker setLocation={(location) => setFormData({ ...formData, location })} />
              </MapContainer>
            </div>
            <button
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-sm"
            >
              {isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
            </button>
          </div>
          {formData.location && (
            <p className="text-sm text-gray-500 mt-1">
              Selected: {formData.location}
            </p>
          )}
        </div>
        <div className="relative">
          <label className="block">Vintage</label>
          <ReactDatePicker
            selected={formData.defaultVintage}
            onChange={(date) =>
              setFormData((prev) => ({ ...prev, defaultVintage: date }))
            }
            showTimeSelect
            dateFormat="Pp"
            className="w-full border rounded px-2 py-1"
            wrapperClassName="w-full"
            required
          />
        </div>
        <div>
          <label className="block">Methodology</label>
          <select
            name="methodologyIndex"
            value={formData.methodologyIndex}
            onChange={handleChange}
            className="w-full border rounded px-2 py-1"
            required
          >
            <option value="">Select Methodology</option>
            {methodology.map((method, index) => (
              <option key={index} value={index}>
                {method}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block">Emission Reduction goal in tCO<sub>2</sub></label>
          <input
            type="text"
            name="emissionReductions"
            value={formData.emissionReductions}
            onChange={handleChange}
            className="w-full border rounded px-2 py-1"
            required
          />
        </div>
        <div>
          <label className="block">Project Details</label>
          <input
            name="projectDetails"
            value={formData.projectDetails}
            placeholder='Upload all the project-related files to a public GitHub repository and paste the link here.'
            onChange={handleChange}
            className="w-full border rounded px-2 py-1"
            required
          />
          <p>Check example here: <a href="https://github.com/arrnaya/BCO2_Listing_Application" className="text-green-600 hover:underline">Github Link</a></p>
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Create Project
        </button>
      </form>
    </div>
  );
};

export default CreateProjectTab;
//22708240030673
// lala ram mila