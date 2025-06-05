let selectedOptions = {
  sound: '250-4-40',
  dj: '0',
  visual: '0',
  addon: '0',
  water: '0',
  fuel: '0'
};

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
  
  // Calculate total
  const total = soundBase + soundExtra + visual + djCost + addonBase + addonExtra + waterCost + fuelCost;
  const perHour = (total / hours).toFixed(2);

  document.querySelector('#quoteResult .total-amount').innerText = `$${total}`;
  document.querySelector('#quoteResult .per-hour').innerText = `$${perHour} per hour`;
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
initializeOptionCards();
calculateQuote(); 