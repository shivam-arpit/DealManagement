document.addEventListener("DOMContentLoaded", () => {
  let deals = JSON.parse(localStorage.getItem('deals')) || [];
  let currentEditId = null;

  const createDealBtn = document.getElementById('createDealBtn');
  const dealPopup = document.getElementById('dealPopup');
  const dealCancelBtn = document.getElementById('dealCancelBtn');
  const dealForm = document.getElementById('dealForm');
  const dealsTableBody = document.getElementById('dealsTableBody');
  const popupTitle = document.getElementById('popupTitle');
  const saveContinuePlacementBtn = document.getElementById('saveContinuePlacementBtn');

  // Initialize
  renderDeals();
  setupRevenueCalculations();

  // Event Listeners
  createDealBtn.addEventListener('click', () => {
    currentEditId = null;
    popupTitle.textContent = 'Create New Deal';
    dealForm.reset();
    document.getElementById('executionCurrency').value = 'INR';
    document.getElementById('conversionRate').value = '1';
    document.getElementById('bookedRevenueDealCurrency').value = '';
    document.getElementById('bookedRevenueExecCurrency').value = '';
    dealPopup.style.display = 'flex';
  });

  dealCancelBtn.addEventListener('click', () => {
    dealPopup.style.display = 'none';
  });

  dealForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveDeal();
  });

  saveContinuePlacementBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (saveDeal()) {
      // Open placement page after successful save
      window.open(`deal-placement.html?dealId=${currentEditId}`, '_blank');
    }
  });

  function setupRevenueCalculations() {
    // Calculate revenues when booked revenue or conversion rate changes
    document.getElementById('bookedRevenue').addEventListener('input', calculateRevenues);
    document.getElementById('conversionRate').addEventListener('input', calculateRevenues);
    document.getElementById('dealCurrency').addEventListener('change', calculateRevenues);
  }

  function calculateRevenues() {
    const bookedRevenue = parseFloat(document.getElementById('bookedRevenue').value) || 0;
    const conversionRate = parseFloat(document.getElementById('conversionRate').value) || 1;
    const dealCurrency = document.getElementById('dealCurrency').value;
    
    if (dealCurrency === 'INR') {
      // If deal currency is INR, both revenues are the same
      document.getElementById('bookedRevenueDealCurrency').value = bookedRevenue.toFixed(2);
      document.getElementById('bookedRevenueExecCurrency').value = bookedRevenue.toFixed(2);
    } else {
      // If deal currency is USD, convert to INR for execution currency
      document.getElementById('bookedRevenueDealCurrency').value = bookedRevenue.toFixed(2);
      document.getElementById('bookedRevenueExecCurrency').value = (bookedRevenue * conversionRate).toFixed(2);
    }
  }

  function saveDeal() {
    // Validate required fields
    if (!validateForm()) {
      alert('Please fill all required fields correctly.');
      return false;
    }

    const formData = {
      dealName: document.getElementById('dealName').value,
      vertical: document.getElementById('vertical').value,
      dealType: document.getElementById('dealType').value,
      advertiserName: document.getElementById('advertiserName').value,
      agencyName: document.getElementById('agencyName').value,
      clientName: getSelectedValues('clientName'),
      brandName: getSelectedValues('brandName'),
      productCategory: document.getElementById('productCategory').value,
      channelName: getSelectedValues('channelName'),
      salesPerson: document.getElementById('salesPerson').value,
      plant: document.getElementById('plant').value,
      zone: document.getElementById('zone').value,
      salesGroup: document.getElementById('salesGroup').value,
      startDate: document.getElementById('startDate').value,
      endDate: document.getElementById('endDate').value,
      dealCurrency: document.getElementById('dealCurrency').value,
      bookedRevenue: document.getElementById('bookedRevenue').value,
      conversionRate: document.getElementById('conversionRate').value,
      executionCurrency: document.getElementById('executionCurrency').value,
      bookedRevenueDealCurrency: document.getElementById('bookedRevenueDealCurrency').value,
      bookedRevenueExecCurrency: document.getElementById('bookedRevenueExecCurrency').value,
      dealStatus: 'Active',
      updatedBy: 'Current User',
      updatedAt: new Date().toISOString(),
      createdBy: 'Current User'
    };

    if (currentEditId) {
      // Update existing deal
      const index = deals.findIndex(deal => deal.id === currentEditId);
      if (index !== -1) {
        deals[index] = { 
          ...deals[index], 
          ...formData,
          updatedAt: new Date().toISOString()
        };
      }
    } else {
      // Create new deal
      const newDeal = {
        id: 'DL-' + Date.now(),
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      deals.push(newDeal);
      currentEditId = newDeal.id;
    }

    localStorage.setItem('deals', JSON.stringify(deals));
    renderDeals();
    dealPopup.style.display = 'none';
    
    alert(currentEditId ? 'Deal updated successfully!' : 'Deal created successfully!');
    return true;
  }

  function validateForm() {
    const requiredFields = [
      'dealName', 'vertical', 'dealType', 'advertiserName', 'agencyName',
      'clientName', 'brandName', 'productCategory', 'salesPerson', 'plant',
      'zone', 'salesGroup', 'startDate', 'endDate', 'dealCurrency', 'bookedRevenue'
    ];
    
    for (let field of requiredFields) {
      const element = document.getElementById(field);
      if (!element.value.trim()) {
        element.focus();
        return false;
      }
    }
    
    // Check if at least one channel is selected
    const selectedChannels = getSelectedValues('channelName');
    if (!selectedChannels) {
      document.getElementById('channelName').focus();
      return false;
    }
    
    // Check if at least one brand is selected
    const selectedBrands = getSelectedValues('brandName');
    if (!selectedBrands) {
      document.getElementById('brandName').focus();
      return false;
    }
    
    // Check if at least one client is selected
    const selectedClients = getSelectedValues('clientName');
    if (!selectedClients) {
      document.getElementById('clientName').focus();
      return false;
    }
    
    return true;
  }

  function getSelectedValues(selectId) {
    const select = document.getElementById(selectId);
    const selected = [];
    for (let i = 0; i < select.options.length; i++) {
      if (select.options[i].selected && select.options[i].value) {
        selected.push(select.options[i].value);
      }
    }
    
    // For single select, return the first value
    // For multiple select, return comma-separated string
    if (!select.multiple && selected.length > 0) {
      return selected[0];
    }
    return selected.length > 0 ? selected.join(', ') : '';
  }

  function renderDeals() {
    dealsTableBody.innerHTML = '';
    
    deals.forEach(deal => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>
          <button class="edit-btn" onclick="editDeal('${deal.id}')">Edit</button>
        </td>
        <td><a href="deal-placement.html?dealId=${deal.id}" class="deal-link" target="_blank">${deal.id}</a></td>
        <td>${deal.advertiserName}</td>
        <td>${deal.channelName}</td>
        <td>${formatDate(deal.startDate)}</td>
        <td>${formatDate(deal.endDate)}</td>
        <td>${deal.salesGroup}</td>
        <td>${deal.dealType}</td>
        <td><span class="status-badge active">${deal.dealStatus}</span></td>
        <td>${deal.dealName}</td>
        <td>${deal.vertical}</td>
        <td>${deal.agencyName}</td>
        <td>${deal.clientName}</td>
        <td>${deal.brandName}</td>
        <td>${deal.productCategory}</td>
        <td>${deal.dealCurrency}</td>
        <td>${formatCurrency(deal.bookedRevenueDealCurrency)}</td>
        <td>${deal.conversionRate}</td>
        <td>${formatCurrency(deal.bookedRevenueExecCurrency)}</td>
        <td>${formatCurrency(deal.bookedRevenueDealCurrency)}</td>
        <td>${deal.salesPerson}</td>
        <td>${deal.zone}</td>
        <td>${deal.plant}</td>
        <td>${deal.comments || ''}</td>
        <td>${deal.updatedBy}</td>
        <td>${formatDateTime(deal.updatedAt)}</td>
        <td>${deal.createdBy}</td>
        <td>${formatDateTime(deal.createdAt)}</td>
      `;
      dealsTableBody.appendChild(row);
    });
  }

  window.editDeal = function(dealId) {
    const deal = deals.find(d => d.id === dealId);
    if (deal) {
      currentEditId = dealId;
      popupTitle.textContent = 'Edit Deal';
      
      // Fill form with deal data
      document.getElementById('dealName').value = deal.dealName || '';
      document.getElementById('vertical').value = deal.vertical || '';
      document.getElementById('dealType').value = deal.dealType || '';
      document.getElementById('advertiserName').value = deal.advertiserName || '';
      document.getElementById('agencyName').value = deal.agencyName || '';
      document.getElementById('productCategory').value = deal.productCategory || '';
      document.getElementById('salesPerson').value = deal.salesPerson || '';
      document.getElementById('plant').value = deal.plant || '';
      document.getElementById('zone').value = deal.zone || '';
      document.getElementById('salesGroup').value = deal.salesGroup || '';
      document.getElementById('startDate').value = deal.startDate || '';
      document.getElementById('endDate').value = deal.endDate || '';
      document.getElementById('dealCurrency').value = deal.dealCurrency || '';
      document.getElementById('bookedRevenue').value = deal.bookedRevenue || '';
      document.getElementById('conversionRate').value = deal.conversionRate || '1';
      document.getElementById('executionCurrency').value = deal.executionCurrency || 'INR';
      document.getElementById('bookedRevenueDealCurrency').value = deal.bookedRevenueDealCurrency || '';
      document.getElementById('bookedRevenueExecCurrency').value = deal.bookedRevenueExecCurrency || '';
      
      // Set multiple selections
      setMultipleSelect('channelName', deal.channelName);
      setMultipleSelect('brandName', deal.brandName);
      setMultipleSelect('clientName', deal.clientName);
      
      dealPopup.style.display = 'flex';
    }
  };

  function setMultipleSelect(selectId, values) {
    if (!values) return;
    
    const select = document.getElementById(selectId);
    const valueArray = values.split(',').map(v => v.trim());
    
    for (let i = 0; i < select.options.length; i++) {
      select.options[i].selected = valueArray.includes(select.options[i].value);
    }
  }

  // Utility Functions
  function formatDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN');
  }

  function formatDateTime(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-IN');
  }

  function formatCurrency(amount) {
    if (!amount) return '0.00';
    return parseFloat(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
});