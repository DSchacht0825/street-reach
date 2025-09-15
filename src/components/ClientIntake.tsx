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
  Checkbox
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Save as SaveIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  LocationOff as LocationOffIcon
} from '@mui/icons-material';
import { supabase, Client } from '../lib/supabase';
import { format } from 'date-fns';

interface ClientIntakeProps {
  user: any;
  onClientAdded?: () => void;
}

interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

const ClientIntake: React.FC<ClientIntakeProps> = ({ user, onClientAdded }) => {
  const [formData, setFormData] = useState<Partial<Client>>({
    first_name: '',
    middle: '',
    last_name: '',
    aka: '',
    gender: '',
    ethnicity: '',
    age: '',
    height: '',
    weight: '',
    hair: '',
    eyes: '',
    description: '',
    notes: '',
    last_contact: '',
    contacts: 0,
    date_created: format(new Date(), 'yyyy-MM-dd')
  });

  const [location, setLocation] = useState<Location | null>(null);
  const [locationError, setLocationError] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Backdating functionality
  const [useBackdating, setUseBackdating] = useState(false);
  const [encounterDate, setEncounterDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [encounterTime, setEncounterTime] = useState(format(new Date(), 'HH:mm'));

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
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const handleInputChange = (field: keyof Client) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
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

      // Create the encounter datetime from selected date/time or current time
      const encounterDateTime = useBackdating
        ? new Date(`${encounterDate}T${encounterTime}:00`)
        : new Date();

      const clientData: Partial<Client> = {
        ...formData,
        contacts: 1, // First encounter
        last_contact: format(encounterDateTime, 'yyyy-MM-dd HH:mm:ss'),
        date_created: useBackdating ? encounterDate : format(new Date(), 'yyyy-MM-dd'),
        created_at: useBackdating ? encounterDateTime.toISOString() : new Date().toISOString()
      };

      const { data, error: insertError } = await supabase
        .from('clients')
        .insert([clientData])
        .select()
        .single();

      if (insertError) throw insertError;

      // Create an initial interaction record (with or without location)
      if (data) {
        const interactionData = {
          client_id: data.id,
          worker_id: user.id,
          worker_name: user.email?.split('@')[0] || 'Unknown Worker',
          interaction_type: 'Initial Intake',
          notes: `Client intake completed${useBackdating ? ` (Backdated to ${format(encounterDateTime, 'PPP p')})` : ''}. ${location ? 'Location captured.' : 'Location not available.'} ${formData.notes ? `Notes: ${formData.notes}` : ''}`.trim(),
          location_lat: location?.latitude || null,
          location_lng: location?.longitude || null,
          interaction_date: encounterDateTime.toISOString(),
          created_at: useBackdating ? encounterDateTime.toISOString() : new Date().toISOString()
        };

        await supabase
          .from('interactions')
          .insert([interactionData]);
      }

      setSuccess(true);
      
      // Reset form
      setFormData({
        first_name: '',
        middle: '',
        last_name: '',
        aka: '',
        gender: '',
        ethnicity: '',
        age: '',
        height: '',
        weight: '',
        hair: '',
        eyes: '',
        description: '',
        notes: '',
        last_contact: '',
        contacts: 0,
        date_created: format(new Date(), 'yyyy-MM-dd')
      });

      // Reset backdating fields
      setUseBackdating(false);
      setEncounterDate(format(new Date(), 'yyyy-MM-dd'));
      setEncounterTime(format(new Date(), 'HH:mm'));

      onClientAdded?.();

    } catch (error: any) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const genderOptions = [
    'Male',
    'Female',
    'Non-binary',
    'Prefer not to say'
  ];

  const ethnicityOptions = [
    'White/Caucasian',
    'Black/African American',
    'Hispanic/Latino',
    'Asian',
    'Native American',
    'Pacific Islander',
    'Mixed Race',
    'Other',
    'Prefer not to say'
  ];

  const hairOptions = [
    'Black',
    'Brown',
    'Blonde',
    'Red',
    'Gray',
    'White',
    'Bald',
    'Other'
  ];

  const eyeOptions = [
    'Brown',
    'Blue',
    'Green',
    'Hazel',
    'Gray',
    'Other'
  ];

  return (
    <Box sx={{ p: 2, pb: 8 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <PersonIcon />
        <Typography variant="h5">
          Client Intake
        </Typography>
      </Box>

      {/* Location Status */}
      <Card sx={{ mb: 3, bgcolor: location ? 'success.light' : locationError.includes('denied') ? 'error.light' : 'warning.light' }}>
        <CardContent sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {location ? <LocationIcon /> : <LocationOffIcon />}
            {gettingLocation ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2">Getting location...</Typography>
              </Box>
            ) : location ? (
              <Box>
                <Typography variant="body2" color="success.dark">
                  Location captured ({location.accuracy ? `±${Math.round(location.accuracy)}m` : 'GPS'})
                </Typography>
                <Typography variant="caption" color="success.dark">
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ width: '100%' }}>
                <Typography variant="body2" color={locationError.includes('denied') ? 'error.dark' : 'warning.dark'}>
                  {locationError || 'Location not available'}
                </Typography>
                {locationError.includes('denied') ? (
                  <Alert severity="info" sx={{ mt: 1, fontSize: '0.75rem' }}>
                    Location was denied. You can still create entries without location data.
                    To enable location: go to your browser settings and allow location for this site.
                  </Alert>
                ) : (
                  <Button
                    size="small"
                    onClick={getCurrentLocation}
                    sx={{ mt: 0.5 }}
                  >
                    Retry Location
                  </Button>
                )}
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Backdating Option */}
      <Card sx={{ mb: 2, bgcolor: useBackdating ? 'info.light' : 'grey.50' }}>
        <CardContent sx={{ py: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={useBackdating}
                onChange={(e) => setUseBackdating(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScheduleIcon />
                <Typography variant="body2">
                  Backdate this entry (for encounters that happened in the past)
                </Typography>
              </Box>
            }
          />

          {useBackdating && (
            <Box sx={{ mt: 2, display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                label="Encounter Date"
                type="date"
                value={encounterDate}
                onChange={(e) => setEncounterDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Encounter Time"
                type="time"
                value={encounterTime}
                onChange={(e) => setEncounterTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1 }}
              />
            </Box>
          )}

          {useBackdating && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Entry will be recorded as occurring on {format(new Date(`${encounterDate}T${encounterTime}:00`), 'PPP p')}
            </Alert>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
            
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  fullWidth
                  label="First Name *"
                  value={formData.first_name}
                  onChange={handleInputChange('first_name')}
                  required
                />
                <TextField
                  fullWidth
                  label="Last Name *"
                  value={formData.last_name}
                  onChange={handleInputChange('last_name')}
                  required
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  fullWidth
                  label="Middle Name"
                  value={formData.middle}
                  onChange={handleInputChange('middle')}
                />
                <TextField
                  fullWidth
                  label="AKA / Street Name"
                  value={formData.aka}
                  onChange={handleInputChange('aka')}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  fullWidth
                  select
                  label="Gender"
                  value={formData.gender}
                  onChange={handleInputChange('gender')}
                >
                  {genderOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  fullWidth
                  label="Age"
                  value={formData.age}
                  onChange={handleInputChange('age')}
                  placeholder="e.g., 35, 20s, Unknown"
                />
              </Box>

              <TextField
                fullWidth
                select
                label="Ethnicity"
                value={formData.ethnicity}
                onChange={handleInputChange('ethnicity')}
              >
                {ethnicityOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              Physical Description
            </Typography>

            <Stack spacing={2}>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  fullWidth
                  label="Height"
                  value={formData.height}
                  onChange={handleInputChange('height')}
                  placeholder="e.g., 5'8, 170cm, Tall"
                />
                <TextField
                  fullWidth
                  label="Weight"
                  value={formData.weight}
                  onChange={handleInputChange('weight')}
                  placeholder="e.g., 150lbs, Medium build"
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  fullWidth
                  select
                  label="Hair Color"
                  value={formData.hair}
                  onChange={handleInputChange('hair')}
                >
                  {hairOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  fullWidth
                  select
                  label="Eye Color"
                  value={formData.eyes}
                  onChange={handleInputChange('eyes')}
                >
                  {eyeOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Physical Description"
                value={formData.description}
                onChange={handleInputChange('description')}
                placeholder="Distinguishing features, clothing, etc."
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={formData.notes}
                onChange={handleInputChange('notes')}
                placeholder="Additional observations, needs, circumstances..."
              />
            </Stack>

            <Box sx={{ mt: 3 }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                disabled={saving || !formData.first_name || !formData.last_name}
              >
                {saving ? 'Saving...' : 'Save Client'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </form>

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccess(false)}>
          Client added successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ClientIntake;