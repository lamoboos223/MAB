export interface TwkFunctionDef {
  name: string;
  category: 'User Data' | 'Permissions' | 'Media' | 'Interactive' | 'Other';
  params: { name: string; type: string; required: boolean }[];
  returns: { path: string; type: string };
  description: string;
}

export const TWK_FUNCTIONS: TwkFunctionDef[] = [
  // User Data
  { name: 'getUserId', category: 'User Data', params: [], returns: { path: 'result.user_id', type: 'string' }, description: 'Returns the user national/iqama ID' },
  { name: 'getUserType', category: 'User Data', params: [], returns: { path: 'result.user_type', type: 'string' }, description: 'Returns the user type' },
  { name: 'getUserFullName', category: 'User Data', params: [], returns: { path: 'result.full_name', type: 'string' }, description: 'Returns the user full name' },
  { name: 'getUserBirthDate', category: 'User Data', params: [], returns: { path: 'result.birth_date', type: 'string' }, description: 'Returns the user birth date' },
  { name: 'getUserMobileNumber', category: 'User Data', params: [], returns: { path: 'result.mobile_number', type: 'string' }, description: 'Returns the user mobile number' },
  { name: 'getUserGender', category: 'User Data', params: [], returns: { path: 'result.gender', type: 'string' }, description: 'Returns the user gender' },
  { name: 'getUserLocation', category: 'User Data', params: [], returns: { path: 'result', type: 'object' }, description: 'Returns user location (lat, lng)' },
  { name: 'getUserNationality', category: 'User Data', params: [], returns: { path: 'result.nationality_name', type: 'string' }, description: 'Returns the user nationality name' },
  { name: 'getUserNationalityISO', category: 'User Data', params: [], returns: { path: 'result.nationality_iso', type: 'string' }, description: 'Returns the user nationality ISO code' },
  { name: 'getUserMaritalStatus', category: 'User Data', params: [], returns: { path: 'result.marital_status', type: 'string' }, description: 'Returns the user marital status' },
  { name: 'getUserHealthStatus', category: 'User Data', params: [], returns: { path: 'result.health_status', type: 'string' }, description: 'Returns the user health status' },
  { name: 'getUserDisabilityType', category: 'User Data', params: [], returns: { path: 'result.disability_type', type: 'string' }, description: 'Returns the user disability type' },
  { name: 'getUserBloodType', category: 'User Data', params: [], returns: { path: 'result.blood_type', type: 'string' }, description: 'Returns the user blood type' },
  { name: 'getUserNationalAddress', category: 'User Data', params: [], returns: { path: 'result.national_address', type: 'object' }, description: 'Returns the user national address' },
  { name: 'getUserDegreeType', category: 'User Data', params: [], returns: { path: 'result.degree_type', type: 'string' }, description: 'Returns the user degree type' },
  { name: 'getUserOccupation', category: 'User Data', params: [], returns: { path: 'result.occupation', type: 'string' }, description: 'Returns the user occupation' },
  { name: 'getUserFamilyMembers', category: 'User Data', params: [{ name: 'minage', type: 'number', required: false }, { name: 'maxage', type: 'number', required: false }, { name: 'gender', type: 'string', required: false }], returns: { path: 'result', type: 'array' }, description: 'Returns list of family members' },
  { name: 'getUserSponsors', category: 'User Data', params: [{ name: 'minage', type: 'number', required: false }, { name: 'maxage', type: 'number', required: false }, { name: 'gender', type: 'string', required: false }], returns: { path: 'result', type: 'array' }, description: 'Returns list of sponsors' },
  { name: 'getUserUnPaidViolations', category: 'User Data', params: [], returns: { path: 'result', type: 'array' }, description: 'Returns unpaid violations' },
  { name: 'getUserPaidViolations', category: 'User Data', params: [], returns: { path: 'result', type: 'array' }, description: 'Returns paid violations' },
  { name: 'getUserVehicles', category: 'User Data', params: [], returns: { path: 'result', type: 'array' }, description: 'Returns user vehicles' },
  { name: 'getUserProfilePhoto', category: 'User Data', params: [], returns: { path: 'result', type: 'string' }, description: 'Returns user profile photo as base64' },
  { name: 'getUserPassports', category: 'User Data', params: [], returns: { path: 'result', type: 'array' }, description: 'Returns user passports' },
  { name: 'getUserIdExpiryDate', category: 'User Data', params: [], returns: { path: 'result', type: 'string' }, description: 'Returns user ID expiry date' },
  { name: 'getUserDocumentNumber', category: 'User Data', params: [], returns: { path: 'result', type: 'string' }, description: 'Returns user document number' },
  { name: 'getUserBirthCity', category: 'User Data', params: [], returns: { path: 'result', type: 'string' }, description: 'Returns user birth city' },
  { name: 'getUserEmail', category: 'User Data', params: [], returns: { path: 'result', type: 'string' }, description: 'Returns user email' },
  { name: 'getUserIqamaType', category: 'User Data', params: [], returns: { path: 'result', type: 'string' }, description: 'Returns user iqama type' },
  { name: 'getUserVehicleInsurance', category: 'User Data', params: [{ name: 'vehicleSerialNumber', type: 'string', required: true }], returns: { path: 'result', type: 'object' }, description: 'Returns vehicle insurance info' },
  { name: 'getDeviceInfo', category: 'Other', params: [], returns: { path: 'result', type: 'object' }, description: 'Returns device capabilities info' },
  { name: 'getRawData', category: 'Other', params: [{ name: 'file', type: 'string', required: true }], returns: { path: 'result', type: 'string' }, description: 'Returns raw data from a gallery file' },
  // Media
  { name: 'getGallerySingle', category: 'Media', params: [], returns: { path: 'result', type: 'string' }, description: 'Pick a single image from gallery' },
  { name: 'getGalleryMulti', category: 'Media', params: [], returns: { path: 'result', type: 'array' }, description: 'Pick multiple images from gallery' },
  { name: 'getGallerySingleVideo', category: 'Media', params: [], returns: { path: 'result', type: 'string' }, description: 'Pick a single video from gallery' },
  { name: 'getGalleryMultiVideo', category: 'Media', params: [], returns: { path: 'result', type: 'array' }, description: 'Pick multiple videos from gallery' },
  { name: 'getCameraPhoto', category: 'Media', params: [], returns: { path: 'result', type: 'string' }, description: 'Take a photo with camera' },
  { name: 'getCameraVideo', category: 'Media', params: [], returns: { path: 'result', type: 'string' }, description: 'Record a video with camera' },
  { name: 'getFileBase64', category: 'Media', params: [], returns: { path: 'result', type: 'string' }, description: 'Pick a file and return as base64' },
  { name: 'getFileId', category: 'Media', params: [], returns: { path: 'result', type: 'string' }, description: 'Pick a file and return its ID' },
  { name: 'getImage', category: 'Media', params: [{ name: 'nationalId', type: 'string', required: true }], returns: { path: 'result', type: 'string' }, description: 'Get image for a given national ID' },
  { name: 'getPlainUserProfilePhoto', category: 'Media', params: [], returns: { path: 'result', type: 'string' }, description: 'Returns plain user profile photo' },
  { name: 'getPlainImage', category: 'Media', params: [{ name: 'nationalId', type: 'string', required: true }], returns: { path: 'result', type: 'string' }, description: 'Get plain image for a given national ID' },
  // Permissions
  { name: 'askUserLocationPermission', category: 'Permissions', params: [], returns: { path: 'result', type: 'string' }, description: 'Request location permission' },
  { name: 'askUserPreciseLocationPermission', category: 'Permissions', params: [], returns: { path: 'result', type: 'string' }, description: 'Request precise location permission' },
  { name: 'askCameraPermission', category: 'Permissions', params: [], returns: { path: 'result', type: 'string' }, description: 'Request camera permission' },
  { name: 'askGalleryPermission', category: 'Permissions', params: [], returns: { path: 'result', type: 'string' }, description: 'Request gallery permission' },
  { name: 'askPushNotificationPermission', category: 'Permissions', params: [], returns: { path: 'result', type: 'string' }, description: 'Request push notification permission' },
  // Interactive
  { name: 'authenticateBiometric', category: 'Interactive', params: [], returns: { path: 'result', type: 'string' }, description: 'Trigger biometric authentication' },
  { name: 'shareScreenShot', category: 'Interactive', params: [], returns: { path: 'result', type: 'string' }, description: 'Share a screenshot' },
  { name: 'share', category: 'Interactive', params: [{ name: 'fileName', type: 'string', required: true }, { name: 'content', type: 'string', required: true }, { name: 'mimetype', type: 'string', required: true }], returns: { path: 'result', type: 'string' }, description: 'Share a file' },
  { name: 'scanCode', category: 'Interactive', params: [], returns: { path: 'result', type: 'string' }, description: 'Open QR/barcode scanner' },
  { name: 'openScreen', category: 'Interactive', params: [{ name: 'screenType', type: 'string', required: true }, { name: 'valuesParam', type: 'object', required: false }], returns: { path: 'result', type: 'string' }, description: 'Open a native screen' },
  { name: 'openService', category: 'Interactive', params: [{ name: 'serviceId', type: 'string', required: true }, { name: 'valuesParam', type: 'object', required: false }], returns: { path: 'result', type: 'string' }, description: 'Open another service' },
  { name: 'openUrl', category: 'Interactive', params: [{ name: 'url', type: 'string', required: true }, { name: 'urlType', type: 'string', required: true }], returns: { path: 'result', type: 'string' }, description: 'Open a URL' },
  { name: 'postCard', category: 'Interactive', params: [{ name: 'actionType', type: 'string', required: true }, { name: 'payload', type: 'object', required: true }], returns: { path: 'result', type: 'string' }, description: 'Post a card action' },
  { name: 'generateToken', category: 'Interactive', params: [], returns: { path: 'result', type: 'string' }, description: 'Generate auth token' },
  { name: 'sendPaymentData', category: 'Interactive', params: [{ name: 'paymentAmount', type: 'number', required: true }, { name: 'currencyCode', type: 'string', required: true }], returns: { path: 'result', type: 'string' }, description: 'Send payment data' },
  { name: 'addCalendarEvent', category: 'Interactive', params: [{ name: 'eventTitle', type: 'string', required: true }, { name: 'eventStartDateTime', type: 'string', required: false }, { name: 'eventEndDateTime', type: 'string', required: false }, { name: 'eventRecurringType', type: 'string', required: false }, { name: 'eventReminderType', type: 'string', required: false }, { name: 'eventReminderBeforeType', type: 'string', required: false }, { name: 'eventLocationLatitude', type: 'number', required: false }, { name: 'eventLocationLongitude', type: 'number', required: false }, { name: 'eventQr', type: 'string', required: false }, { name: 'eventDescription', type: 'string', required: false }], returns: { path: 'result', type: 'string' }, description: 'Add calendar event' },
  { name: 'addDocument', category: 'Interactive', params: [{ name: 'various', type: 'object', required: true }], returns: { path: 'result', type: 'string' }, description: 'Add a document' },
  { name: 'updateDocument', category: 'Interactive', params: [{ name: 'various', type: 'object', required: true }], returns: { path: 'result', type: 'string' }, description: 'Update a document' },
  { name: 'deleteDocument', category: 'Interactive', params: [{ name: 'referenceNumber', type: 'string', required: true }, { name: 'categoryId', type: 'string', required: true }], returns: { path: 'result', type: 'string' }, description: 'Delete a document' },
  { name: 'livenessCheckCamera', category: 'Interactive', params: [{ name: 'configurations', type: 'array', required: false }], returns: { path: 'result', type: 'object' }, description: 'Liveness check via camera' },
  { name: 'livenessCheckImageFromGallery', category: 'Interactive', params: [{ name: 'configurations', type: 'array', required: false }], returns: { path: 'result', type: 'object' }, description: 'Liveness check via gallery image' },
  { name: 'livenessCheckImageFromFiles', category: 'Interactive', params: [{ name: 'configurations', type: 'array', required: false }], returns: { path: 'result', type: 'object' }, description: 'Liveness check via file image' }
];
