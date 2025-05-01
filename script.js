// Main Application
const RentTracker = {
    // Application State
    state: {
        clients: [],
        payments: [],
        currentPage: "dashboard"
    },

    // Initialize the application
    init() {
        this.loadData();
        this.setupEventListeners();
        this.render();
    },

    // Load data from localStorage
    loadData() {
        try {
            this.state.clients = JSON.parse(localStorage.getItem('rentTrackerClients')) || [];
            this.state.payments = JSON.parse(localStorage.getItem('rentTrackerPayments')) || [];
        } catch (e) {
            console.error("Error loading data:", e);
        }
    },

    // Save data to localStorage
    saveData() {
        try {
            localStorage.setItem('rentTrackerClients', JSON.stringify(this.state.clients));
            localStorage.setItem('rentTrackerPayments', JSON.stringify(this.state.payments));
        } catch (e) {
            console.error("Error saving data:", e);
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

        // Mobile menu toggle
        document.getElementById('navToggle')?.addEventListener('click', () => {
            document.getElementById('navLinks').classList.toggle('active');
        });

        // Sidebar toggle for mobile
        document.getElementById('sidebar')?.addEventListener('click', (e) => {
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

        // Buttons
        document.getElementById('addClientBtn')?.addEventListener('click', () => {
            this.showModal('addClientModal');
        });

        document.getElementById('recordPaymentBtn')?.addEventListener('click', () => {
            this.showModal('recordPaymentModal');
            this.populateClientDropdown();
        });

        document.getElementById('refreshBtn')?.addEventListener('click', () => {
            this.render();
        });

        // Search functionality
        document.getElementById('clientSearch')?.addEventListener('input', (e) => {
            this.filterClients(e.target.value);
        });
    },

    // Navigation
    navigateTo(page) {
        this.state.currentPage = page;
        this.render();
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
        }
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
        
        // Render clients table
        const tableBody = document.getElementById('clientsTable');
        tableBody.innerHTML = '';
        
        this.state.clients.forEach(client => {
            const status = this.getClientPaymentStatus(client);
            const amount = this.getAmountFromPackage(client.package);
            const nextPayment = this.getNextPaymentDate(client);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.sanitizeHTML(client.name)}</td>
                <td>${nextPayment}</td>
                <td>${this.sanitizeHTML(client.package)}</td>
                <td>${this.formatCurrency(amount)}</td>
                <td class="${this.getStatusClass(status)}">${status}</td>
            `;
            tableBody.appendChild(row);
        });
    },

    // Render clients page
    renderClients() {
        const tableBody = document.getElementById('clientsTableFull');
        tableBody.innerHTML = '';
        
        this.state.clients.forEach(client => {
            const status = this.getClientPaymentStatus(client);
            const amount = this.getAmountFromPackage(client.package);
            const nextPayment = this.getNextPaymentDate(client);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.sanitizeHTML(client.name)}</td>
                <td>${client.startDate || 'N/A'}</td>
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
        const tableBody = document.getElementById('paymentsTable');
        tableBody.innerHTML = '';
        
        this.state.payments.forEach(payment => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.sanitizeHTML(payment.client)}</td>
                <td>${payment.date}</td>
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
        
        // Create calendar header
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.textContent = 'Payment Calendar';
        container.appendChild(header);
        
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
        
        // Add days (simplified version)
        for (let i = 1; i <= 31; i++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            
            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = i;
            dayCell.appendChild(dayNumber);
            
            // Add example events (in a real app, these would be actual payments)
            if (i % 5 === 0) {
                const event = document.createElement('div');
                event.className = 'calendar-event';
                event.textContent = 'Payment Due: Client ' + i;
                dayCell.appendChild(event);
            }
            
            calendar.appendChild(dayCell);
        }
        
        container.appendChild(calendar);
    },

    // Filter clients by search term
    filterClients(searchTerm) {
        const term = searchTerm.toLowerCase();
        const rows = document.querySelectorAll('#clientsTableFull tr');
        
        rows.forEach(row => {
            const name = row.cells[0].textContent.toLowerCase();
            row.style.display = name.includes(term) ? '' : 'none';
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
        const packageName = document.getElementById('modalClientPackage').value;
        
        // Validate
        if (!name || !packageName) {
            alert('Please fill in all required fields');
            return;
        }
        
        // Create or update client
        const existingIndex = this.state.clients.findIndex(c => c.name === name);
        const client = {
            name,
            package: packageName,
            startDate: new Date().toISOString().split('T')[0],
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
    },

    // Edit client
    editClient(name) {
        const client = this.state.clients.find(c => c.name === name);
        if (!client) return;
        
        // Fill form with client data
        document.getElementById('modalClientName').value = client.name;
        document.getElementById('modalClientPackage').value = client.package;
        
        this.showModal('addClientModal');
    },

    // Delete client
    deleteClient(name) {
        if (!confirm(`Are you sure you want to delete client ${name}?`)) return;
        
        this.state.clients = this.state.clients.filter(c => c.name !== name);
        this.state.payments = this.state.payments.filter(p => p.client !== name);
        this.saveData();
        this.render();
    },

    // Populate client dropdown for payments
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

    // Save payment
    savePayment() {
        const clientName = document.getElementById('paymentClient').value;
        const amount = parseFloat(document.getElementById('paymentAmount').value);
        
        // Validate
        if (!clientName || isNaN(amount)) {
            alert('Please fill in all required fields');
            return;
        }
        
        // Create payment
        const payment = {
            id: Date.now().toString(),
            client: clientName,
            date: new Date().toISOString().split('T')[0],
            amount,
            status: 'paid'
        };
        
        this.state.payments.push(payment);
        this.saveData();
        this.closeAllModals();
        this.render();
    },

    // View payment details
    viewPaymentDetails(paymentId) {
        const payment = this.state.payments.find(p => p.id === paymentId);
        if (!payment) return;
        
        alert(`Payment Details:\nClient: ${payment.client}\nDate: ${payment.date}\nAmount: ${this.formatCurrency(payment.amount)}\nStatus: ${payment.status}`);
    },

    // Get client payment status
    getClientPaymentStatus(client) {
        const lastPayment = this.getLastPayment(client.name);
        if (!lastPayment) return 'not-paid';
        
        const today = new Date();
        const nextPaymentDate = this.getNextPaymentDate(client, lastPayment.date);
        
        if (lastPayment.status === 'paid') {
            const daysUntilNext = Math.floor((new Date(nextPaymentDate) - today) / (1000 * 60 * 60 * 24));
            
            if (daysUntilNext < 0) return 'overdue';
            if (daysUntilNext <= 7) return 'due-soon';
            return 'paid';
        }
        
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
        const baseDate = lastPaymentDate || client.startDate || new Date().toISOString().split('T')[0];
        const date = new Date(baseDate);
        date.setMonth(date.getMonth() + 1); // Default to monthly
        return date.toISOString().split('T')[0];
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
            currency: 'USD'
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
    }
};

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    RentTracker.init();
    
    // Demo: Add some sample data if empty
    if (RentTracker.state.clients.length === 0) {
        RentTracker.state.clients = [
            {
                name: 'John Doe',
                package: '100-200 Connections ($20/month)',
                startDate: '2023-01-01',
                status: 'active'
            },
            {
                name: 'Jane Smith',
                package: '300-800 Connections ($40/month)',
                startDate: '2023-02-15',
                status: 'active'
            }
        ];
        
        RentTracker.state.payments = [
            {
                id: '1',
                client: 'John Doe',
                date: '2023-01-01',
                amount: 20,
                status: 'paid'
            },
            {
                id: '2',
                client: 'John Doe',
                date: '2023-02-01',
                amount: 20,
                status: 'paid'
            },
            {
                id: '3',
                client: 'Jane Smith',
                date: '2023-02-15',
                amount: 40,
                status: 'paid'
            }
        ];
        
        RentTracker.saveData();
    }
});