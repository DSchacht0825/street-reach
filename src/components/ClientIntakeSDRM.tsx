import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  MenuItem,
  Stack,
  CircularProgress,
  Snackbar,
  FormControlLabel,
  Checkbox,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  InputLabel,
  Select,
  Chip,
  OutlinedInput,
  SelectChangeEvent
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Save as SaveIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  LocationOff as LocationOffIcon,
  ExpandMore as ExpandMoreIcon,
  Home as HomeIcon,
  MedicalServices as MedicalIcon,
  Groups as GroupsIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

interface ClientIntakeSDRMProps {
  user: any;
  onClientAdded?: () => void;
}

interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface SDRMClient {
  // Basic Information
  first_name: string;
  middle: string;
  last_name: string;
  aka: string;

  // Demographics
  gender: string;
  race: string;
  ethnicity: string;
  age: string;
  age_range: string;
  sexual_orientation: string;

  // Physical Description
  height: string;
  weight: string;
  hair: string;
  eyes: string;
  description: string;

  // Personal Circumstances
  dependents_under_18: number;
  veteran_status: boolean;
  disabled: boolean;
  disabled_details: string;

  // Contact & Location
  phone: string;
  email: string;
  date_first_contact: string;
  date_last_contact: string;
  location_initial_contact: string;
  city_prior_to_vista: string;
  length_in_vista: string;

  // Housing & Services
  living_situation: string;
  housing_barrier: string;
  exit_destination: string;
  shelter_destination: string;
  service_referrals: string[];
  referred_from: string;

  // Administrative
  new_to_sdrm: boolean;
  ongoing_count: number;
  contacts: number;
  notes: string;
  date_created: string;
  ucs_count: number;
}

const ClientIntakeSDRM: React.FC<ClientIntakeSDRMProps> = ({ user, onClientAdded }) => {
  const [formData, setFormData] = useState<Partial<SDRMClient>>({
    // Basic Information
    first_name: '',
    middle: '',
    last_name: '',
    aka: '',

    // Demographics
    gender: '',
    race: '',
    ethnicity: '',
    age: '',
    age_range: '',
    sexual_orientation: '',

    // Physical Description
    height: '',
    weight: '',
    hair: '',
    eyes: '',
    description: '',

    // Personal Circumstances
    dependents_under_18: 0,
    veteran_status: false,
    disabled: false,
    disabled_details: '',

    // Contact & Location
    phone: '',
    email: '',
    date_first_contact: format(new Date(), 'yyyy-MM-dd'),
    date_last_contact: format(new Date(), 'yyyy-MM-dd'),
    location_initial_contact: '',
    city_prior_to_vista: '',
    length_in_vista: '',

    // Housing & Services
    living_situation: '',
    housing_barrier: '',
    exit_destination: '',
    shelter_destination: '',
    service_referrals: [],
    referred_from: '',

    // Administrative
    new_to_sdrm: true,
    ongoing_count: 0,
    contacts: 1,
    notes: '',
    date_created: format(new Date(), 'yyyy-MM-dd'),
    ucs_count: 1
  });

  const [location, setLocation] = useState<Location | null>(null);
  const [locationError, setLocationError] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['basic']);

  // SDRM Field Options
  const genderOptions = ['Male', 'Female', 'Transgender', 'Non-Binary', 'Other', 'Decline to State'];
  const raceOptions = ['White', 'Black/African American', 'Asian', 'Native American', 'Pacific Islander', 'Multiple Races', 'Other', 'Decline to State'];
  const ethnicityOptions = ['Hispanic/Latino', 'Not Hispanic/Latino', 'Decline to State'];
  const sexualOrientationOptions = ['Heterosexual', 'Gay', 'Lesbian', 'Bisexual', 'Other', 'Decline to State'];
  const ageRangeOptions = ['Under 18', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];

  const livingSituationOptions = [
    'Unsheltered - Street',
    'Unsheltered - Vehicle',
    'Unsheltered - Encampment',
    'Emergency Shelter',
    'Transitional Housing',
    'Doubled Up',
    'Hotel/Motel',
    'Permanent Supportive Housing',
    'Other'
  ];

  const housingBarrierOptions = [
    'No Income',
    'Insufficient Income',
    'No ID/Documentation',
    'Criminal History',
    'Poor Credit',
    'Eviction History',
    'Mental Health',
    'Substance Use',
    'Physical Disability',
    'Family Size',
    'Pet(s)',
    'Other'
  ];

  const shelterOptions = ['La Posada', 'Mission Academy', 'ONC', 'BCNC', 'Other', 'None'];

  const serviceReferralOptions = [
    'Emergency Shelter',
    'Food Services',
    'Medical Care',
    'Mental Health Services',
    'Substance Abuse Treatment',
    'Legal Services',
    'Employment Services',
    'Benefits Enrollment',
    'ID/Documentation',
    'Transportation',
    'Clothing',
    'Case Management'
  ];

  const referralSourceOptions = [
    'Self-Referral',
    'Police/Law Enforcement',
    'Hospital/Medical',
    'Mental Health Provider',
    'Social Services',
    'Faith-Based Organization',
    'Community Member',
    'Other Homeless Services',
    'Other'
  ];

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    setGettingLocation(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setGettingLocation(false);
      },
      (error) => {
        setLocationError(`Location error: ${error.message}`);
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  const handleInputChange = (field: keyof SDRMClient) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSelectChange = (field: keyof SDRMClient) => (event: SelectChangeEvent<string>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleMultiSelectChange = (field: keyof SDRMClient) => (event: SelectChangeEvent<string[]>) => {
    setFormData(prev => ({
      ...prev,
      [field]: typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value
    }));
  };

  const calculateAgeRange = (age: string): string => {
    const ageNum = parseInt(age);
    if (isNaN(ageNum)) return '';
    if (ageNum < 18) return 'Under 18';
    if (ageNum <= 24) return '18-24';
    if (ageNum <= 34) return '25-34';
    if (ageNum <= 44) return '35-44';
    if (ageNum <= 54) return '45-54';
    if (ageNum <= 64) return '55-64';
    return '65+';
  };

  const handleAgeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const age = event.target.value;
    setFormData(prev => ({
      ...prev,
      age: age,
      age_range: calculateAgeRange(age)
    }));
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.first_name || !formData.last_name) {
        throw new Error('First name and last name are required');
      }

      const clientData = {
        ...formData,
        location_coordinates: location ? {
          lat: location.latitude,
          lng: location.longitude
        } : null,
        created_by: user.id,
        created_at: new Date().toISOString()
      };

      const { data, error: insertError } = await supabase
        .from('clients')
        .insert([clientData])
        .select()
        .single();

      if (insertError) throw insertError;

      // Create initial interaction record
      if (data && location) {
        const interactionData = {
          client_id: data.id,
          worker_id: user.id,
          worker_name: user.email?.split('@')[0] || 'Unknown Worker',
          interaction_type: 'Initial Intake',
          notes: `Initial intake completed. Location: ${formData.location_initial_contact || 'Not specified'}`,
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy
          },
          interaction_date: new Date().toISOString()
        };

        await supabase
          .from('interactions')
          .insert([interactionData]);
      }

      setSuccess(true);

      // Reset form
      setTimeout(() => {
        setFormData({
          first_name: '',
          middle: '',
          last_name: '',
          aka: '',
          gender: '',
          race: '',
          ethnicity: '',
          age: '',
          age_range: '',
          sexual_orientation: '',
          height: '',
          weight: '',
          hair: '',
          eyes: '',
          description: '',
          dependents_under_18: 0,
          veteran_status: false,
          disabled: false,
          disabled_details: '',
          phone: '',
          email: '',
          date_first_contact: format(new Date(), 'yyyy-MM-dd'),
          date_last_contact: format(new Date(), 'yyyy-MM-dd'),
          location_initial_contact: '',
          city_prior_to_vista: '',
          length_in_vista: '',
          living_situation: '',
          housing_barrier: '',
          exit_destination: '',
          shelter_destination: '',
          service_referrals: [],
          referred_from: '',
          new_to_sdrm: true,
          ongoing_count: 0,
          contacts: 1,
          notes: '',
          date_created: format(new Date(), 'yyyy-MM-dd'),
          ucs_count: 1
        });
        setSuccess(false);
        if (onClientAdded) onClientAdded();
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PersonIcon />
        SDRM Client Intake Form
      </Typography>

      {/* Location Status */}
      <Card sx={{ mb: 2, bgcolor: location ? 'success.light' : 'warning.light' }}>
        <CardContent sx={{ py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {gettingLocation ? (
              <>
                <CircularProgress size={20} />
                <Typography>Getting location...</Typography>
              </>
            ) : location ? (
              <>
                <LocationIcon color="success" />
                <Typography>
                  Location captured (±{location.accuracy?.toFixed(0)}m accuracy)
                </Typography>
              </>
            ) : (
              <>
                <LocationOffIcon color="warning" />
                <Typography>
                  {locationError || 'Location not available'}
                </Typography>
                <Button size="small" onClick={getCurrentLocation}>
                  Retry
                </Button>
              </>
            )}
          </Box>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <Accordion
          expanded={expandedSections.includes('basic')}
          onChange={() => toggleSection('basic')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon /> Basic Information
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  required
                  fullWidth
                  label="First Name"
                  value={formData.first_name}
                  onChange={handleInputChange('first_name')}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Middle Name"
                  value={formData.middle}
                  onChange={handleInputChange('middle')}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  required
                  fullWidth
                  label="Last Name"
                  value={formData.last_name}
                  onChange={handleInputChange('last_name')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="AKA/Alias"
                  value={formData.aka}
                  onChange={handleInputChange('aka')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.new_to_sdrm}
                      onChange={handleInputChange('new_to_sdrm')}
                    />
                  }
                  label="New to SDRM"
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Demographics */}
        <Accordion
          expanded={expandedSections.includes('demographics')}
          onChange={() => toggleSection('demographics')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <GroupsIcon /> Demographics
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Gender</InputLabel>
                  <Select
                    value={formData.gender || ''}
                    onChange={handleSelectChange('gender')}
                    label="Gender"
                  >
                    {genderOptions.map(option => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Race</InputLabel>
                  <Select
                    value={formData.race || ''}
                    onChange={handleSelectChange('race')}
                    label="Race"
                  >
                    {raceOptions.map(option => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Ethnicity</InputLabel>
                  <Select
                    value={formData.ethnicity || ''}
                    onChange={handleSelectChange('ethnicity')}
                    label="Ethnicity"
                  >
                    {ethnicityOptions.map(option => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Sexual Orientation</InputLabel>
                  <Select
                    value={formData.sexual_orientation || ''}
                    onChange={handleSelectChange('sexual_orientation')}
                    label="Sexual Orientation"
                  >
                    {sexualOrientationOptions.map(option => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Age"
                  type="number"
                  value={formData.age}
                  onChange={handleAgeChange}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Age Range"
                  value={formData.age_range}
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="# Dependents < 18"
                  type="number"
                  value={formData.dependents_under_18}
                  onChange={handleInputChange('dependents_under_18')}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.veteran_status}
                      onChange={handleInputChange('veteran_status')}
                    />
                  }
                  label="Veteran"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.disabled}
                      onChange={handleInputChange('disabled')}
                    />
                  }
                  label="Disabled"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Disability Details"
                  value={formData.disabled_details}
                  onChange={handleInputChange('disabled_details')}
                  disabled={!formData.disabled}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Contact & Location */}
        <Accordion
          expanded={expandedSections.includes('contact')}
          onChange={() => toggleSection('contact')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationIcon /> Contact & Location
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.phone}
                  onChange={handleInputChange('phone')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Location of Initial Contact"
                  value={formData.location_initial_contact}
                  onChange={handleInputChange('location_initial_contact')}
                  placeholder="e.g., Vista Transit Center, Civic Center Park"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="City Prior to Vista"
                  value={formData.city_prior_to_vista}
                  onChange={handleInputChange('city_prior_to_vista')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Length of Time in Vista"
                  value={formData.length_in_vista}
                  onChange={handleInputChange('length_in_vista')}
                  placeholder="e.g., 3 months, 2 years"
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Housing & Services */}
        <Accordion
          expanded={expandedSections.includes('housing')}
          onChange={() => toggleSection('housing')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HomeIcon /> Housing & Services
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Most Recent Living Situation</InputLabel>
                  <Select
                    value={formData.living_situation || ''}
                    onChange={handleSelectChange('living_situation')}
                    label="Most Recent Living Situation"
                  >
                    {livingSituationOptions.map(option => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Greatest Barrier to Housing</InputLabel>
                  <Select
                    value={formData.housing_barrier || ''}
                    onChange={handleSelectChange('housing_barrier')}
                    label="Greatest Barrier to Housing"
                  >
                    {housingBarrierOptions.map(option => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Shelter Destination</InputLabel>
                  <Select
                    value={formData.shelter_destination || ''}
                    onChange={handleSelectChange('shelter_destination')}
                    label="Shelter Destination"
                  >
                    {shelterOptions.map(option => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Referred From</InputLabel>
                  <Select
                    value={formData.referred_from || ''}
                    onChange={handleSelectChange('referred_from')}
                    label="Referred From"
                  >
                    {referralSourceOptions.map(option => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Service Referrals</InputLabel>
                  <Select
                    multiple
                    value={formData.service_referrals || []}
                    onChange={handleMultiSelectChange('service_referrals')}
                    input={<OutlinedInput label="Service Referrals" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {serviceReferralOptions.map(option => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Exit Destination"
                  value={formData.exit_destination}
                  onChange={handleInputChange('exit_destination')}
                  placeholder="If exiting program"
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Physical Description */}
        <Accordion
          expanded={expandedSections.includes('physical')}
          onChange={() => toggleSection('physical')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Physical Description</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="Height"
                  value={formData.height}
                  onChange={handleInputChange('height')}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="Weight"
                  value={formData.weight}
                  onChange={handleInputChange('weight')}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="Hair Color"
                  value={formData.hair}
                  onChange={handleInputChange('hair')}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="Eye Color"
                  value={formData.eyes}
                  onChange={handleInputChange('eyes')}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Physical Description"
                  value={formData.description}
                  onChange={handleInputChange('description')}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Notes */}
        <Accordion
          expanded={expandedSections.includes('notes')}
          onChange={() => toggleSection('notes')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Additional Notes</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Notes"
              value={formData.notes}
              onChange={handleInputChange('notes')}
              placeholder="Any additional information..."
            />
          </AccordionDetails>
        </Accordion>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {/* Submit Button */}
        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={saving || !formData.first_name || !formData.last_name}
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            fullWidth
          >
            {saving ? 'Saving...' : 'Save Client'}
          </Button>
        </Box>
      </form>

      {/* Success Snackbar */}
      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled">
          Client successfully added to SDRM database!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ClientIntakeSDRM;