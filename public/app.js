let selectedOptions = {
  sound: '250-4-40',
  dj: '0',
  visual: '0',
  addon: '0',
  water: '0',
  fuel: '0'
};

// Base location (78260 - San Antonio area)
const BASE_LOCATION = [-98.4573, 29.7079]; // San Antonio, TX (78260) coordinates
const RATE_PER_MILE = 0.65;
let travelDistance = 0;

// OpenRouteService API configuration
let ORS_API_KEY = null;
const ORS_API_URL = 'https://api.openrouteservice.org/v2/matrix/driving-car';

// Fetch API key from server
async function initializeApiKey() {
  try {
    // Get the current hostname
    const hostname = window.location.origin;
    const response = await fetch(`${hostname}/api/config`);
    
    if (!response.ok) {
      throw new Error('Failed to load configuration');
    }
    const config = await response.json();
    if (config.error) {
      throw new Error(config.message || 'API configuration error');
    }
    ORS_API_KEY = config.apiKey;
    console.log('API configuration loaded');
    return true;
  } catch (error) {
    console.error('Error loading API configuration:', error);
    document.getElementById('distanceDisplay').textContent = 'API configuration error';
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

    // Calculate matrix distance
    const response = await fetch(ORS_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': ORS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        locations: [BASE_LOCATION, [lng, lat]],
        metrics: ['distance'],
        units: 'mi'
      })
    });

    if (!response.ok) {
      throw new Error('Distance calculation failed');
    }

    const data = await response.json();
    travelDistance = data.distances[0][1];
    
    // Update display
    const distanceDisplay = document.getElementById('distanceDisplay');
    distanceDisplay.textContent = `${travelDistance.toFixed(1)} miles ($${(travelDistance * RATE_PER_MILE).toFixed(2)})`;
    
    // Recalculate quote
    calculateQuote();
  } catch (error) {
    console.error('Error calculating distance:', error);
    document.getElementById('distanceDisplay').textContent = error.message || 'Error calculating distance';
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

// Initialize the calculator
initializeApiKey().then(() => {
  initializeOptionCards();
  calculateQuote();
}); 