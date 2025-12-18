document.addEventListener("DOMContentLoaded", function() {
    console.log('Deal Placement Page Loaded');
    
    let placements = JSON.parse(localStorage.getItem('placements')) || [];
    let currentDeal = null;
    let currentEditId = null;

    // Initialize immediately
    initializePage();

    function initializePage() {
        console.log('Initializing placement page...');
        
        // Get deal ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const dealId = urlParams.get('dealId');
        
        if (dealId) {
            console.log('Deal ID found:', dealId);
            document.getElementById('currentDealId').textContent = dealId;
            loadDealData(dealId);
            loadPlacements();
            setupCalculations();
            setupEventListeners();
        } else {
            alert('No deal ID provided!');
            window.location.href = 'deal-generation.html';
        }
    }

    function setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Add Placement Button
        const addPlacementBtn = document.getElementById('addPlacementBtn');
        if (addPlacementBtn) {
            addPlacementBtn.addEventListener('click', function() {
                console.log('Add Placement button clicked!');
                currentEditId = null;
                resetPlacementForm();
                document.getElementById('placementPopup').style.display = 'flex';
            });
        }

        // Cancel Button
        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                document.getElementById('placementPopup').style.display = 'none';
            });
        }

        // Form Submission
        const placementForm = document.getElementById('placementForm');
        if (placementForm) {
            placementForm.addEventListener('submit', function(e) {
                e.preventDefault();
                savePlacement(false);
            });
        }

        // Save & Exit Button
        const saveExitBtn = document.getElementById('saveExitBtn');
        if (saveExitBtn) {
            saveExitBtn.addEventListener('click', function(e) {
                e.preventDefault();
                savePlacement(false);
            });
        }

        // Save & Continue Button
        const saveContinueBtn = document.getElementById('saveContinueBtn');
        if (saveContinueBtn) {
            saveContinueBtn.addEventListener('click', function(e) {
                e.preventDefault();
                savePlacement(true);
            });
        }

        // Back to Deals Button
        const backToDealsBtn = document.getElementById('backToDeals');
        if (backToDealsBtn) {
            backToDealsBtn.addEventListener('click', function() {
                console.log('Back to deals clicked');
                window.location.href = 'deal-generation.html';
            });
        }
    }

    function loadDealData(dealId) {
        const deals = JSON.parse(localStorage.getItem('deals')) || [];
        currentDeal = deals.find(deal => deal.id === dealId);
        
        if (currentDeal) {
            console.log('Deal loaded:', currentDeal);
            
            // Populate deal information display
            const displayFields = {
                'dealNameDisplay': 'dealName',
                'clientNameDisplay': 'clientName',
                'dealTypeDisplay': 'dealType',
                'bookedRevenueDisplay': 'bookedRevenueDealCurrency',
                'verticalDisplay': 'vertical',
                'brandNameDisplay': 'brandName',
                'salesGroupDisplay': 'salesGroup',
                'execRevenueDisplay': 'bookedRevenueExecCurrency',
                'agencyNameDisplay': 'agencyName',
                'advertiserNameDisplay': 'advertiserName',
                'productCategoryDisplay': 'productCategory',
                'startDateDisplay': 'startDate',
                'channelNameDisplay': 'channelName',
                'endDateDisplay': 'endDate',
                'plantDisplay': 'plant',
                'zoneDisplay': 'zone'
            };

            Object.keys(displayFields).forEach(displayId => {
                const element = document.getElementById(displayId);
                if (element) {
                    const dealField = displayFields[displayId];
                    if (dealField.includes('Revenue')) {
                        element.value = formatCurrency(currentDeal[dealField]) || '';
                    } else if (dealField.includes('Date')) {
                        element.value = currentDeal[dealField] ? currentDeal[dealField].split('T')[0] : '';
                    } else {
                        element.value = currentDeal[dealField] || '';
                    }
                }
            });

            // Set dropdowns in placement form with multiple options
            populateMultipleSelect('clientName', currentDeal.clientName);
            populateMultipleSelect('brandName', currentDeal.brandName);
            
            // Set other readonly fields in placement form
            document.getElementById('productCategory').value = currentDeal.productCategory || '';
            document.getElementById('channelName').value = currentDeal.channelName || '';
        } else {
            console.error('Deal not found for ID:', dealId);
        }
    }

    // NEW FUNCTION: Populate dropdowns from comma-separated values
    function populateMultipleSelect(selectId, values) {
        console.log(`Populating ${selectId} with values:`, values);
        
        if (!values) {
            console.log('No values provided for', selectId);
            return;
        }
        
        const select = document.getElementById(selectId);
        if (!select) {
            console.log('Select element not found:', selectId);
            return;
        }
        
        // Clear existing options except the first one
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        // Split comma-separated values and add as options
        const valueArray = values.split(',').map(v => v.trim()).filter(v => v !== '');
        console.log('Value array:', valueArray);
        
        valueArray.forEach(value => {
            if (value && value !== '') {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = value;
                select.appendChild(option);
            }
        });
        
        // Select the first option by default
        if (select.options.length > 1) {
            select.selectedIndex = 1;
        }
        
        console.log(`Populated ${selectId} with ${select.options.length} options`);
    }

    function setupCalculations() {
        const bookedQuantity = document.getElementById('bookedQuantity');
        const rate = document.getElementById('rate');
        
        if (bookedQuantity && rate) {
            bookedQuantity.addEventListener('input', calculatePlacementDetails);
            rate.addEventListener('input', calculatePlacementDetails);
        }
    }

    function calculatePlacementDetails() {
        const bookedQuantity = parseInt(document.getElementById('bookedQuantity').value) || 0;
        const rate = parseFloat(document.getElementById('rate').value) || 0;
        
        const totalSpots = Math.floor(bookedQuantity);
        const bookedRevenue = bookedQuantity * rate;
        
        document.getElementById('totalSpots').value = totalSpots;
        document.getElementById('bookedRevenue').value = bookedRevenue.toFixed(2);
        
        generatePlacementName();
    }

    function generatePlacementName() {
        if (!currentDeal) return;
        
        const brand = document.getElementById('brandName').value || '';
        const channel = currentDeal.channelName || '';
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const buyType = document.getElementById('buyType').value;
        const adFormat = document.getElementById('adFormat').value;
        
        if (brand && channel && startDate && endDate && buyType && adFormat) {
            const start = new Date(startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
            const end = new Date(endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
            const placementName = `${brand}_${channel}_${buyType}_${adFormat}_${start}-${end}`;
            document.getElementById('autoPlacementName').value = placementName;
        }
    }

    function savePlacement(continueAdding) {
        if (!validatePlacementForm()) {
            alert('Please fill all required fields correctly.');
            return;
        }

        const formData = {
            billingType: 'Standard',
            adServer: document.getElementById('adServer').value,
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            clientName: document.getElementById('clientName').value,
            brandName: document.getElementById('brandName').value,
            productCategory: document.getElementById('productCategory').value,
            channelName: document.getElementById('channelName').value,
            buyType: document.getElementById('buyType').value,
            adFormat: document.getElementById('adFormat').value,
            spotType: document.getElementById('spotType').value,
            platform: document.getElementById('platform').value,
            timeBandStart: document.getElementById('timeBandStart').value,
            timeBandEnd: document.getElementById('timeBandEnd').value,
            restricted: document.getElementById('restricted').value,
            restrictedTimeStart: document.getElementById('restrictedTimeStart').value,
            restrictedTimeEnd: document.getElementById('restrictedTimeEnd').value,
            duration: document.getElementById('duration').value,
            creativeId: getSelectedValues('creativeId'),
            bookedQuantity: document.getElementById('bookedQuantity').value,
            rate: document.getElementById('rate').value,
            totalSpots: document.getElementById('totalSpots').value,
            bookedRevenue: document.getElementById('bookedRevenue').value,
            roNumber: document.getElementById('roNumber').value,
            stream: document.getElementById('stream').value,
            materialNumber: document.getElementById('materialNumber').value,
            targeting: document.getElementById('targeting').value,
            campaignManager: document.getElementById('campaignManager').value,
            placementComments: document.getElementById('placementComments').value,
            placementName: document.getElementById('autoPlacementName').value,
            status: 'Active',
            deliveredRevenue: '0',
            balanceRevenue: document.getElementById('bookedRevenue').value,
            deliveredQuantity: '0',
            remainingQuantity: document.getElementById('totalSpots').value,
            updatedBy: 'Current User',
            createdBy: 'Current User',
            dealCurrency: currentDeal.dealCurrency || 'INR',
            executionCurrency: currentDeal.executionCurrency || 'INR',
            conversionRate: currentDeal.conversionRate || '1'
        };

        if (currentEditId) {
            const index = placements.findIndex(placement => placement.id === currentEditId);
            if (index !== -1) {
                placements[index] = { 
                    ...placements[index], 
                    ...formData,
                    updatedDate: new Date().toISOString()
                };
            }
        } else {
            const newPlacement = {
                id: 'PL-' + Date.now(),
                dealId: currentDeal.id,
                ...formData,
                createdDate: new Date().toISOString(),
                updatedDate: new Date().toISOString()
            };
            placements.push(newPlacement);
        }

        localStorage.setItem('placements', JSON.stringify(placements));
        loadPlacements();
        
        if (!continueAdding) {
            document.getElementById('placementPopup').style.display = 'none';
        } else {
            resetPlacementForm();
        }
        
        alert(currentEditId ? 'Placement updated successfully!' : 'Placement created successfully!');
    }

    function validatePlacementForm() {
        const requiredFields = [
            'adServer', 'startDate', 'endDate', 'buyType', 'adFormat', 
            'clientName', 'brandName', 'spotType', 'platform', 'timeBandStart', 'timeBandEnd', 
            'restricted', 'restrictedTimeStart', 'restrictedTimeEnd', 
            'duration', 'bookedQuantity', 'rate'
        ];
        
        for (let field of requiredFields) {
            const element = document.getElementById(field);
            if (!element || !element.value.trim()) {
                alert(`Please fill ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
                if (element) element.focus();
                return false;
            }
        }
        
        const creativeSelect = document.getElementById('creativeId');
        const selectedCreatives = getSelectedValues('creativeId');
        if (!selectedCreatives) {
            alert('Please select at least one Creative ID');
            creativeSelect.focus();
            return false;
        }
        
        return true;
    }

    function getSelectedValues(selectId) {
        const select = document.getElementById(selectId);
        const selected = [];
        for (let i = 0; i < select.options.length; i++) {
            if (select.options[i].selected) {
                selected.push(select.options[i].value);
            }
        }
        return selected.join(', ');
    }

   function resetPlacementForm() {
    const placementForm = document.getElementById('placementForm');
    if (placementForm) {
        placementForm.reset();
    }
    document.getElementById('billingType').value = 'Standard';
    document.getElementById('restricted').value = 'No';
    document.getElementById('totalSpots').value = '';
    document.getElementById('bookedRevenue').value = '';
    document.getElementById('autoPlacementName').value = '';
    
    // FIX: Reset client and brand dropdowns properly
    const clientSelect = document.getElementById('clientName');
    const brandSelect = document.getElementById('brandName');
    if (clientSelect && clientSelect.options.length > 0) clientSelect.selectedIndex = 0;
    if (brandSelect && brandSelect.options.length > 0) brandSelect.selectedIndex = 0;
    
    currentEditId = null;
}
    function loadPlacements() {
        if (!currentDeal) return;
        
        const dealPlacements = placements.filter(placement => placement.dealId === currentDeal.id);
        const placementTableBody = document.getElementById('placementTableBody');
        
        if (!placementTableBody) return;
        
        placementTableBody.innerHTML = '';
        
        if (dealPlacements.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="42" style="text-align: center; padding: 20px;">No placements found. Click "Add Placement" to create one.</td>`;
            placementTableBody.appendChild(row);
            return;
        }
        
        dealPlacements.forEach(placement => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <button class="edit-btn" onclick="window.editPlacement('${placement.id}')">Edit</button>
                </td>
                <td>
                    <button class="book-now-btn" onclick="window.openBookingGrid('${placement.id}')">Book Now</button>
                </td>
                <td>
                    <a href="javascript:void(0)" onclick="window.viewPlacementDetails('${placement.id}')" class="deal-link">${placement.id}</a>
                </td>
                <td>${placement.placementName || 'N/A'}</td>
                <td>${placement.channelName}</td>
                <td>${formatDate(placement.startDate)}</td>
                <td>${formatDate(placement.endDate)}</td>
                <td>${formatCurrency(placement.bookedRevenue)}</td>
                <td>${formatCurrency(placement.deliveredRevenue)}</td>
                <td>${formatCurrency(placement.balanceRevenue)}</td>
                <td>${placement.bookedQuantity}</td>
                <td>${placement.deliveredQuantity}</td>
                <td>${placement.remainingQuantity}</td>
                <td>${placement.billingType}</td>
                <td><span class="status-badge active">${placement.status}</span></td>
                <td>${placement.adServer}</td>
                <td>${placement.clientName}</td>
                <td>${placement.brandName}</td>
                <td>${placement.productCategory}</td>
                <td>${placement.buyType}</td>
                <td>${placement.adFormat}</td>
                <td>${placement.spotType}</td>
                <td>${placement.platform}</td>
                <td>${placement.stream || 'N/A'}</td>
                <td>${placement.materialNumber || 'N/A'}</td>
                <td>${placement.targeting || 'N/A'}</td>
                <td>${placement.roNumber || 'N/A'}</td>
                <td>${formatCurrency(placement.rate)}</td>
                <td>${placement.dealCurrency || 'INR'}</td>
                <td>${formatCurrency(placement.rate)}</td>
                <td>${placement.conversionRate || '1'}</td>
                <td>${formatCurrency(placement.bookedRevenue)}</td>
                <td>${placement.totalSpots}</td>
                <td>${formatCurrency(placement.deliveredRevenue)}</td>
                <td>${placement.placementComments || 'N/A'}</td>
                <td>
                    <button class="copy-btn" onclick="window.copyPlacement('${placement.id}')">Copy</button>
                </td>
                <td>
                    <button class="delete-btn" onclick="window.deletePlacement('${placement.id}')">Delete</button>
                </td>
                <td>
                    <button class="attach-btn" onclick="window.attachFiles('${placement.id}')">Attach</button>
                </td>
                <td>${placement.updatedBy || 'System'}</td>
                <td>${formatDateTime(placement.updatedDate)}</td>
                <td>${placement.createdBy || 'System'}</td>
                <td>${formatDateTime(placement.createdDate)}</td>
            `;
            placementTableBody.appendChild(row);
        });
    }

    // Global functions
    window.editPlacement = function(placementId) {
    console.log('Editing placement:', placementId);
    const placement = placements.find(p => p.id === placementId);
    if (placement) {
        currentEditId = placementId;
        
        document.getElementById('adServer').value = placement.adServer || '';
        document.getElementById('startDate').value = placement.startDate || '';
        document.getElementById('endDate').value = placement.endDate || '';
        
        // FIX: Set dropdown values correctly
        const clientSelect = document.getElementById('clientName');
        const brandSelect = document.getElementById('brandName');
        
        // Set client dropdown
        for (let i = 0; i < clientSelect.options.length; i++) {
            if (clientSelect.options[i].value === placement.clientName) {
                clientSelect.selectedIndex = i;
                break;
            }
        }
        
        // Set brand dropdown  
        for (let i = 0; i < brandSelect.options.length; i++) {
            if (brandSelect.options[i].value === placement.brandName) {
                brandSelect.selectedIndex = i;
                break;
            }
        }
        
        document.getElementById('buyType').value = placement.buyType || '';
        document.getElementById('adFormat').value = placement.adFormat || '';
        document.getElementById('spotType').value = placement.spotType || '';
        document.getElementById('platform').value = placement.platform || '';
        document.getElementById('timeBandStart').value = placement.timeBandStart || '';
        document.getElementById('timeBandEnd').value = placement.timeBandEnd || '';
        document.getElementById('restricted').value = placement.restricted || 'No';
        document.getElementById('restrictedTimeStart').value = placement.restrictedTimeStart || '';
        document.getElementById('restrictedTimeEnd').value = placement.restrictedTimeEnd || '';
        document.getElementById('duration').value = placement.duration || '';
        document.getElementById('bookedQuantity').value = placement.bookedQuantity || '';
        document.getElementById('rate').value = placement.rate || '';
        document.getElementById('roNumber').value = placement.roNumber || '';
        document.getElementById('stream').value = placement.stream || '';
        document.getElementById('materialNumber').value = placement.materialNumber || '';
        document.getElementById('targeting').value = placement.targeting || '';
        document.getElementById('campaignManager').value = placement.campaignManager || '';
        document.getElementById('placementComments').value = placement.placementComments || '';
        document.getElementById('autoPlacementName').value = placement.placementName || '';
        
        document.getElementById('totalSpots').value = placement.totalSpots || '';
        document.getElementById('bookedRevenue').value = placement.bookedRevenue || '';
        
        const creativeSelect = document.getElementById('creativeId');
        if (creativeSelect && placement.creativeId) {
            const valueArray = placement.creativeId.split(',').map(v => v.trim());
            for (let i = 0; i < creativeSelect.options.length; i++) {
                creativeSelect.options[i].selected = valueArray.includes(creativeSelect.options[i].value);
            }
        }
        
        document.getElementById('placementPopup').style.display = 'flex';
    }
};

    window.openBookingGrid = function(placementId) {
    console.log('Opening booking grid for:', placementId);
    const placement = placements.find(p => p.id === placementId);
    
    if (placement) {
        // FIX: Use placement start and end dates instead of current date
        const startDate = new Date(placement.startDate);
        const endDate = new Date(placement.endDate);
        const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        
        const dates = generateDateRange(startDate, days);
        const dealPlacements = placements.filter(p => p.dealId === currentDeal.id);
        const placementOptions = dealPlacements.map(p => 
            `<option value="${p.id}" ${p.id === placementId ? 'selected' : ''}>${p.id}</option>`
        ).join('');
        
        const bookingGridHtml = `
            <div class="popup" style="max-width: 95%; width: 95%;">
                <h3>Booking Grid - ${placementId}</h3>
                <div style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
                    <strong>Placement Period:</strong> ${formatDate(placement.startDate)} to ${formatDate(placement.endDate)} (${days} days)
                </div>
                <div class="table-container">
                    <table class="booking-table">
                        <thead>
                            <tr>
                                <th>Remove</th>
                                <th>Copy</th>
                                <th>Placement</th>
                                <th>Duration</th>
                                <th>Creative</th>
                                <th>Time Band</th>
                                <th>Distribution Type</th>
                                <th>Playlist</th>
                                <th>Total Spots</th>
                                <th>Priority</th>
                                ${dates.map(date => `<th>${formatBookingDate(date)}</th>`).join('')}
                                <th>Total Sec</th>
                                <th>Rate</th>
                                <th>Total Amount (Rs.)</th>
                            </tr>
                        </thead>
                        <tbody id="bookingGridBody">
                            <tr>
                                <td><button class="remove-btn" onclick="window.removeBookingRow(this)">×</button></td>
                                <td><button class="copy-btn" onclick="window.copyBookingRow(this)">Copy</button></td>
                                <td>
                                    <select class="placement-select">
                                        ${placementOptions}
                                    </select>
                                </td>
                                <td>
                                    <select class="duration-select">
                                        <option value="10">10</option>
                                        <option value="15">15</option>
                                        <option value="20">20</option>
                                        <option value="30">30</option>
                                    </select>
                                </td>
                                <td>
                                    <select class="creative-select">
                                        <option value="CYM015">CYM015</option>
                                        <option value="CYM016">CYM016</option>
                                        <option value="CYM017">CYM017</option>
                                    </select>
                                </td>
                                <td>
                                    <select class="timeband-select">
                                        <option value="6AM-12PM">6AM-12PM</option>
                                        <option value="12PM-6PM">12PM-6PM</option>
                                        <option value="6PM-12AM">6PM-12AM</option>
                                    </select>
                                </td>
                                <td>
                                    <select class="distribution-type-select">
                                        <option value="Even">Even</option>
                                        <option value="ODD">Odd</option>
                                        <option value="Weekends">Week ends</option>
                                        <option value="WeekDays">Week Days</option>
                                    </select>
                                </td>
                                <td>
                                    <select class="playlist-select">
                                        <option value="Prime Time">Prime Time</option>
                                        <option value="Day Time">Day Time</option>
                                        <option value="Weekend">Weekend</option>
                                        <option value="Special">Special</option>
                                        <option value="Custom">Custom</option>
                                    </select>
                                </td>
                                <td><input type="number" class="total-spots-input" value="0" min="0" readonly></td>
                                <td><input type="number" class="priority-input" value="1" min="1"></td>
                                ${dates.map(() => `<td><input type="number" class="day-spot-input" value="0" min="0"></td>`).join('')}
                                <td class="total-sec">0</td>
                                <td><input type="number" class="rate-input" value="${placement.rate || '0'}" min="0" step="0.01"></td>
                                <td class="total-amount">0.00</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="buttons-row">
                    <button class="btn-primary" onclick="window.addBookingRow()">Add Row</button>
                    <button class="btn-save" onclick="window.saveBookingGrid('${currentDeal.id}')">Save</button>
                    <button class="btn-cancel" onclick="window.closePopup()">Cancel</button>
                </div>
            </div>
        `;
        
        const popup = document.createElement('div');
        popup.className = 'overlay';
        popup.style.display = 'flex';
        popup.innerHTML = bookingGridHtml;
        document.body.appendChild(popup);
        
        setupBookingCalculations();
    }
};

    // Booking Grid Functions
    function generateDateRange(startDate, days) {
        const dates = [];
        for (let i = 0; i < days; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            dates.push(date);
        }
        return dates;
    }

    function formatBookingDate(date) {
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }

    function setupBookingCalculations() {
        const inputs = document.querySelectorAll('.day-spot-input, .rate-input');
        inputs.forEach(input => {
            input.addEventListener('input', calculateBookingRow);
        });
        
        const durationSelects = document.querySelectorAll('.duration-select');
        durationSelects.forEach(select => {
            select.addEventListener('change', calculateBookingRow);
        });
    }

    function calculateBookingRow(event) {
        const row = event.target.closest('tr');
        if (!row) return;
        
        const dayInputs = row.querySelectorAll('.day-spot-input');
        const rateInput = row.querySelector('.rate-input');
        const durationSelect = row.querySelector('.duration-select');
        const totalSecCell = row.querySelector('.total-sec');
        const totalAmountCell = row.querySelector('.total-amount');
        const totalSpotsInput = row.querySelector('.total-spots-input');
        
        let totalSpots = 0;
        dayInputs.forEach(input => {
            totalSpots += parseInt(input.value) || 0;
        });
        
        const duration = parseInt(durationSelect.value) || 0;
        const rate = parseFloat(rateInput.value) || 0;
        const totalSeconds = totalSpots * duration;
        const totalAmount = totalSeconds * rate;
        
        totalSpotsInput.value = totalSpots;
        totalSecCell.textContent = totalSeconds;
        totalAmountCell.textContent = totalAmount.toFixed(2);
    }

   window.addBookingRow = function() {
    const tbody = document.getElementById('bookingGridBody');
    const firstRow = tbody.querySelector('tr');
    
    if (firstRow) {
        const dealPlacements = placements.filter(p => p.dealId === currentDeal.id);
        const placementOptions = dealPlacements.map(p => 
            `<option value="${p.id}">${p.id}</option>`
        ).join('');
        
        const newRow = firstRow.cloneNode(true);
        newRow.querySelectorAll('input').forEach(input => {
            if (input.type === 'number') input.value = '0';
        });
        newRow.querySelector('.total-sec').textContent = '0';
        newRow.querySelector('.total-amount').textContent = '0.00';
        newRow.querySelector('.placement-select').innerHTML = placementOptions;
        tbody.appendChild(newRow);
        
        setupBookingCalculations();
    }
};
    window.removeBookingRow = function(button) {
        const row = button.closest('tr');
        if (row && document.querySelectorAll('#bookingGridBody tr').length > 1) {
            row.remove();
        }
    };

    window.copyBookingRow = function(button) {
        const row = button.closest('tr');
        if (row) {
            const newRow = row.cloneNode(true);
            row.parentNode.appendChild(newRow);
            setupBookingCalculations();
        }
    };

    window.saveBookingGrid = function(dealId) {
    const bookingData = [];
    const rows = document.querySelectorAll('#bookingGridBody tr');
    
    rows.forEach(row => {
        const rowData = {
            placement: row.querySelector('.placement-select').value,
            duration: row.querySelector('.duration-select').value,
            creative: row.querySelector('.creative-select').value,
            timeBand: row.querySelector('.timeband-select').value,
            distributionType: row.querySelector('.distribution-type-select').value,
            playlist: row.querySelector('.playlist-select').value,
            totalSpots: row.querySelector('.total-spots-input').value,
            priority: row.querySelector('.priority-input').value,
            dailySpots: Array.from(row.querySelectorAll('.day-spot-input')).map(input => input.value),
            rate: row.querySelector('.rate-input').value,
            totalAmount: row.querySelector('.total-amount').textContent
        };
        bookingData.push(rowData);
    });
    
    let allBookings = JSON.parse(localStorage.getItem('bookings')) || {};
    allBookings[dealId] = bookingData;
    localStorage.setItem('bookings', JSON.stringify(allBookings));
    
    console.log('Booking data saved:', allBookings);
    alert('Booking grid saved successfully!');
    window.closePopup();
};

    window.viewPlacementDetails = function(placementId) {
        const placement = placements.find(p => p.id === placementId);
        if (placement) {
            const detailsHtml = `
                <div class="popup">
                    <h3>Placement Details - ${placement.id}</h3>
                    <div class="details-grid">
                        <div class="detail-item"><label>Placement ID:</label><span>${placement.id}</span></div>
                        <div class="detail-item"><label>Placement Name:</label><span>${placement.placementName || 'N/A'}</span></div>
                        <div class="detail-item"><label>Channel Name:</label><span>${placement.channelName}</span></div>
                        <div class="detail-item"><label>Start Date:</label><span>${formatDate(placement.startDate)}</span></div>
                        <div class="detail-item"><label>End Date:</label><span>${formatDate(placement.endDate)}</span></div>
                        <div class="detail-item"><label>Client Name:</label><span>${placement.clientName}</span></div>
                        <div class="detail-item"><label>Brand Name:</label><span>${placement.brandName}</span></div>
                        <div class="detail-item"><label>Product Category:</label><span>${placement.productCategory}</span></div>
                        <div class="detail-item"><label>Buy Type:</label><span>${placement.buyType}</span></div>
                        <div class="detail-item"><label>Ad Format:</label><span>${placement.adFormat}</span></div>
                        <div class="detail-item"><label>Spot Type:</label><span>${placement.spotType}</span></div>
                        <div class="detail-item"><label>Platform:</label><span>${placement.platform}</span></div>
                        <div class="detail-item"><label>Ad Server:</label><span>${placement.adServer}</span></div>
                        <div class="detail-item"><label>Billing Type:</label><span>${placement.billingType}</span></div>
                        <div class="detail-item"><label>Duration:</label><span>${placement.duration} seconds</span></div>
                        <div class="detail-item"><label>Time Band:</label><span>${placement.timeBandStart} - ${placement.timeBandEnd}</span></div>
                        <div class="detail-item"><label>Restricted:</label><span>${placement.restricted}</span></div>
                        <div class="detail-item"><label>Restricted Time Band:</label><span>${placement.restrictedTimeStart} - ${placement.restrictedTimeEnd}</span></div>
                        <div class="detail-item"><label>Creative ID:</label><span>${placement.creativeId}</span></div>
                        <div class="detail-item"><label>Booked Quantity:</label><span>${placement.bookedQuantity} seconds</span></div>
                        <div class="detail-item"><label>Total Spots:</label><span>${placement.totalSpots}</span></div>
                        <div class="detail-item"><label>Rate:</label><span>${formatCurrency(placement.rate)}</span></div>
                        <div class="detail-item"><label>Booked Revenue:</label><span>${formatCurrency(placement.bookedRevenue)}</span></div>
                        <div class="detail-item"><label>Status:</label><span class="status-badge active">${placement.status}</span></div>
                    </div>
                    <div class="buttons-row">
                        <button onclick="window.closePopup()" class="btn-cancel">Close</button>
                    </div>
                </div>
            `;
            
            const popup = document.createElement('div');
            popup.className = 'overlay';
            popup.style.display = 'flex';
            popup.innerHTML = detailsHtml;
            document.body.appendChild(popup);
        }
    };

    window.copyPlacement = function(placementId) {
        const placement = placements.find(p => p.id === placementId);
        if (placement) {
            const newPlacement = {
                ...placement,
                id: 'PL-' + Date.now(),
                placementName: placement.placementName + ' - Copy',
                createdDate: new Date().toISOString(),
                updatedDate: new Date().toISOString()
            };
            placements.push(newPlacement);
            localStorage.setItem('placements', JSON.stringify(placements));
            loadPlacements();
            alert('Placement copied successfully!');
        }
    };

    window.deletePlacement = function(placementId) {
        if (confirm('Are you sure you want to delete this placement?')) {
            placements = placements.filter(p => p.id !== placementId);
            localStorage.setItem('placements', JSON.stringify(placements));
            loadPlacements();
            alert('Placement deleted successfully!');
        }
    };

    window.attachFiles = function(placementId) {
        alert('File attachment functionality for placement: ' + placementId);
    };

    window.closePopup = function() {
        const popup = document.querySelector('.overlay');
        if (popup) {
            popup.remove();
        }
    };

    // Utility functions
    function formatDate(dateString) {
        if (!dateString) return '';
        try {
            return new Date(dateString).toLocaleDateString('en-IN');
        } catch (e) {
            return dateString;
        }
    }

    function formatDateTime(dateString) {
        if (!dateString) return '';
        try {
            return new Date(dateString).toLocaleString('en-IN');
        } catch (e) {
            return dateString;
        }
    }

    function formatCurrency(amount) {
        if (!amount) return '0.00';
        return parseFloat(amount).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
});