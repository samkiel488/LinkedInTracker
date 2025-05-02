// Main Application
const RentTracker = {
    // Application State
    state: {
        currentUser: {
            id: 1,
            name: "Admin",
            email: "admin@example.com",
            role: "admin",
            avatar: "A"
        },
        clients: [],
        payments: [],
        users: [
            {
                id: 1,
                name: "Admin",
                email: "admin@example.com",
                role: "admin",
                status: "active",
                lastLogin: new Date().toISOString().split('T')[0]
            }
        ],
        settings: {
            darkMode: true,
            currency: "USD",
            dateFormat: "mm/dd/yyyy",
            timezone: "UTC",
            paymentTerms: "net30",
            lateFee: 5,
            paymentMethods: ["paypal", "bank"],
            invoiceTemplate: "simple",
            packageOptions: [
                "100-200 Connections ($20/month)",
                "300-800 Connections ($40/month)",
                "900+ Connections ($60/month)"
            ],
            lastBackup: null
        },
        currentPage: "dashboard",
        currentCalendarDate: new Date()
    },

    // Initialize the application
    init() {
        this.loadData();
        this.setupEventListeners();
        this.render();
    },

    // Load data from localStorage
    loadData() {
        if (this.isLocalStorageSupported()) {
            try {
                const clients = JSON.parse(localStorage.getItem('rentTrackerClients'));
                const payments = JSON.parse(localStorage.getItem('rentTrackerPayments'));
                const users = JSON.parse(localStorage.getItem('rentTrackerUsers'));
                const settings = JSON.parse(localStorage.getItem('rentTrackerSettings'));
                
                if (clients) this.state.clients = clients;
                if (payments) this.state.payments = payments;
                if (users) this.state.users = users;
                if (settings) this.state.settings = {...this.state.settings, ...settings};
                
                // Initialize package options if empty
                if (!this.state.settings.packageOptions || this.state.settings.packageOptions.length === 0) {
                    this.state.settings.packageOptions = [
                        "100-200 Connections ($20/month)",
                        "300-800 Connections ($40/month)",
                        "900+ Connections ($60/month)"
                    ];
                }
            } catch (e) {
                console.error("Error loading data:", e);
            }
        }
    },

    // Save data to localStorage
    saveData() {
        if (this.isLocalStorageSupported()) {
            try {
                localStorage.setItem('rentTrackerClients', JSON.stringify(this.state.clients));
                localStorage.setItem('rentTrackerPayments', JSON.stringify(this.state.payments));
                localStorage.setItem('rentTrackerUsers', JSON.stringify(this.state.users));
                localStorage.setItem('rentTrackerSettings', JSON.stringify(this.state.settings));
            } catch (e) {
                console.error("Error saving data:", e);
            }
        }
    },

    // Check localStorage support
    isLocalStorageSupported() {
        try {
            const testKey = '__test__';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    },

    // Setup event listeners
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link, .sidebar-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.getAttribute('data-page');
                this.navigateTo(page);
            });
        });

        // Dark mode toggle
        document.getElementById('darkModeToggle').addEventListener('change', (e) => {
            this.toggleDarkMode(e.target.checked);
        });

        // Tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabId = e.target.getAttribute('data-tab');
                this.switchTab(tabId, e.target);
            });
        });

        // Mobile menu toggle
        document.getElementById('navToggle').addEventListener('click', () => {
            document.getElementById('navLinks').classList.toggle('active');
        });

        // Sidebar toggle for mobile
        document.getElementById('sidebar').addEventListener('click', (e) => {
            if (window.innerWidth <= 992 && !e.target.closest('.sidebar-link')) {
                document.getElementById('sidebar').classList.remove('active');
            }
        });

        // Modal close buttons
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                this.closeAllModals();
            });
        });

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });

        // Form submissions
        document.getElementById('clientForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveClient();
        });

        document.getElementById('paymentFormModal')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePayment();
        });

        document.getElementById('generalSettingsForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveGeneralSettings();
        });

        document.getElementById('paymentSettingsForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePaymentSettings();
        });

        document.getElementById('userForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveUser();
        });

        // Buttons
        document.getElementById('addClientBtn')?.addEventListener('click', () => {
            this.showModal('addClientModal');
            this.populatePackageDropdown();
        });

        document.getElementById('recordPaymentBtn')?.addEventListener('click', () => {
            this.showModal('recordPaymentModal');
            this.populateClientDropdown();
        });

        document.getElementById('exportClientsBtn')?.addEventListener('click', () => {
            this.showExportModal('clients');
        });

        document.getElementById('exportPaymentsBtn')?.addEventListener('click', () => {
            this.showExportModal('payments');
        });

        document.getElementById('exportAllDataBtn')?.addEventListener('click', () => {
            this.showExportModal('all');
        });

        document.getElementById('importDataBtn')?.addEventListener('click', () => {
            this.showImportModal();
        });

        document.getElementById('backupNowBtn')?.addEventListener('click', () => {
            this.createBackup();
        });

        document.getElementById('restoreBackupBtn')?.addEventListener('click', () => {
            this.restoreBackup();
        });

        document.getElementById('generateReportBtn')?.addEventListener('click', () => {
            this.generateReport();
        });

        document.getElementById('printReportBtn')?.addEventListener('click', () => {
            this.printReport();
        });

        document.getElementById('printPaymentBtn')?.addEventListener('click', () => {
            this.printPaymentReceipt();
        });

        document.getElementById('addUserBtn')?.addEventListener('click', () => {
            this.showModal('addUserModal');
        });

        document.getElementById('refreshBtn')?.addEventListener('click', () => {
            this.render();
        });

        document.getElementById('prevMonthBtn')?.addEventListener('click', () => {
            this.navigateCalendar(-1);
        });

        document.getElementById('nextMonthBtn')?.addEventListener('click', () => {
            this.navigateCalendar(1);
        });

        document.getElementById('todayBtn')?.addEventListener('click', () => {
            this.goToToday();
        });

        document.getElementById('copyBtn')?.addEventListener('click', () => {
            this.copyToClipboard();
        });

        document.getElementById('downloadExportBtn')?.addEventListener('click', () => {
            this.downloadExport();
        });

        document.getElementById('closeExportBtn')?.addEventListener('click', () => {
            this.closeAllModals();
        });

        document.getElementById('uploadImportBtn')?.addEventListener('click', () => {
            document.getElementById('fileImport').click();
        });

        document.getElementById('fileImport')?.addEventListener('change', (e) => {
            this.handleFileImport(e);
        });

        document.getElementById('confirmImportBtn')?.addEventListener('click', () => {
            this.confirmImport();
        });

        document.getElementById('cancelImportBtn')?.addEventListener('click', () => {
            this.closeAllModals();
        });

        document.getElementById('cancelAddClient')?.addEventListener('click', () => {
            this.closeAllModals();
        });

        document.getElementById('cancelPayment')?.addEventListener('click', () => {
            this.closeAllModals();
        });

        document.getElementById('cancelAddUser')?.addEventListener('click', () => {
            this.closeAllModals();
        });

        document.getElementById('closePaymentDetailsBtn')?.addEventListener('click', () => {
            this.closeAllModals();
        });

        // Search and filter
        document.getElementById('clientSearch')?.addEventListener('input', (e) => {
            this.filterClients();
        });

        document.getElementById('clientStatusFilter')?.addEventListener('change', () => {
            this.filterClients();
        });

        document.getElementById('paymentSearch')?.addEventListener('input', (e) => {
            this.filterPayments();
        });

        document.getElementById('paymentStatusFilter')?.addEventListener('change', () => {
            this.filterPayments();
        });

        document.getElementById('paymentDateFilter')?.addEventListener('change', (e) => {
            const value = e.target.value;
            const customRange = document.getElementById('customDateRange');
            customRange.style.display = value === 'custom' ? 'flex' : 'none';
            this.filterPayments();
        });

        document.getElementById('customDateFrom')?.addEventListener('change', () => {
            this.filterPayments();
        });

        document.getElementById('customDateTo')?.addEventListener('change', () => {
            this.filterPayments();
        });
    },

    // Navigation
    navigateTo(page) {
        this.state.currentPage = page;
        this.render();
    },

    // Switch between tabs
    switchTab(tabId, tabElement) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // Deactivate all tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // Activate selected tab
        tabElement.classList.add('active');
        document.getElementById(tabId).classList.add('active');
    },

    // Toggle dark mode
    toggleDarkMode(enabled) {
        this.state.settings.darkMode = enabled;
        document.body.classList.toggle('dark-mode', enabled);
        this.saveData();
    },

    // Render the application
    render() {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.style.display = 'none';
        });

        // Show current page
        document.getElementById(`${this.state.currentPage}-page`).style.display = 'block';

        // Update active nav links
        document.querySelectorAll('.nav-link, .sidebar-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === this.state.currentPage) {
                link.classList.add('active');
            }
        });

        // Render specific page content
        switch(this.state.currentPage) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'clients':
                this.renderClients();
                break;
            case 'payments':
                this.renderPayments();
                break;
            case 'calendar':
                this.renderCalendar();
                break;
            case 'reports':
                this.renderReports();
                break;
            case 'settings':
                this.renderSettings();
                break;
        }

        // Update user info
        document.getElementById('userName').textContent = this.state.currentUser.name;
        document.getElementById('userAvatar').textContent = this.state.currentUser.avatar;

        // Apply dark mode if enabled
        document.getElementById('darkModeToggle').checked = this.state.settings.darkMode;
    },

    // Render dashboard page
    renderDashboard() {
        // Update stats
        document.getElementById('totalClients').textContent = this.state.clients.length;
        
        let monthlyRevenue = 0;
        let paidThisMonth = 0;
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        this.state.clients.forEach(client => {
            const amount = this.getAmountFromPackage(client.package);
            monthlyRevenue += amount;
            
            const lastPayment = this.getLastPayment(client.name);
            if (lastPayment && lastPayment.status === 'paid' && 
                new Date(lastPayment.date).getMonth() === currentMonth &&
                new Date(lastPayment.date).getFullYear() === currentYear) {
                paidThisMonth++;
            }
        });
        
        document.getElementById('monthlyRevenue').textContent = this.formatCurrency(monthlyRevenue);
        document.getElementById('paidThisMonth').textContent = paidThisMonth;
        
        // Calculate pending payments
        const pendingPayments = this.state.clients.filter(client => {
            const status = this.getClientPaymentStatus(client);
            return status !== 'paid';
        }).length;
        
        document.getElementById('pendingPayments').textContent = pendingPayments;
        
        // Render recent activity
        this.renderRecentActivity();
        
        // Render due payments
        this.renderDuePayments();
        
        // Render revenue chart
        this.renderRevenueChart();
    },

    // Render clients page
    renderClients() {
        this.filterClients();
    },

    // Filter clients based on search and status
    filterClients() {
        const searchTerm = document.getElementById('clientSearch').value.toLowerCase();
        const statusFilter = document.getElementById('clientStatusFilter').value;
        
        const filteredClients = this.state.clients.filter(client => {
            const matchesSearch = client.name.toLowerCase().includes(searchTerm) || 
                                (client.email && client.email.toLowerCase().includes(searchTerm));
            
            let matchesStatus = true;
            if (statusFilter !== 'all') {
                const status = this.getClientPaymentStatus(client);
                matchesStatus = status === statusFilter || 
                              (statusFilter === 'overdue' && status === 'overdue');
            }
            
            return matchesSearch && matchesStatus;
        });
        
        const tableBody = document.getElementById('clientsTable');
        tableBody.innerHTML = '';
        
        filteredClients.forEach(client => {
            const status = this.getClientPaymentStatus(client);
            const amount = this.getAmountFromPackage(client.package);
            const nextPayment = this.getNextPaymentDate(client);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.sanitizeHTML(client.name)}</td>
                <td>${client.startDate}</td>
                <td>${nextPayment}</td>
                <td>${this.sanitizeHTML(client.package)}</td>
                <td>${this.formatCurrency(amount)}</td>
                <td class="${this.getStatusClass(status)}">${status}</td>
                <td>
                    <button class="button" onclick="RentTracker.editClient('${this.sanitizeHTML(client.name)}')">Edit</button>
                    <button class="button-secondary" onclick="RentTracker.deleteClient('${this.sanitizeHTML(client.name)}')">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    },

    // Render payments page
    renderPayments() {
        this.filterPayments();
    },

    // Filter payments based on search, status and date range
    filterPayments() {
        const searchTerm = document.getElementById('paymentSearch').value.toLowerCase();
        const statusFilter = document.getElementById('paymentStatusFilter').value;
        const dateFilter = document.getElementById('paymentDateFilter').value;
        
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        let dateFrom, dateTo;
        
        switch(dateFilter) {
            case 'this-month':
                dateFrom = new Date(currentYear, currentMonth, 1);
                dateTo = new Date(currentYear, currentMonth + 1, 0);
                break;
            case 'last-month':
                dateFrom = new Date(currentYear, currentMonth - 1, 1);
                dateTo = new Date(currentYear, currentMonth, 0);
                break;
            case 'this-year':
                dateFrom = new Date(currentYear, 0, 1);
                dateTo = new Date(currentYear, 11, 31);
                break;
            case 'custom':
                const fromValue = document.getElementById('customDateFrom').value;
                const toValue = document.getElementById('customDateTo').value;
                dateFrom = fromValue ? new Date(fromValue) : null;
                dateTo = toValue ? new Date(toValue) : null;
                break;
            default: // 'all'
                dateFrom = null;
                dateTo = null;
        }
        
        const filteredPayments = this.state.payments.filter(payment => {
            const client = this.state.clients.find(c => c.name === payment.client);
            const matchesSearch = payment.client.toLowerCase().includes(searchTerm) || 
                                (client && client.email && client.email.toLowerCase().includes(searchTerm)) ||
                                payment.reference?.toLowerCase().includes(searchTerm);
            
            const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
            
            let matchesDate = true;
            if (dateFrom && dateTo) {
                const paymentDate = new Date(payment.date);
                matchesDate = paymentDate >= dateFrom && paymentDate <= dateTo;
            }
            
            return matchesSearch && matchesStatus && matchesDate;
        });
        
        const tableBody = document.getElementById('paymentsTable');
        tableBody.innerHTML = '';
        
        filteredPayments.forEach(payment => {
            const client = this.state.clients.find(c => c.name === payment.client);
            const amountDue = client ? this.getAmountFromPackage(client.package) : 0;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.sanitizeHTML(payment.client)}</td>
                <td>${payment.date}</td>
                <td>${client ? this.sanitizeHTML(client.package) : 'N/A'}</td>
                <td>${this.formatCurrency(amountDue)}</td>
                <td>${this.formatCurrency(payment.amount)}</td>
                <td class="${this.getStatusClass(payment.status)}">${payment.status}</td>
                <td>
                    <button class="button" onclick="RentTracker.viewPaymentDetails('${payment.id}')">Details</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    },

    // Render calendar page
    renderCalendar() {
        const container = document.getElementById('calendarContainer');
        container.innerHTML = '';
        
        const monthNames = ["January", "February", "March", "April", "May", "June",
                          "July", "August", "September", "October", "November", "December"];
        
        const currentDate = this.state.currentCalendarDate;
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        document.getElementById('calendarMonthYear').textContent = 
            `${monthNames[currentMonth]} ${currentYear}`;
        
        // Create calendar grid
        const calendar = document.createElement('div');
        calendar.className = 'calendar';
        
        // Add day headers
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        days.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-header';
            dayHeader.textContent = day;
            calendar.appendChild(dayHeader);
        });
        
        // Get first day of month and total days in month
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day empty';
            calendar.appendChild(emptyCell);
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            
            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = day;
            dayCell.appendChild(dayNumber);
            
            // Find payments due on this day
            const paymentsDue = this.state.clients.filter(client => {
                const nextPaymentDate = this.getNextPaymentDate(client);
                const dueDate = new Date(nextPaymentDate);
                return dueDate.getDate() === day && 
                       dueDate.getMonth() === currentMonth && 
                       dueDate.getFullYear() === currentYear;
            });
            
            // Add payment events
            paymentsDue.forEach(client => {
                const event = document.createElement('div');
                event.className = 'calendar-event';
                event.textContent = `${client.name}: ${this.formatCurrency(this.getAmountFromPackage(client.package))}`;
                event.onclick = () => this.recordPaymentForClient(client.name);
                dayCell.appendChild(event);
            });
            
            // Highlight today
            const today = new Date();
            if (day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
                dayCell.style.border = '2px solid var(--primary-color)';
            }
            
            calendar.appendChild(dayCell);
        }
        
        container.appendChild(calendar);
    },

    // Navigate calendar months
    navigateCalendar(months) {
        const newDate = new Date(this.state.currentCalendarDate);
        newDate.setMonth(newDate.getMonth() + months);
        this.state.currentCalendarDate = newDate;
        this.renderCalendar();
    },

    // Go to today in calendar
    goToToday() {
        this.state.currentCalendarDate = new Date();
        this.renderCalendar();
    },

    // Render reports page
    renderReports() {
        // Render financial reports
        this.renderFinancialReports();
        
        // Render client reports
        this.renderClientReports();
        
        // Render payment reports
        this.renderPaymentReports();
    },

    // Render financial reports
    renderFinancialReports() {
        const tableBody = document.getElementById('financialReportsTable');
        tableBody.innerHTML = '';
        
        // Group payments by month
        const monthlyData = {};
        const currentYear = new Date().getFullYear();
        
        this.state.payments.forEach(payment => {
            const date = new Date(payment.date);
            if (date.getFullYear() !== currentYear) return;
            
            const month = date.getMonth();
            if (!monthlyData[month]) {
                monthlyData[month] = {
                    paid: 0,
                    clients: new Set()
                };
            }
            
            monthlyData[month].paid += payment.amount;
            monthlyData[month].clients.add(payment.client);
        });
        
        // Calculate expected revenue and other stats
        const monthNames = ["January", "February", "March", "April", "May", "June",
                          "July", "August", "September", "October", "November", "December"];
        
        let annualRevenue = 0;
        let totalPaidClients = 0;
        let totalUnpaidClients = 0;
        
        monthNames.forEach((monthName, monthIndex) => {
            const monthData = monthlyData[monthIndex] || { paid: 0, clients: new Set() };
            const paidClients = monthData.clients.size;
            
            // Calculate expected revenue from all active clients
            let expectedRevenue = 0;
            const activeClients = this.state.clients.filter(client => {
                const startDate = new Date(client.startDate);
                return startDate <= new Date(currentYear, monthIndex + 1, 0);
            });
            
            activeClients.forEach(client => {
                expectedRevenue += this.getAmountFromPackage(client.package);
            });
            
            const difference = monthData.paid - expectedRevenue;
            annualRevenue += monthData.paid;
            
            // Count unpaid clients
            const unpaidClients = activeClients.length - paidClients;
            totalPaidClients += paidClients;
            totalUnpaidClients += unpaidClients;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${monthName}</td>
                <td>${this.formatCurrency(expectedRevenue)}</td>
                <td>${this.formatCurrency(monthData.paid)}</td>
                <td class="${difference >= 0 ? 'paid' : 'not-paid'}">${this.formatCurrency(difference)}</td>
                <td>${paidClients}</td>
                <td>${unpaidClients}</td>
            `;
            tableBody.appendChild(row);
        });
        
        // Update annual revenue
        document.getElementById('annualRevenue').textContent = this.formatCurrency(annualRevenue);
        
        // Render annual revenue chart
        this.renderAnnualRevenueChart();
        
        // Render payment status chart
        this.renderPaymentStatusChart();
    },

    // Render annual revenue chart
    renderAnnualRevenueChart() {
        const ctx = document.getElementById('annualRevenueChart').getContext('2d');
        
        // Group payments by quarter
        const quarterlyData = [0, 0, 0, 0];
        const currentYear = new Date().getFullYear();
        
        this.state.payments.forEach(payment => {
            const date = new Date(payment.date);
            if (date.getFullYear() !== currentYear) return;
            
            const month = date.getMonth();
            const quarter = Math.floor(month / 3);
            quarterlyData[quarter] += payment.amount;
        });
        
        const data = {
            labels: ['Q1', 'Q2', 'Q3', 'Q4'],
            datasets: [{
                label: 'Quarterly Revenue',
                data: quarterlyData,
                backgroundColor: [
                    'rgba(40, 167, 69, 0.2)',
                    'rgba(0, 119, 181, 0.2)',
                    'rgba(255, 193, 7, 0.2)',
                    'rgba(220, 53, 69, 0.2)'
                ],
                borderColor: [
                    'rgba(40, 167, 69, 1)',
                    'rgba(0, 119, 181, 1)',
                    'rgba(255, 193, 7, 1)',
                    'rgba(220, 53, 69, 1)'
                ],
                borderWidth: 1
            }]
        };
        
        new Chart(ctx, {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    },

    // Render payment status chart
    renderPaymentStatusChart() {
        const ctx = document.getElementById('paymentStatusChart').getContext('2d');
        
        // Count payment statuses
        let paid = 0, partial = 0, unpaid = 0, overdue = 0;
        
        this.state.clients.forEach(client => {
            const status = this.getClientPaymentStatus(client);
            switch(status) {
                case 'paid': paid++; break;
                case 'partial-paid': partial++; break;
                case 'not-paid': unpaid++; break;
                case 'overdue': overdue++; break;
            }
        });
        
        const total = paid + partial + unpaid + overdue;
        if (total === 0) return; // No data to display
        
        const data = {
            labels: ['Paid', 'Partial', 'Unpaid', 'Overdue'],
            datasets: [{
                data: [
                    Math.round((paid / total) * 100),
                    Math.round((partial / total) * 100),
                    Math.round((unpaid / total) * 100),
                    Math.round((overdue / total) * 100)
                ],
                backgroundColor: [
                    'rgba(40, 167, 69, 0.7)',
                    'rgba(255, 193, 7, 0.7)',
                    'rgba(108, 117, 125, 0.7)',
                    'rgba(220, 53, 69, 0.7)'
                ],
                borderColor: [
                    'rgba(40, 167, 69, 1)',
                    'rgba(255, 193, 7, 1)',
                    'rgba(108, 117, 125, 1)',
                    'rgba(220, 53, 69, 1)'
                ],
                borderWidth: 1
            }]
        };
        
        new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.raw}%`;
                            }
                        }
                    }
                }
            }
        });
    },

    // Render client reports
    renderClientReports() {
        const tableBody = document.getElementById('clientReportsTable');
        tableBody.innerHTML = '';
        
        this.state.clients.forEach(client => {
            const totalPaid = this.getTotalPaid(client.name);
            const lastPayment = this.getLastPayment(client.name);
            const status = this.getClientPaymentStatus(client);
            const daysSincePayment = lastPayment ? 
                Math.floor((new Date() - new Date(lastPayment.date)) / (1000 * 60 * 60 * 24)) : 'N/A';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.sanitizeHTML(client.name)}</td>
                <td>${client.startDate}</td>
                <td>${this.formatCurrency(totalPaid)}</td>
                <td>${lastPayment ? lastPayment.date : 'N/A'}</td>
                <td class="${this.getStatusClass(status)}">${status}</td>
                <td>${daysSincePayment}</td>
            `;
            tableBody.appendChild(row);
        });
    },

    // Render payment reports
    renderPaymentReports() {
        const tableBody = document.getElementById('paymentReportsTable');
        tableBody.innerHTML = '';
        
        const dateRanges = [
            { label: 'Last 7 Days', days: 7 },
            { label: 'Last 30 Days', days: 30 },
            { label: 'Last 90 Days', days: 90 },
            { label: 'This Year', days: 365 }
        ];
        
        const today = new Date();
        
        dateRanges.forEach(range => {
            const fromDate = new Date(today);
            fromDate.setDate(fromDate.getDate() - range.days);
            
            const paymentsInRange = this.state.payments.filter(payment => {
                const paymentDate = new Date(payment.date);
                return paymentDate >= fromDate && paymentDate <= today;
            });
            
            const totalPayments = paymentsInRange.length;
            const totalAmount = paymentsInRange.reduce((sum, payment) => sum + payment.amount, 0);
            const averagePayment = totalPayments > 0 ? totalAmount / totalPayments : 0;
            
            // Count on-time payments (within 7 days of due date)
            let onTimePayments = 0;
            paymentsInRange.forEach(payment => {
                const client = this.state.clients.find(c => c.name === payment.client);
                if (client) {
                    const dueDate = new Date(this.getNextPaymentDate(client));
                    const paymentDate = new Date(payment.date);
                    const daysDifference = Math.floor((paymentDate - dueDate) / (1000 * 60 * 60 * 24));
                    if (daysDifference <= 7 && daysDifference >= 0) {
                        onTimePayments++;
                    }
                }
            });
            
            const latePayments = totalPayments - onTimePayments;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${range.label}</td>
                <td>${totalPayments}</td>
                <td>${this.formatCurrency(totalAmount)}</td>
                <td>${this.formatCurrency(averagePayment)}</td>
                <td>${onTimePayments}</td>
                <td>${latePayments}</td>
            `;
            tableBody.appendChild(row);
        });
    },

    // Render settings page
    renderSettings() {
        // Render general settings
        document.getElementById('systemName').value = 'LinkedIn Rent Tracker';
        document.getElementById('defaultCurrency').value = this.state.settings.currency;
        document.getElementById('dateFormat').value = this.state.settings.dateFormat;
        document.getElementById('timezone').value = this.state.settings.timezone;
        
        // Render payment settings
        document.getElementById('paymentTerms').value = this.state.settings.paymentTerms;
        document.getElementById('lateFee').value = this.state.settings.lateFee;
        document.getElementById('paypal').checked = this.state.settings.paymentMethods.includes('paypal');
        document.getElementById('bankTransfer').checked = this.state.settings.paymentMethods.includes('bank');
        document.getElementById('creditCard').checked = this.state.settings.paymentMethods.includes('credit');
        document.getElementById('invoiceTemplate').value = this.state.settings.invoiceTemplate;
        document.getElementById('packageOptions').value = this.state.settings.packageOptions.join('\n');
        
        // Render users table
        this.renderUsersTable();
        
        // Render backup info
        document.getElementById('lastBackupDate').textContent = 
            this.state.settings.lastBackup ? new Date(this.state.settings.lastBackup).toLocaleString() : 'Never';
    },

    // Render users table
    renderUsersTable() {
        const tableBody = document.getElementById('usersTable');
        tableBody.innerHTML = '';
        
        this.state.users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.sanitizeHTML(user.name)}</td>
                <td>${this.sanitizeHTML(user.email)}</td>
                <td>${this.sanitizeHTML(user.role)}</td>
                <td>${user.lastLogin || 'Never'}</td>
                <td class="${user.status === 'active' ? 'paid' : 'not-paid'}">${user.status}</td>
                <td>
                    <button class="button" onclick="RentTracker.editUser('${user.id}')">Edit</button>
                    ${user.id !== 1 ? `<button class="button-secondary" onclick="RentTracker.deleteUser('${user.id}')">Delete</button>` : ''}
                </td>
            `;
            tableBody.appendChild(row);
        });
    },

    // Render recent activity
    renderRecentActivity() {
        const tableBody = document.getElementById('activityTable');
        tableBody.innerHTML = '';
        
        // Get recent payments (last 5)
        const recentPayments = [...this.state.payments]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);
        
        recentPayments.forEach(payment => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.sanitizeHTML(payment.client)}</td>
                <td>${payment.date}</td>
                <td>Payment ${payment.status}</td>
                <td>${this.formatCurrency(payment.amount)}</td>
                <td class="${this.getStatusClass(payment.status)}">${payment.status}</td>
            `;
            tableBody.appendChild(row);
        });
    },

    // Render due payments
    renderDuePayments() {
        const tableBody = document.getElementById('duePaymentsTable');
        tableBody.innerHTML = '';
        
        this.state.clients.forEach(client => {
            const status = this.getClientPaymentStatus(client);
            if (status === 'paid') return;
            
            const amount = this.getAmountFromPackage(client.package);
            const nextPayment = this.getNextPaymentDate(client);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.sanitizeHTML(client.name)}</td>
                <td>${nextPayment}</td>
                <td>${this.sanitizeHTML(client.package)}</td>
                <td>${this.formatCurrency(amount)}</td>
                <td class="${this.getStatusClass(status)}">${status}</td>
                <td>
                    <button class="button" onclick="RentTracker.recordPaymentForClient('${this.sanitizeHTML(client.name)}')">Record Payment</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    },

    // Render revenue chart
    renderRevenueChart() {
        const ctx = document.getElementById('revenueChart').getContext('2d');
        
        // Group payments by month for the last 6 months
        const monthlyRevenue = {};
        const today = new Date();
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date(today);
            date.setMonth(date.getMonth() - i);
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            monthlyRevenue[monthKey] = 0;
        }
        
        this.state.payments.forEach(payment => {
            const paymentDate = new Date(payment.date);
            const sixMonthsAgo = new Date(today);
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            
            if (paymentDate >= sixMonthsAgo && paymentDate <= today) {
                const monthKey = `${paymentDate.getFullYear()}-${paymentDate.getMonth()}`;
                if (monthlyRevenue[monthKey] !== undefined) {
                    monthlyRevenue[monthKey] += payment.amount;
                }
            }
        });
        
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const labels = [];
        const data = [];
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date(today);
            date.setMonth(date.getMonth() - i);
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            
            labels.push(`${monthNames[date.getMonth()]} ${date.getFullYear().toString().slice(2)}`);
            data.push(monthlyRevenue[monthKey] || 0);
        }
        
        const chartData = {
            labels: labels,
            datasets: [{
                label: 'Monthly Revenue',
                data: data,
                backgroundColor: 'rgba(0, 119, 181, 0.2)',
                borderColor: 'rgba(0, 119, 181, 1)',
                borderWidth: 1
            }]
        };
        
        new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    },

    // Show modal
    showModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    },

    // Close all modals
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    },

    // Save client
    saveClient() {
        const name = document.getElementById('modalClientName').value.trim();
        const email = document.getElementById('modalClientEmail').value.trim();
        const startDate = document.getElementById('modalClientStartDate').value;
        const packageName = document.getElementById('modalClientPackage').value;
        const paymentFrequency = document.getElementById('modalPaymentFrequency').value;
        const paymentMethod = document.getElementById('modalPaymentMethod').value;
        const notes = document.getElementById('modalClientNotes').value;
        
        // Validate
        if (!name || !startDate || !packageName || !paymentFrequency) {
            alert('Please fill in all required fields');
            return;
        }
        
        // Check for duplicate client name
        const existingIndex = this.state.clients.findIndex(c => c.name === name);
        if (existingIndex >= 0 && !confirm(`Client "${name}" already exists. Update existing client?`)) {
            return;
        }
        
        // Create or update client
        const client = {
            name,
            email,
            startDate,
            package: packageName,
            paymentFrequency,
            paymentMethod,
            notes,
            status: 'active'
        };
        
        if (existingIndex >= 0) {
            this.state.clients[existingIndex] = client;
        } else {
            this.state.clients.push(client);
        }
        
        this.saveData();
        this.closeAllModals();
        this.render();
        
        // Show success message
        alert(`Client ${existingIndex >= 0 ? 'updated' : 'added'} successfully!`);
    },

    // Save payment
    savePayment() {
        const clientName = document.getElementById('paymentClient').value;
        const date = document.getElementById('paymentDate').value;
        const amount = parseFloat(document.getElementById('paymentAmount').value);
        const status = document.getElementById('paymentStatus').value;
        const method = document.getElementById('paymentMethod').value;
        const reference = document.getElementById('paymentReference').value;
        const notes = document.getElementById('paymentNotes').value;
        
        // Validate
        if (!clientName || !date || isNaN(amount) || !status || !method) {
            alert('Please fill in all required fields');
            return;
        }
        
        // Check if amount is valid
        const client = this.state.clients.find(c => c.name === clientName);
        if (!client) {
            alert('Client not found');
            return;
        }
        
        const amountDue = this.getAmountFromPackage(client.package);
        if (status === 'paid' && amount < amountDue) {
            if (!confirm(`Amount paid (${this.formatCurrency(amount)}) is less than amount due (${this.formatCurrency(amountDue)}). Continue as partial payment?`)) {
                return;
            }
        }
        
        // Create payment
        const payment = {
            id: Date.now().toString(),
            client: clientName,
            date,
            amount,
            status,
            method,
            reference,
            notes
        };
        
        this.state.payments.push(payment);
        this.saveData();
        this.closeAllModals();
        this.render();
        
        // Show success message
        alert('Payment recorded successfully!');
    },

    // Save general settings
    saveGeneralSettings() {
        const systemName = document.getElementById('systemName').value;
        const currency = document.getElementById('defaultCurrency').value;
        const dateFormat = document.getElementById('dateFormat').value;
        const timezone = document.getElementById('timezone').value;
        
        this.state.settings.currency = currency;
        this.state.settings.dateFormat = dateFormat;
        this.state.settings.timezone = timezone;
        
        this.saveData();
        alert('General settings saved successfully!');
    },

    // Save payment settings
    savePaymentSettings() {
        const paymentTerms = document.getElementById('paymentTerms').value;
        const lateFee = parseFloat(document.getElementById('lateFee').value);
        const invoiceTemplate = document.getElementById('invoiceTemplate').value;
        const packageOptions = document.getElementById('packageOptions').value.split('\n').filter(p => p.trim());
        
        // Get selected payment methods
        const paymentMethods = [];
        if (document.getElementById('paypal').checked) paymentMethods.push('paypal');
        if (document.getElementById('bankTransfer').checked) paymentMethods.push('bank');
        if (document.getElementById('creditCard').checked) paymentMethods.push('credit');
        
        this.state.settings.paymentTerms = paymentTerms;
        this.state.settings.lateFee = lateFee;
        this.state.settings.paymentMethods = paymentMethods;
        this.state.settings.invoiceTemplate = invoiceTemplate;
        this.state.settings.packageOptions = packageOptions;
        
        this.saveData();
        alert('Payment settings saved successfully!');
    },

    // Save user
    saveUser() {
        const name = document.getElementById('userName').value.trim();
        const email = document.getElementById('userEmail').value.trim();
        const role = document.getElementById('userRole').value;
        const status = document.getElementById('userStatus').value;
        const password = document.getElementById('userPassword').value;
        const confirmPassword = document.getElementById('userConfirmPassword').value;
        
        // Validate
        if (!name || !email || !role || !status || !password || !confirmPassword) {
            alert('Please fill in all required fields');
            return;
        }
        
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        
        if (password.length < 8) {
            alert('Password must be at least 8 characters');
            return;
        }
        
        // Check for duplicate email
        const existingUser = this.state.users.find(u => u.email === email);
        if (existingUser) {
            alert('User with this email already exists');
            return;
        }
        
        // Create user (in a real app, you would hash the password)
        const user = {
            id: Date.now(),
            name,
            email,
            role,
            status,
            lastLogin: null
        };
        
        this.state.users.push(user);
        this.saveData();
        this.closeAllModals();
        this.render();
        
        alert('User added successfully!');
    },

    // Edit client
    editClient(name) {
        const client = this.state.clients.find(c => c.name === name);
        if (!client) return;
        
        // Fill form with client data
        document.getElementById('modalClientName').value = client.name;
        document.getElementById('modalClientEmail').value = client.email || '';
        document.getElementById('modalClientStartDate').value = client.startDate;
        document.getElementById('modalClientPackage').value = client.package;
        document.getElementById('modalPaymentFrequency').value = client.paymentFrequency || 'monthly';
        document.getElementById('modalPaymentMethod').value = client.paymentMethod || 'paypal';
        document.getElementById('modalClientNotes').value = client.notes || '';
        
        this.showModal('addClientModal');
    },

    // Edit user
    editUser(userId) {
        const user = this.state.users.find(u => u.id === userId);
        if (!user) return;
        
        // Fill form with user data
        document.getElementById('userName').value = user.name;
        document.getElementById('userEmail').value = user.email;
        document.getElementById('userRole').value = user.role;
        document.getElementById('userStatus').value = user.status;
        
        // Clear passwords
        document.getElementById('userPassword').value = '';
        document.getElementById('userConfirmPassword').value = '';
        
        this.showModal('addUserModal');
    },

    // Delete client
    deleteClient(name) {
        if (!confirm(`Are you sure you want to delete client ${name}? This will also delete all associated payments.`)) return;
        
        this.state.clients = this.state.clients.filter(c => c.name !== name);
        this.state.payments = this.state.payments.filter(p => p.client !== name);
        this.saveData();
        this.render();
        
        alert('Client deleted successfully!');
    },

    // Delete user
    deleteUser(userId) {
        if (userId === 1) {
            alert('Cannot delete the admin user');
            return;
        }
        
        if (!confirm('Are you sure you want to delete this user?')) return;
        
        this.state.users = this.state.users.filter(u => u.id !== userId);
        this.saveData();
        this.render();
        
        alert('User deleted successfully!');
    },

    // Record payment for a specific client
    recordPaymentForClient(name) {
        const client = this.state.clients.find(c => c.name === name);
        if (!client) return;
        
        // Fill payment form with client data
        document.getElementById('paymentClient').value = client.name;
        document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('paymentAmount').value = this.getAmountFromPackage(client.package);
        document.getElementById('paymentStatus').value = 'paid';
        document.getElementById('paymentMethod').value = client.paymentMethod || 'paypal';
        
        this.showModal('recordPaymentModal');
    },

    // View payment details
    viewPaymentDetails(paymentId) {
        const payment = this.state.payments.find(p => p.id === paymentId);
        if (!payment) return;
        
        const client = this.state.clients.find(c => c.name === payment.client);
        const amountDue = client ? this.getAmountFromPackage(client.package) : 0;
        
        const content = document.getElementById('paymentDetailsContent');
        content.innerHTML = `
            <h3>Payment Details</h3>
            <div class="client-details" style="margin-top: 15px;">
                <div class="detail-item">
                    <span class="detail-label">Client</span>
                    <span>${this.sanitizeHTML(payment.client)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Date</span>
                    <span>${payment.date}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Amount Due</span>
                    <span>${this.formatCurrency(amountDue)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Amount Paid</span>
                    <span>${this.formatCurrency(payment.amount)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Status</span>
                    <span class="${this.getStatusClass(payment.status)}">${payment.status}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Method</span>
                    <span>${payment.method}</span>
                </div>
                ${payment.reference ? `
                <div class="detail-item">
                    <span class="detail-label">Reference</span>
                    <span>${this.sanitizeHTML(payment.reference)}</span>
                </div>
                ` : ''}
                ${payment.notes ? `
                <div class="detail-item">
                    <span class="detail-label">Notes</span>
                    <span>${this.sanitizeHTML(payment.notes)}</span>
                </div>
                ` : ''}
            </div>
        `;
        
        this.showModal('paymentDetailsModal');
    },

    // Show export modal
    showExportModal(type) {
        this.showModal('exportModal');
        document.getElementById('exportType').value = type;
        this.generateExportData();
    },

    // Generate export data
    generateExportData() {
        const type = document.getElementById('exportType').value;
        const format = document.getElementById('exportFormat').value;
        
        let data;
        
        switch(type) {
            case 'clients':
                data = this.state.clients;
                break;
            case 'payments':
                data = this.state.payments;
                break;
            case 'all':
                data = {
                    clients: this.state.clients,
                    payments: this.state.payments,
                    users: this.state.users,
                    settings: this.state.settings
                };
                break;
        }
        
        let exportText;
        
        switch(format) {
            case 'json':
                exportText = JSON.stringify(data, null, 2);
                break;
            case 'csv':
                exportText = this.convertToCSV(data);
                break;
            case 'excel':
                // For simplicity, we'll use CSV for Excel export
                exportText = this.convertToCSV(data);
                break;
        }
        
        document.getElementById('exportData').value = exportText;
    },

    // Convert data to CSV
    convertToCSV(data) {
        if (Array.isArray(data)) {
            if (data.length === 0) return '';
            
            // Extract headers
            const headers = Object.keys(data[0]);
            
            // Create CSV rows
            const rows = data.map(obj => {
                return headers.map(header => {
                    let value = obj[header];
                    // Handle nested objects
                    if (typeof value === 'object' && value !== null) {
                        value = JSON.stringify(value);
                    }
                    // Escape quotes and wrap in quotes if contains comma
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        value = `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                }).join(',');
            });
            
            return [headers.join(','), ...rows].join('\n');
        } else {
            // For object data (like 'all' export), we'll create multiple CSV sections
            let csv = '';
            for (const key in data) {
                csv += `=== ${key.toUpperCase()} ===\n`;
                csv += this.convertToCSV(data[key]);
                csv += '\n\n';
            }
            return csv;
        }
    },

    // Show import modal
    showImportModal() {
        this.showModal('importModal');
        document.getElementById('importData').value = '';
        document.getElementById('importError').style.display = 'none';
    },

    // Handle file import
    handleFileImport(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            document.getElementById('importData').value = event.target.result;
        };
        reader.readAsText(file);
    },

    // Confirm import
    confirmImport() {
        const type = document.getElementById('importType').value;
        const format = document.getElementById('importFormat').value;
        const importText = document.getElementById('importData').value.trim();
        const errorElement = document.getElementById('importError');
        
        if (!importText) {
            errorElement.textContent = 'Please provide data to import';
            errorElement.style.display = 'block';
            return;
        }
        
        try {
            let data;
            
            if (format === 'json') {
                data = JSON.parse(importText);
            } else if (format === 'csv') {
                data = this.parseCSV(importText);
            }
            
            if (!data) {
                throw new Error('Invalid data format');
            }
            
            // Validate and import data
            switch(type) {
                case 'clients':
                    if (!Array.isArray(data)) throw new Error('Clients data should be an array');
                    this.state.clients = data;
                    break;
                case 'payments':
                    if (!Array.isArray(data)) throw new Error('Payments data should be an array');
                    this.state.payments = data;
                    break;
                case 'all':
                    if (!data.clients || !data.payments || !data.users || !data.settings) {
                        throw new Error('Complete data import requires clients, payments, users and settings');
                    }
                    this.state.clients = data.clients;
                    this.state.payments = data.payments;
                    this.state.users = data.users;
                    this.state.settings = {...this.state.settings, ...data.settings};
                    break;
            }
            
            this.saveData();
            this.closeAllModals();
            this.render();
            
            alert('Data imported successfully!');
        } catch (error) {
            errorElement.textContent = `Import error: ${error.message}`;
            errorElement.style.display = 'block';
        }
    },

    // Parse CSV data
    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];
        
        const headers = lines[0].split(',').map(h => h.trim());
        const result = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const obj = {};
            
            for (let j = 0; j < headers.length; j++) {
                let value = values[j] || '';
                // Remove surrounding quotes if present
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.substring(1, value.length - 1);
                }
                obj[headers[j]] = value;
            }
            
            result.push(obj);
        }
        
        return result;
    },

    // Create backup
    createBackup() {
        const backupData = {
            clients: this.state.clients,
            payments: this.state.payments,
            users: this.state.users,
            settings: this.state.settings,
            timestamp: new Date().toISOString()
        };
        
        this.state.settings.lastBackup = new Date().toISOString();
        this.saveData();
        
        // In a real app, you might save this to a server or cloud storage
        localStorage.setItem('rentTrackerBackup', JSON.stringify(backupData));
        
        alert('Backup created successfully!');
        this.render();
    },

    // Restore backup
    restoreBackup() {
        if (!confirm('Are you sure you want to restore from backup? This will overwrite current data.')) return;
        
        const backupData = JSON.parse(localStorage.getItem('rentTrackerBackup'));
        if (!backupData) {
            alert('No backup found');
            return;
        }
        
        this.state.clients = backupData.clients || [];
        this.state.payments = backupData.payments || [];
        this.state.users = backupData.users || [];
        this.state.settings = {...this.state.settings, ...backupData.settings};
        
        this.saveData();
        this.render();
        
        alert('Backup restored successfully!');
    },

    // Generate report
    generateReport() {
        // In a real app, this might generate a PDF or more detailed report
        alert('Report generated (this would create a detailed report in a real application)');
    },

    // Print report
    printReport() {
        window.print();
    },

    // Print payment receipt
    printPaymentReceipt() {
        // In a real app, this would generate a printable receipt
        const paymentDetails = document.getElementById('paymentDetailsContent').innerHTML;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Payment Receipt</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #0077b5; }
                    .detail-item { margin-bottom: 10px; }
                    .detail-label { font-weight: bold; }
                </style>
            </head>
            <body>
                <h1>Payment Receipt</h1>
                ${paymentDetails}
                <script>
                    window.onload = function() { window.print(); };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    },

    // Copy to clipboard
    copyToClipboard() {
        const exportText = document.getElementById('exportData');
        exportText.select();
        document.execCommand('copy');
        alert('Copied to clipboard!');
    },

    // Download export
    downloadExport() {
        const exportText = document.getElementById('exportData').value;
        const type = document.getElementById('exportType').value;
        const format = document.getElementById('exportFormat').value;
        
        if (!exportText) {
            alert('No data to export');
            return;
        }
        
        const blob = new Blob([exportText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rent_tracker_${type}_export.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    // Get client payment status
    getClientPaymentStatus(client) {
        const lastPayment = this.getLastPayment(client.name);
        if (!lastPayment) return 'not-paid';
        
        const today = new Date();
        const nextPaymentDate = this.getNextPaymentDate(client, lastPayment.date);
        const dueDate = new Date(nextPaymentDate);
        
        if (lastPayment.status === 'paid') {
            const daysUntilDue = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
            
            if (daysUntilDue < 0) return 'overdue';
            if (daysUntilDue <= 7) return 'due-soon';
            return 'paid';
        }
        
        if (lastPayment.status === 'partial') return 'partial-paid';
        return 'not-paid';
    },

    // Get last payment for a client
    getLastPayment(clientName) {
        const clientPayments = this.state.payments
            .filter(p => p.client === clientName)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        return clientPayments[0];
    },

    // Get next payment date for a client
    getNextPaymentDate(client, lastPaymentDate = null) {
        const baseDate = lastPaymentDate || client.startDate;
        const date = new Date(baseDate);
        
        switch(client.paymentFrequency) {
            case 'monthly':
                date.setMonth(date.getMonth() + 1);
                break;
            case 'quarterly':
                date.setMonth(date.getMonth() + 3);
                break;
            // Default to monthly if not specified
            default:
                date.setMonth(date.getMonth() + 1);
        }
        
        return date.toISOString().split('T')[0];
    },

    // Get total paid by a client
    getTotalPaid(clientName) {
        return this.state.payments
            .filter(p => p.client === clientName && p.status === 'paid')
            .reduce((sum, payment) => sum + payment.amount, 0);
    },

    // Get amount from package string
    getAmountFromPackage(pkg) {
        if (!pkg) return 0;
        const match = pkg.match(/\$(\d+)/);
        return match ? parseInt(match[1]) : 0;
    },

    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: this.state.settings.currency || 'USD'
        }).format(amount);
    },

    // Get status class
    getStatusClass(status) {
        switch(status) {
            case 'paid': return 'paid';
            case 'partial-paid': return 'partial-paid';
            case 'not-paid': return 'not-paid';
            case 'due-soon': return 'due-soon';
            case 'overdue': return 'overdue';
            default: return '';
        }
    },

    // Sanitize HTML
    sanitizeHTML(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Populate client dropdown in payment modal
    populateClientDropdown() {
        const select = document.getElementById('paymentClient');
        select.innerHTML = '<option value="">Select Client</option>';
        
        this.state.clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.name;
            option.textContent = client.name;
            select.appendChild(option);
        });
    },

    // Populate package dropdown in client modal
    populatePackageDropdown() {
        const select = document.getElementById('modalClientPackage');
        select.innerHTML = '<option value="">Select Package</option>';
        
        this.state.settings.packageOptions.forEach(pkg => {
            const option = document.createElement('option');
            option.value = pkg;
            option.textContent = pkg;
            select.appendChild(option);
        });
    }
};

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    RentTracker.init();
});