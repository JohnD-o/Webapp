// Location-specific configurations
const LOCATIONS = {
  'sa-atx': {
    base: [-98.4573, 29.7079], // San Antonio, TX (78260) coordinates
    ratePerMile: 0.65,
    pricing: {
      sound: {
        standard: '250-4-40',
        premium: '300-4-35',
        fullStack: '350-4-20'
      },
      dj: {
        none: '0',
        professional: '100',
        powerHour: '150-1-0'
      },
      visual: {
        none: '0',
        basic: '39',
        premium: '49',
        immersive: '80'
      }
    }
  },
  'chicago': {
    base: [-87.8006, 42.1817], // Highland Park, IL (60035) coordinates
    ratePerMile: 0.85, // Higher rate due to increased gas prices ($3.60/gal) and maintenance costs
    pricing: {
      sound: {
        standard: '300-4-45',  // 2 PAs, 1 Sub
        premium: '350-4-45',   // 2 PAs, 2 Subs
        wallOfBass: '450-4-35', // 2 PAs, 4 Subs + Free Lights
        fullStack: '550-4-40'   // 4 PAs, 4 Subs + Free Lights
      },
      dj: {
        none: '0',
        professional: '100',
        powerHour: '150-1-0'
      },
      visual: {
        none: '0',
        basic: '10'
      }
    }
  }
};

let currentLocation = 'sa-atx';
let selectedOptions = {
  sound: '250-4-40',
  dj: '0',
  visual: '0',
  addon: '0',
  water: '0',
  fuel: '0'
};

// Base location and rate (will be updated based on selection)
let BASE_LOCATION = LOCATIONS[currentLocation].base;
let RATE_PER_MILE = LOCATIONS[currentLocation].ratePerMile;
let travelDistance = 0;

// OpenRouteService API configuration
let ORS_API_KEY = null;
const ORS_API_URL = 'https://api.openrouteservice.org/v2/matrix/driving-car';

// Fetch API key from server
async function initializeApiKey() {
  try {
    console.log('Attempting to fetch API configuration...');
    
    // Get the current hostname
    const hostname = window.location.origin;
    const configUrl = `${hostname}/api/config`;
    console.log('Fetching from:', configUrl);
    
    const response = await fetch(configUrl);
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response not OK:', errorText);
      throw new Error(`Failed to load configuration: ${response.status}`);
    }

    const config = await response.json();
    console.log('Configuration received:', { success: !!config.apiKey, message: config.message });
    
    if (config.error) {
      throw new Error(config.message || 'API configuration error');
    }
    
    if (!config.apiKey) {
      throw new Error('No API key received in configuration');
    }

    ORS_API_KEY = config.apiKey;
    console.log('API configuration loaded successfully');
    return true;
  } catch (error) {
    console.error('Error loading API configuration:', error);
    document.getElementById('distanceDisplay').textContent = `Configuration error: ${error.message}`;
    return false;
  }
}

async function calculateDistance(address) {
  // Check if API key is not configured
  if (!ORS_API_KEY) {
    document.getElementById('distanceDisplay').textContent = 'API not configured';
    return;
  }

  try {
    console.log('Calculating distance for location:', currentLocation);
    console.log('Using base coordinates:', BASE_LOCATION);
    
    // First, geocode the address to get coordinates
    const geocodeUrl = `https://api.openrouteservice.org/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(address)}`;
    const geocodeResponse = await fetch(geocodeUrl);
    if (!geocodeResponse.ok) {
      throw new Error('Geocoding failed');
    }
    const geocodeData = await geocodeResponse.json();

    if (!geocodeData.features || geocodeData.features.length === 0) {
      throw new Error('Address not found');
    }

    const [lng, lat] = geocodeData.features[0].geometry.coordinates;
    console.log('Destination coordinates:', [lng, lat]);

    // Calculate matrix distance
    const matrixBody = {
      locations: [BASE_LOCATION, [lng, lat]],
      metrics: ['distance'],
      units: 'mi'
    };
    console.log('Matrix API request body:', matrixBody);

    const response = await fetch(ORS_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': ORS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(matrixBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Matrix API error:', errorText);
      throw new Error('Distance calculation failed');
    }

    const data = await response.json();
    console.log('Matrix API response:', data);

    if (!data.distances || !data.distances[0] || typeof data.distances[0][1] !== 'number') {
      throw new Error('Invalid distance data received');
    }

    travelDistance = data.distances[0][1];
    
    // Update display
    const distanceDisplay = document.getElementById('distanceDisplay');
    distanceDisplay.textContent = `${travelDistance.toFixed(1)} miles ($${(travelDistance * RATE_PER_MILE).toFixed(2)})`;
    
    // Recalculate quote
    calculateQuote();
  } catch (error) {
    console.error('Error calculating distance:', error);
    document.getElementById('distanceDisplay').textContent = error.message || 'Error calculating distance';
    // Reset travel distance to 0 on error
    travelDistance = 0;
    calculateQuote();
  }
}

// Add event listener for address input
document.getElementById('eventAddress').addEventListener('change', (e) => {
  calculateDistance(e.target.value);
});

function initializeOptionCards() {
  ['sound', 'dj', 'visual', 'addon', 'water', 'fuel'].forEach(type => {
    document.querySelectorAll(`#${type}Options .option-card`).forEach(card => {
      card.addEventListener('click', () => {
        // Remove selection from other cards in the same group
        document.querySelectorAll(`#${type}Options .option-card`).forEach(c => 
          c.classList.remove('selected')
        );
        
        // Select clicked card
        card.classList.add('selected');
        selectedOptions[type] = card.dataset.value;

        // If selecting the bundle, automatically select Full Visuals and disable visual selection
        if (type === 'sound' && card.dataset.value === '350-4-20') {
          document.querySelectorAll('#visualOptions .option-card').forEach(c => {
            c.classList.remove('selected');
            c.style.opacity = '0.5';
            c.style.pointerEvents = 'none';
          });
          selectedOptions.visual = '0'; // Visual cost is included in bundle
        } else if (type === 'sound') {
          // Re-enable visual selection if not choosing bundle
          document.querySelectorAll('#visualOptions .option-card').forEach(c => {
            c.style.opacity = '1';
            c.style.pointerEvents = 'auto';
          });
        }

        // Show/hide water options based on addon selection
        if (type === 'addon') {
          const waterSection = document.getElementById('waterOptionsSection');
          const fuelSection = document.getElementById('fuelOptionsSection');
          
          // Show/hide water options for cooling packages
          if (card.dataset.value === '250-6-50' || card.dataset.value === '270-6-60') {
            waterSection.style.display = 'block';
          } else {
            waterSection.style.display = 'none';
            selectedOptions.water = '0';
            document.querySelectorAll('#waterOptions .option-card').forEach(c => 
              c.classList.remove('selected')
            );
          }
          
          // Show/hide fuel options for generator packages
          if (card.dataset.value === '250-8-40' || card.dataset.value === '270-6-60') {
            fuelSection.style.display = 'block';
          } else {
            fuelSection.style.display = 'none';
            selectedOptions.fuel = '0';
            document.querySelectorAll('#fuelOptions .option-card').forEach(c => 
              c.classList.remove('selected')
            );
          }
        }

        calculateQuote();
      });
    });

    // Select first option by default
    const firstCard = document.querySelector(`#${type}Options .option-card`);
    if (firstCard) firstCard.classList.add('selected');
  });
}

function calculateExtraHoursCost(baseValue, hours) {
  if (!baseValue || baseValue === '0') return 0;
  
  const [base, included, extra] = baseValue.split('-').map(Number);
  let extraHours = Math.max(0, hours - included);
  return extraHours > 0 ? extraHours * extra : 0;
}

function calculateQuote() {
  const hours = Number(document.getElementById('hoursSlider').value);
  
  // Calculate sound package cost
  const [soundBase] = selectedOptions.sound.split('-').map(Number);
  const soundExtra = calculateExtraHoursCost(selectedOptions.sound, hours);
  
  // Calculate visual cost (0 if bundle is selected)
  const visual = selectedOptions.sound === '350-4-20' ? 0 : Number(selectedOptions.visual);
  
  // Calculate DJ cost (hourly rate for all hours)
  const djRate = Number(selectedOptions.dj.split('-')[0]);
  const djCost = selectedOptions.dj.includes('-') ? djRate : (djRate > 0 ? djRate * hours : 0);
  
  // Calculate addon package cost
  const [addonBase] = selectedOptions.addon.split('-').map(Number) || [0];
  const addonExtra = calculateExtraHoursCost(selectedOptions.addon, hours);

  // Calculate water cost
  let waterCost = 0;
  if (selectedOptions.water !== '0') {
    const [baseWater, includedHours, hourlyRate] = selectedOptions.water.split('-').map(Number);
    if (includedHours === 0) {
      // Hourly rate option
      waterCost = hourlyRate * hours;
    } else {
      // Package rate option
      const extraHours = Math.max(0, hours - includedHours);
      waterCost = baseWater + (extraHours * hourlyRate);
    }
  }

  // Calculate fuel cost
  let fuelCost = 0;
  if (selectedOptions.fuel !== '0') {
    const [baseFuel, includedHours, hourlyRate] = selectedOptions.fuel.split('-').map(Number);
    if (includedHours === 0) {
      // Hourly rate option
      fuelCost = hourlyRate * hours;
    } else {
      // Package rate option
      const extraHours = Math.max(0, hours - includedHours);
      fuelCost = baseFuel + (extraHours * hourlyRate);
    }
  }

  // Calculate travel cost
  const travelCost = travelDistance * RATE_PER_MILE;
  
  // Calculate total
  const total = soundBase + soundExtra + visual + djCost + addonBase + addonExtra + waterCost + fuelCost + travelCost;
  const perHour = (total / hours).toFixed(2);

  // Update the display with cost breakdown
  const quoteResult = document.querySelector('#quoteResult');
  quoteResult.innerHTML = `
    <div class="total-amount">$${total.toFixed(2)}</div>
    <div class="cost-breakdown">
      <div class="breakdown-item">
        <span class="breakdown-label">Base Package:</span>
        <span>$${soundBase}</span>
      </div>
      ${soundExtra ? `
        <div class="breakdown-item">
          <span class="breakdown-label">Extra Hours:</span>
          <span>$${soundExtra}</span>
        </div>
      ` : ''}
      ${visual ? `
        <div class="breakdown-item">
          <span class="breakdown-label">Visuals:</span>
          <span>$${visual}</span>
        </div>
      ` : ''}
      ${djCost ? `
        <div class="breakdown-item">
          <span class="breakdown-label">DJ Services:</span>
          <span>$${djCost}</span>
        </div>
      ` : ''}
      ${addonBase + addonExtra ? `
        <div class="breakdown-item">
          <span class="breakdown-label">Add-ons:</span>
          <span>$${addonBase + addonExtra}</span>
        </div>
      ` : ''}
      ${waterCost ? `
        <div class="breakdown-item">
          <span class="breakdown-label">Water Service:</span>
          <span>$${waterCost}</span>
        </div>
      ` : ''}
      ${fuelCost ? `
        <div class="breakdown-item">
          <span class="breakdown-label">Fuel Service:</span>
          <span>$${fuelCost}</span>
        </div>
      ` : ''}
      ${travelCost ? `
        <div class="breakdown-item">
          <span class="breakdown-label">Travel Cost:</span>
          <span>$${travelCost.toFixed(2)}</span>
        </div>
      ` : ''}
    </div>
    <div class="per-hour">$${perHour} per hour</div>
  `;
}

// Initialize hours slider
const hoursSlider = document.getElementById('hoursSlider');
const hoursDisplay = document.getElementById('hoursDisplay');

hoursSlider.addEventListener('input', (e) => {
  const hours = e.target.value;
  hoursDisplay.innerText = `${hours} hour${hours === '1' ? '' : 's'}`;
  calculateQuote();
});

// Add location switcher functionality
function initializeLocationSwitcher() {
  document.querySelectorAll('#locationOptions .option-card').forEach(card => {
    card.addEventListener('click', () => {
      // Update selection UI
      document.querySelectorAll('#locationOptions .option-card').forEach(c => 
        c.classList.remove('selected')
      );
      card.classList.add('selected');

      // Update location
      currentLocation = card.dataset.location;
      BASE_LOCATION = LOCATIONS[currentLocation].base;
      RATE_PER_MILE = LOCATIONS[currentLocation].ratePerMile;

      // Update pricing
      updatePricingForLocation();

      // Recalculate if address is entered
      const address = document.getElementById('eventAddress').value;
      if (address) {
        calculateDistance(address);
      }
    });
  });
}

function updatePricingForLocation() {
  const pricing = LOCATIONS[currentLocation].pricing;
  
  // Update base location for distance calculations
  BASE_LOCATION = LOCATIONS[currentLocation].base;
  RATE_PER_MILE = LOCATIONS[currentLocation].ratePerMile;
  
  // Recalculate distance if an address is already entered
  const addressField = document.getElementById('eventAddress');
  if (addressField && addressField.value) {
    calculateDistance(addressField.value);
  }

  // Show/hide Chicago-specific package
  const chicagoPackage = document.querySelector('#soundOptions .chicago-only');
  if (chicagoPackage) {
    chicagoPackage.style.display = currentLocation === 'chicago' ? 'block' : 'none';
  }

  // Show/hide location-specific visual options
  document.querySelectorAll('#visualOptions .option-card').forEach(card => {
    if (currentLocation === 'chicago') {
      // For Chicago, only show "No Visuals" and the Chicago-specific basic option
      if (card.classList.contains('chicago-only') || card.dataset.value === '0') {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    } else {
      // For SA/ATX, show all except Chicago-specific options
      if (card.classList.contains('chicago-only')) {
        card.style.display = 'none';
      } else {
        card.style.display = 'block';
      }
    }
  });
  
  // Update sound package prices and details
  document.querySelectorAll('#soundOptions .option-card:not(.chicago-only)').forEach((card, index) => {
    const prices = currentLocation === 'chicago' ? 
      [pricing.sound.standard, pricing.sound.premium, pricing.sound.fullStack] :
      [pricing.sound.standard, pricing.sound.premium, pricing.sound.fullStack];
    
    if (prices[index]) {
      card.dataset.value = prices[index];
      const [base, hours, extra] = prices[index].split('-').map(Number);
      card.querySelector('.option-price').textContent = `$${base} base (${hours}hrs)`;
      card.querySelector('.option-extra').textContent = `+$${extra}/hr after`;
      
      // Toggle visibility of location-specific details
      const saDetails = card.querySelector('.sa-atx-details');
      const chicagoDetails = card.querySelector('.chicago-details');
      if (saDetails && chicagoDetails) {
        saDetails.style.display = currentLocation === 'sa-atx' ? 'block' : 'none';
        chicagoDetails.style.display = currentLocation === 'chicago' ? 'block' : 'none';
      }
    }
  });

  // Update Chicago-only package if visible
  if (currentLocation === 'chicago' && chicagoPackage) {
    const wallOfBassPrice = pricing.sound.wallOfBass;
    const [base, hours, extra] = wallOfBassPrice.split('-').map(Number);
    chicagoPackage.dataset.value = wallOfBassPrice;
    chicagoPackage.querySelector('.option-price').textContent = `$${base} base (${hours}hrs)`;
    chicagoPackage.querySelector('.option-extra').textContent = `+$${extra}/hr after`;
  }

  // Update DJ prices
  document.querySelectorAll('#djOptions .option-card').forEach((card, index) => {
    const prices = [pricing.dj.none, pricing.dj.professional, pricing.dj.powerHour];
    if (prices[index]) {
      card.dataset.value = prices[index];
      if (index === 1) { // Professional DJ
        card.querySelector('.option-price').textContent = `$${prices[index]}/hr`;
      } else if (index === 2) { // Power Hour
        const [base] = prices[index].split('-').map(Number);
        card.querySelector('.option-price').textContent = `$${base} flat`;
      }
    }
  });

  // Update visual prices
  document.querySelectorAll('#visualOptions .option-card').forEach((card, index) => {
    const prices = [pricing.visual.none, pricing.visual.basic, pricing.visual.premium, pricing.visual.immersive];
    if (prices[index]) {
      card.dataset.value = prices[index];
      card.querySelector('.option-price').textContent = `$${prices[index]}`;
    }
  });

  // Reset selections to first option in each category
  ['sound', 'dj', 'visual', 'addon', 'water', 'fuel'].forEach(type => {
    const firstCard = document.querySelector(`#${type}Options .option-card`);
    if (firstCard) {
      document.querySelectorAll(`#${type}Options .option-card`).forEach(c => 
        c.classList.remove('selected')
      );
      firstCard.classList.add('selected');
      selectedOptions[type] = firstCard.dataset.value;
    }
  });

  // Recalculate quote
  calculateQuote();
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
  initializeApiKey();
  initializeLocationSwitcher();
  initializeOptionCards();
}); 